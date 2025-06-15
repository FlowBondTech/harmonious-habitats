/*
  # Admin Functions for Invite Code Management

  1. Functions
    - `generate_invite_code_admin` - Generate new invite codes with optional expiry
    - `use_invite_code` - Mark invite code as used when user signs up

  2. Security
    - Functions are secured and can only be called by authenticated users
    - Admin functions check for admin privileges
*/

-- Function to generate invite codes (admin only)
CREATE OR REPLACE FUNCTION generate_invite_code_admin(
  expires_at timestamptz DEFAULT NULL,
  created_by_id uuid DEFAULT NULL
)
RETURNS text AS $$
DECLARE
  code_length integer := 8;
  characters text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Generate random code
  FOR i IN 1..code_length LOOP
    result := result || substr(characters, floor(random() * length(characters) + 1)::integer, 1);
  END LOOP;
  
  -- Check if code already exists, if so, generate a new one
  WHILE EXISTS (SELECT 1 FROM invite_codes WHERE code = result) LOOP
    result := '';
    FOR i IN 1..code_length LOOP
      result := result || substr(characters, floor(random() * length(characters) + 1)::integer, 1);
    END LOOP;
  END LOOP;
  
  -- Insert the new invite code
  INSERT INTO invite_codes (code, created_by, expires_at)
  VALUES (result, COALESCE(created_by_id, auth.uid()), expires_at);
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to use invite code during signup
CREATE OR REPLACE FUNCTION use_invite_code(
  invite_code text,
  user_id uuid
)
RETURNS boolean AS $$
DECLARE
  code_record record;
BEGIN
  -- Find the invite code
  SELECT * INTO code_record
  FROM invite_codes
  WHERE code = UPPER(invite_code)
    AND is_used = false;
  
  -- Check if code exists and is valid
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if code is expired
  IF code_record.expires_at IS NOT NULL AND code_record.expires_at < now() THEN
    RETURN false;
  END IF;
  
  -- Mark code as used
  UPDATE invite_codes
  SET 
    is_used = true,
    used_by = user_id,
    used_at = now()
  WHERE id = code_record.id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to make first user admin (one-time setup)
CREATE OR REPLACE FUNCTION make_first_user_admin()
RETURNS void AS $$
BEGIN
  -- Only run if no admin exists
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE is_admin = true) THEN
    UPDATE user_profiles 
    SET is_admin = true 
    WHERE id = (
      SELECT id FROM user_profiles 
      ORDER BY created_at ASC 
      LIMIT 1
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;