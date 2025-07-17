-- Admin access setup and enhanced logging system
-- This ensures cryptokoh@gmail.com has admin access and adds comprehensive tracking

-- Set up admin user for cryptokoh@gmail.com
-- First, let's update any existing profile for this email
UPDATE profiles 
SET user_type = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'cryptokoh@gmail.com'
);

-- Create function to automatically set admin status for cryptokoh@gmail.com when they sign up
CREATE OR REPLACE FUNCTION set_admin_for_cryptokoh()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is cryptokoh@gmail.com, set them as admin
  IF NEW.email = 'cryptokoh@gmail.com' THEN
    INSERT INTO profiles (
      id, 
      user_type, 
      full_name,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      'admin',
      'Admin User',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      user_type = 'admin',
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-assign admin role
DROP TRIGGER IF EXISTS auto_admin_cryptokoh ON auth.users;
CREATE TRIGGER auto_admin_cryptokoh
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION set_admin_for_cryptokoh();

-- Enhanced space sharer applications with detailed logging
ALTER TABLE space_sharer_applications 
ADD COLUMN IF NOT EXISTS submission_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS review_history JSONB DEFAULT '[]';

-- Enhanced spaces table with submission tracking
ALTER TABLE spaces
ADD COLUMN IF NOT EXISTS submission_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS submission_ip INET,
ADD COLUMN IF NOT EXISTS submission_user_agent TEXT,
ADD COLUMN IF NOT EXISTS review_history JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS approval_notes TEXT;

-- Application audit log table for comprehensive tracking
CREATE TABLE IF NOT EXISTS application_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'approved', 'rejected', 'reviewed'
  old_values JSONB,
  new_values JSONB,
  performed_by UUID REFERENCES profiles(id),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS on audit log
ALTER TABLE application_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
ON application_audit_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type IN ('admin', 'moderator')
  )
);

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON application_audit_log FOR INSERT
TO authenticated
WITH CHECK (true);

-- Function to log application changes
CREATE OR REPLACE FUNCTION log_application_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the change
  INSERT INTO application_audit_log (
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    performed_by,
    performed_at,
    notes
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN 
        CASE NEW.status
          WHEN 'approved' THEN 'approved'
          WHEN 'rejected' THEN 'rejected'
          WHEN 'under_review' THEN 'reviewed'
          ELSE 'updated'
        END
      ELSE 'updated'
    END,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW) END,
    auth.uid(),
    NOW(),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'Application submitted'
      WHEN TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN 
        'Status changed from ' || OLD.status || ' to ' || NEW.status
      ELSE 'Application updated'
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for audit logging
DROP TRIGGER IF EXISTS space_sharer_applications_audit ON space_sharer_applications;
CREATE TRIGGER space_sharer_applications_audit
  AFTER INSERT OR UPDATE OR DELETE ON space_sharer_applications
  FOR EACH ROW
  EXECUTE FUNCTION log_application_change();

DROP TRIGGER IF EXISTS spaces_audit ON spaces;
CREATE TRIGGER spaces_audit
  AFTER INSERT OR UPDATE OR DELETE ON spaces
  FOR EACH ROW
  EXECUTE FUNCTION log_application_change();

-- Function to get application statistics for admins
CREATE OR REPLACE FUNCTION get_application_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_applications', (SELECT COUNT(*) FROM space_sharer_applications),
    'pending_applications', (SELECT COUNT(*) FROM space_sharer_applications WHERE status = 'pending'),
    'approved_applications', (SELECT COUNT(*) FROM space_sharer_applications WHERE status = 'approved'),
    'rejected_applications', (SELECT COUNT(*) FROM space_sharer_applications WHERE status = 'rejected'),
    'under_review_applications', (SELECT COUNT(*) FROM space_sharer_applications WHERE status = 'under_review'),
    'total_spaces', (SELECT COUNT(*) FROM spaces),
    'active_spaces', (SELECT COUNT(*) FROM spaces WHERE status = 'approved'),
    'pending_spaces', (SELECT COUNT(*) FROM spaces WHERE status = 'pending_approval'),
    'recent_applications', (
      SELECT json_agg(
        json_build_object(
          'id', id,
          'user_id', user_id,
          'status', status,
          'created_at', created_at
        )
      )
      FROM space_sharer_applications 
      ORDER BY created_at DESC 
      LIMIT 5
    ),
    'recent_audit_events', (
      SELECT json_agg(
        json_build_object(
          'action', action,
          'table_name', table_name,
          'performed_at', performed_at,
          'notes', notes
        )
      )
      FROM application_audit_log 
      ORDER BY performed_at DESC 
      LIMIT 10
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to admins
GRANT EXECUTE ON FUNCTION get_application_stats() TO authenticated;

-- Update existing applications with submission metadata
UPDATE space_sharer_applications 
SET submission_metadata = json_build_object(
  'submitted_at', created_at,
  'version', '1.0',
  'platform', 'web',
  'features_used', array['application_form', 'profile_integration']
)
WHERE submission_metadata = '{}';

-- Update existing spaces with submission metadata  
UPDATE spaces
SET submission_metadata = json_build_object(
  'submitted_at', created_at,
  'version', '1.0',
  'platform', 'web',
  'debug_enabled', true,
  'submission_flow', 'modal_based'
)
WHERE submission_metadata = '{}';

-- Comments for documentation
COMMENT ON TABLE application_audit_log IS 'Comprehensive audit trail for all application and space changes';
COMMENT ON FUNCTION get_application_stats() IS 'Returns comprehensive statistics for admin dashboard';
COMMENT ON COLUMN space_sharer_applications.submission_metadata IS 'JSON metadata about the submission process';
COMMENT ON COLUMN space_sharer_applications.review_history IS 'Array of review actions and timestamps';
COMMENT ON COLUMN spaces.submission_metadata IS 'JSON metadata about the space submission process';
COMMENT ON COLUMN spaces.review_history IS 'Array of review actions and timestamps for the space';