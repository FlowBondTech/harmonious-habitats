-- Space Sharer Application System
-- Users apply to become space sharers, admins approve/reject

-- Space Sharer Applications Table
CREATE TABLE space_sharer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  application_data JSONB NOT NULL DEFAULT '{}',
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')) DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure one application per user
  UNIQUE(user_id)
);

-- Add space_sharer status and user_type to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS space_sharer_status TEXT CHECK (space_sharer_status IN ('none', 'pending', 'approved', 'rejected')) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS space_sharer_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS user_type TEXT CHECK (user_type IN ('user', 'admin', 'moderator')) DEFAULT 'user';

-- Update spaces table to require approved space sharer status
ALTER TABLE spaces 
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT true;

-- RLS Policies for space_sharer_applications
ALTER TABLE space_sharer_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users can view their own space sharer applications"
ON space_sharer_applications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own applications
CREATE POLICY "Users can insert their own space sharer applications"
ON space_sharer_applications FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own pending applications
CREATE POLICY "Users can update their own pending space sharer applications"
ON space_sharer_applications FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status = 'pending')
WITH CHECK (user_id = auth.uid() AND status = 'pending');

-- Admins can view all applications
CREATE POLICY "Admins can view all space sharer applications"
ON space_sharer_applications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type IN ('admin', 'moderator')
  )
);

-- Admins can update applications (for approval/rejection)
CREATE POLICY "Admins can update space sharer applications"
ON space_sharer_applications FOR UPDATE
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

-- Function to update profile status when application is approved/rejected
CREATE OR REPLACE FUNCTION update_space_sharer_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile status based on application status
  UPDATE profiles 
  SET 
    space_sharer_status = NEW.status,
    space_sharer_approved_at = CASE 
      WHEN NEW.status = 'approved' THEN CURRENT_TIMESTAMP 
      ELSE NULL 
    END
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update profile status
CREATE TRIGGER update_space_sharer_status_trigger
  AFTER UPDATE ON space_sharer_applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_space_sharer_status();

-- Update spaces table RLS policy to only allow approved space sharers to create spaces
-- (Note: Using RLS instead of CHECK constraint because PostgreSQL doesn't allow subqueries in CHECK)

-- Drop existing space creation policy and recreate with space sharer validation
DROP POLICY IF EXISTS "Users can insert their own spaces" ON spaces;

CREATE POLICY "Approved space sharers can insert spaces"
ON spaces FOR INSERT
TO authenticated
WITH CHECK (
  owner_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.space_sharer_status = 'approved' OR profiles.user_type IN ('admin', 'moderator'))
  )
);

-- Comments for documentation
COMMENT ON TABLE space_sharer_applications IS 'Applications from users who want to become space sharers';
COMMENT ON COLUMN space_sharer_applications.application_data IS 'JSON data containing application details like experience, motivation, etc.';
COMMENT ON COLUMN profiles.space_sharer_status IS 'Current status of user as space sharer: none, pending, approved, rejected';
COMMENT ON COLUMN profiles.space_sharer_approved_at IS 'Timestamp when user was approved as space sharer';