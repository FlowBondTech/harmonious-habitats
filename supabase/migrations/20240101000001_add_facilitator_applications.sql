-- Add facilitator application system to existing schema

-- Update spaces table to support facilitator applications
ALTER TABLE spaces 
ADD COLUMN allow_facilitator_applications BOOLEAN DEFAULT false,
ADD COLUMN application_requirements JSONB DEFAULT '{}',
ADD COLUMN booking_preferences JSONB DEFAULT '{}';

-- Update profiles table to support facilitator data
ALTER TABLE profiles 
ADD COLUMN is_facilitator BOOLEAN DEFAULT false,
ADD COLUMN facilitator_verified BOOLEAN DEFAULT false,
ADD COLUMN facilitator_data JSONB DEFAULT '{}';

-- Create space_applications table
CREATE TABLE space_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  facilitator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')) DEFAULT 'pending',
  application_data JSONB DEFAULT '{}',
  owner_response JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_space_applications_space_id ON space_applications(space_id);
CREATE INDEX idx_space_applications_facilitator_id ON space_applications(facilitator_id);
CREATE INDEX idx_space_applications_status ON space_applications(status);
CREATE INDEX idx_space_applications_created_at ON space_applications(created_at);

-- Create updated_at trigger for space_applications
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_space_applications_updated_at BEFORE UPDATE
    ON space_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE space_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Facilitators can create applications
CREATE POLICY "Facilitators can create applications" ON space_applications
  FOR INSERT TO authenticated
  USING (auth.uid() = facilitator_id);

-- Policy: Space owners and facilitators can view their applications
CREATE POLICY "View own applications" ON space_applications
  FOR SELECT TO authenticated
  USING (
    auth.uid() = facilitator_id OR
    EXISTS (
      SELECT 1 FROM spaces 
      WHERE spaces.id = space_applications.space_id 
      AND spaces.owner_id = auth.uid()
    )
  );

-- Policy: Space owners can update applications (approve/reject)
CREATE POLICY "Space owners can update applications" ON space_applications
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM spaces 
      WHERE spaces.id = space_applications.space_id 
      AND spaces.owner_id = auth.uid()
    )
  );

-- Policy: Facilitators can withdraw their applications
CREATE POLICY "Facilitators can withdraw applications" ON space_applications
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = facilitator_id AND 
    status = 'pending'
  );

-- Policy: Space owners can delete applications
CREATE POLICY "Space owners can delete applications" ON space_applications
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM spaces 
      WHERE spaces.id = space_applications.space_id 
      AND spaces.owner_id = auth.uid()
    )
  );

-- Create notifications for space applications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add RLS for notifications if not already exists
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Function to create application notifications
CREATE OR REPLACE FUNCTION create_application_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify space owner of new application
  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (user_id, type, title, content, data)
    SELECT 
      spaces.owner_id,
      'space_application',
      'New Space Application',
      profiles.full_name || ' has applied to use your space ' || spaces.name,
      jsonb_build_object(
        'application_id', NEW.id,
        'space_id', NEW.space_id,
        'facilitator_id', NEW.facilitator_id,
        'status', NEW.status
      )
    FROM spaces
    JOIN profiles ON profiles.id = NEW.facilitator_id
    WHERE spaces.id = NEW.space_id;
    
    RETURN NEW;
  END IF;
  
  -- Notify facilitator of status change
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO notifications (user_id, type, title, content, data)
    SELECT 
      NEW.facilitator_id,
      'application_status',
      'Application Status Update',
      CASE 
        WHEN NEW.status = 'approved' THEN 'Your application for ' || spaces.name || ' has been approved!'
        WHEN NEW.status = 'rejected' THEN 'Your application for ' || spaces.name || ' has been declined.'
        ELSE 'Your application status has been updated.'
      END,
      jsonb_build_object(
        'application_id', NEW.id,
        'space_id', NEW.space_id,
        'status', NEW.status
      )
    FROM spaces
    WHERE spaces.id = NEW.space_id;
    
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for application notifications
CREATE TRIGGER application_notification_trigger
  AFTER INSERT OR UPDATE ON space_applications
  FOR EACH ROW EXECUTE FUNCTION create_application_notification();

-- Add comments for documentation
COMMENT ON TABLE space_applications IS 'Applications from facilitators to use spaces';
COMMENT ON COLUMN spaces.allow_facilitator_applications IS 'Whether this space accepts applications from facilitators';
COMMENT ON COLUMN spaces.application_requirements IS 'JSON object containing requirements for facilitator applications';
COMMENT ON COLUMN spaces.booking_preferences IS 'JSON object containing booking preferences and constraints';
COMMENT ON COLUMN profiles.is_facilitator IS 'Whether this user is a facilitator';
COMMENT ON COLUMN profiles.facilitator_verified IS 'Whether this facilitator has been verified';
COMMENT ON COLUMN profiles.facilitator_data IS 'JSON object containing facilitator profile data (certifications, specialties, etc.)';