/*
  # Initial Data Setup for Holistic Spaces

  1. Setup Functions
    - Function to create first admin user
    - Function to generate initial invite codes
    - Function to seed sample data

  2. Initial Data
    - Create first admin invite code
    - Set up sample spaces (optional)

  3. Instructions
    - After running this migration, sign up with the generated invite code
    - The first user will automatically become admin
    - Generate more invite codes from the admin panel
*/

-- Function to setup initial invite code for first admin
CREATE OR REPLACE FUNCTION setup_initial_admin_code()
RETURNS text AS $$
DECLARE
  admin_code text;
BEGIN
  -- Only create if no invite codes exist
  IF NOT EXISTS (SELECT 1 FROM invite_codes) THEN
    -- Generate a special admin invite code
    admin_code := 'ADMIN001';
    
    INSERT INTO invite_codes (code, created_by, expires_at)
    VALUES (admin_code, NULL, now() + interval '7 days');
    
    RETURN admin_code;
  END IF;
  
  RETURN 'CODES_EXIST';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically make the first user admin
CREATE OR REPLACE FUNCTION trigger_make_first_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is the first user, make them admin
  IF (SELECT COUNT(*) FROM user_profiles) = 1 THEN
    UPDATE user_profiles 
    SET is_admin = true 
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-promote first user
DROP TRIGGER IF EXISTS auto_make_first_admin ON user_profiles;
CREATE TRIGGER auto_make_first_admin
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_make_first_admin();

-- Setup the initial admin code
SELECT setup_initial_admin_code() as initial_admin_code;