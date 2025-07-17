-- Unified SHARE System: Space Holders and Time Holders
-- This creates a simplified, elegant system for users to share space or time

-- First, let's create the unified holder applications table
CREATE TABLE holder_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  holder_type TEXT[] NOT NULL CHECK (array_length(holder_type, 1) > 0), -- Can be ['space'], ['time'], or ['space', 'time']
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')) DEFAULT 'pending',
  
  -- Application data varies by type
  application_data JSONB NOT NULL DEFAULT '{}',
  
  -- Admin fields
  admin_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Tracking
  submission_metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure one application per user
  UNIQUE(user_id)
);

-- Update profiles to track holder status
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS holder_status JSONB DEFAULT '{"space": "none", "time": "none"}',
ADD COLUMN IF NOT EXISTS holder_approved_at JSONB DEFAULT '{}';

-- Time offerings table (parallel to spaces table)
CREATE TABLE time_offerings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holder_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Basic info
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'workshop', 'healing', 'class', 'consultation', 'ceremony', etc.
  
  -- Offering details
  duration_minutes INTEGER NOT NULL,
  min_participants INTEGER DEFAULT 1,
  max_participants INTEGER DEFAULT 1,
  
  -- Availability
  availability_type TEXT CHECK (availability_type IN ('recurring', 'on_demand', 'scheduled')) DEFAULT 'on_demand',
  availability_data JSONB DEFAULT '{}', -- Stores schedule patterns, available dates, etc.
  
  -- Location preferences
  location_type TEXT CHECK (location_type IN ('holder_space', 'participant_space', 'virtual', 'flexible')) DEFAULT 'flexible',
  location_radius INTEGER DEFAULT 5, -- miles willing to travel
  
  -- Contribution/Exchange
  suggested_donation TEXT,
  exchange_type TEXT CHECK (exchange_type IN ('donation', 'fixed', 'sliding_scale', 'barter', 'free')) DEFAULT 'donation',
  
  -- Status
  status TEXT CHECK (status IN ('draft', 'active', 'paused', 'archived')) DEFAULT 'draft',
  verified BOOLEAN DEFAULT false,
  
  -- Requirements
  requirements JSONB DEFAULT '{}', -- Prerequisites, what to bring, etc.
  
  -- Images
  image_urls TEXT[] DEFAULT '{}',
  
  -- Tracking
  submission_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categories for time offerings
CREATE TABLE time_offering_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id UUID REFERENCES time_offerings(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  UNIQUE(offering_id, category)
);

-- Skills/modalities for time offerings
CREATE TABLE time_offering_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id UUID REFERENCES time_offerings(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  UNIQUE(offering_id, skill)
);

-- Unified view of all contributions
CREATE VIEW user_contributions AS
  SELECT 
    'space' as contribution_type,
    s.id,
    s.owner_id as contributor_id,
    s.name as title,
    s.description,
    s.status,
    s.created_at,
    s.image_urls,
    json_build_object(
      'type', s.type,
      'capacity', s.capacity,
      'address', s.address
    ) as details
  FROM spaces s
  UNION ALL
  SELECT 
    'time' as contribution_type,
    t.id,
    t.holder_id as contributor_id,
    t.title,
    t.description,
    t.status,
    t.created_at,
    t.image_urls,
    json_build_object(
      'category', t.category,
      'duration', t.duration_minutes,
      'participants', json_build_object('min', t.min_participants, 'max', t.max_participants)
    ) as details
  FROM time_offerings t;

-- Function to update holder status when application is approved/rejected
CREATE OR REPLACE FUNCTION update_holder_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile holder status based on application status
  IF NEW.status = 'approved' THEN
    -- Set approved status for each holder type
    UPDATE profiles 
    SET 
      holder_status = jsonb_set(
        jsonb_set(
          holder_status,
          '{space}',
          CASE WHEN 'space' = ANY(NEW.holder_type) THEN '"approved"'::jsonb ELSE holder_status->'space' END
        ),
        '{time}',
        CASE WHEN 'time' = ANY(NEW.holder_type) THEN '"approved"'::jsonb ELSE holder_status->'time' END
      ),
      holder_approved_at = jsonb_set(
        jsonb_set(
          COALESCE(holder_approved_at, '{}'::jsonb),
          '{space}',
          CASE WHEN 'space' = ANY(NEW.holder_type) THEN to_jsonb(NOW()) ELSE COALESCE(holder_approved_at->'space', 'null'::jsonb) END
        ),
        '{time}',
        CASE WHEN 'time' = ANY(NEW.holder_type) THEN to_jsonb(NOW()) ELSE COALESCE(holder_approved_at->'time', 'null'::jsonb) END
      )
    WHERE id = NEW.user_id;
  ELSIF NEW.status = 'rejected' THEN
    -- Set rejected status
    UPDATE profiles 
    SET 
      holder_status = jsonb_set(
        jsonb_set(
          holder_status,
          '{space}',
          CASE WHEN 'space' = ANY(NEW.holder_type) THEN '"rejected"'::jsonb ELSE holder_status->'space' END
        ),
        '{time}',
        CASE WHEN 'time' = ANY(NEW.holder_type) THEN '"rejected"'::jsonb ELSE holder_status->'time' END
      )
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update profile status
CREATE TRIGGER update_holder_status_trigger
  AFTER UPDATE ON holder_applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_holder_status();

-- RLS Policies for holder_applications
ALTER TABLE holder_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users can view their own holder applications"
ON holder_applications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own applications
CREATE POLICY "Users can insert their own holder applications"
ON holder_applications FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own pending applications
CREATE POLICY "Users can update their own pending holder applications"
ON holder_applications FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status = 'pending')
WITH CHECK (user_id = auth.uid() AND status = 'pending');

-- Admins can view all applications
CREATE POLICY "Admins can view all holder applications"
ON holder_applications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type IN ('admin', 'moderator')
  )
);

-- Admins can update applications
CREATE POLICY "Admins can update holder applications"
ON holder_applications FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type IN ('admin', 'moderator')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type IN ('admin', 'moderator')
  )
);

-- RLS for time_offerings
ALTER TABLE time_offerings ENABLE ROW LEVEL SECURITY;

-- Anyone can view active time offerings
CREATE POLICY "Anyone can view active time offerings"
ON time_offerings FOR SELECT
TO authenticated
USING (status = 'active' OR holder_id = auth.uid());

-- Approved time holders can insert offerings
CREATE POLICY "Approved time holders can insert offerings"
ON time_offerings FOR INSERT
TO authenticated
WITH CHECK (
  holder_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.holder_status->>'time' = 'approved' OR profiles.user_type IN ('admin', 'moderator'))
  )
);

-- Holders can update their own offerings
CREATE POLICY "Holders can update their own offerings"
ON time_offerings FOR UPDATE
TO authenticated
USING (holder_id = auth.uid())
WITH CHECK (holder_id = auth.uid());

-- Holders can delete their own offerings
CREATE POLICY "Holders can delete their own offerings"
ON time_offerings FOR DELETE
TO authenticated
USING (holder_id = auth.uid());

-- RLS for time offering categories and skills
ALTER TABLE time_offering_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_offering_skills ENABLE ROW LEVEL SECURITY;

-- Similar policies for categories and skills
CREATE POLICY "Users can manage their offering categories"
ON time_offering_categories FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM time_offerings 
    WHERE time_offerings.id = time_offering_categories.offering_id 
    AND time_offerings.holder_id = auth.uid()
  )
);

CREATE POLICY "Users can view offering categories"
ON time_offering_categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage their offering skills"
ON time_offering_skills FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM time_offerings 
    WHERE time_offerings.id = time_offering_skills.offering_id 
    AND time_offerings.holder_id = auth.uid()
  )
);

CREATE POLICY "Users can view offering skills"
ON time_offering_skills FOR SELECT
TO authenticated
USING (true);

-- Migrate existing space_sharer_applications to new system
INSERT INTO holder_applications (
  user_id,
  holder_type,
  status,
  application_data,
  admin_notes,
  reviewed_by,
  reviewed_at,
  submission_metadata,
  created_at,
  updated_at
)
SELECT 
  user_id,
  ARRAY['space']::TEXT[],
  status,
  application_data,
  admin_notes,
  reviewed_by,
  reviewed_at,
  submission_metadata,
  created_at,
  updated_at
FROM space_sharer_applications
ON CONFLICT (user_id) DO NOTHING;

-- Update existing profiles with new holder_status
UPDATE profiles 
SET holder_status = jsonb_build_object(
  'space', 
  CASE 
    WHEN space_sharer_status = 'approved' THEN 'approved'
    WHEN space_sharer_status = 'pending' THEN 'pending'
    WHEN space_sharer_status = 'rejected' THEN 'rejected'
    ELSE 'none'
  END,
  'time', 'none'
)
WHERE space_sharer_status IS NOT NULL;

-- Comments for documentation
COMMENT ON TABLE holder_applications IS 'Unified applications for users wanting to share space or time';
COMMENT ON TABLE time_offerings IS 'Time-based offerings from approved time holders (workshops, classes, healing sessions, etc.)';
COMMENT ON VIEW user_contributions IS 'Unified view of all user contributions (spaces and time offerings)';