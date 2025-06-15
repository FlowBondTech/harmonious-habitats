/*
  # Create Default Admin User and Invite Code

  1. New Tables
    - Creates a default admin invite code for easy access
    
  2. Security
    - Creates a special admin invite code that can be used to create the first admin user
    
  3. Default Data
    - Inserts the admin invite code "ADMIN001" that never expires
*/

-- Insert a default admin invite code that never expires
INSERT INTO invite_codes (code, created_by, is_used, expires_at, created_at)
VALUES ('ADMIN001', NULL, false, NULL, now())
ON CONFLICT (code) DO NOTHING;

-- Create a function to automatically make the first user an admin
CREATE OR REPLACE FUNCTION make_first_user_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the first user profile being created
  IF (SELECT COUNT(*) FROM user_profiles) = 1 THEN
    -- Make this user an admin
    NEW.is_admin = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically make first user admin
DROP TRIGGER IF EXISTS auto_make_first_user_admin ON user_profiles;
CREATE TRIGGER auto_make_first_user_admin
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION make_first_user_admin();