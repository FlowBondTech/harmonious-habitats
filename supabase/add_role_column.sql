-- Add role column to profiles table and create missing functions
-- Run this in Supabase SQL Editor

-- Create ensure_profile_exists function if it doesn't exist
CREATE OR REPLACE FUNCTION ensure_profile_exists(user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO profiles (id, created_at, updated_at)
  VALUES (user_id, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for the function
GRANT EXECUTE ON FUNCTION ensure_profile_exists(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_profile_exists(UUID) TO anon;

-- Add the role column if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin'));

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Update the get_user_role_safe function to use the role column
CREATE OR REPLACE FUNCTION get_user_role_safe(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = user_id;

  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_role_safe(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role_safe(UUID) TO anon;

-- Optional: Set your user as admin (replace with your user ID if different)
UPDATE profiles
SET role = 'admin'
WHERE email = 'cryptokoh@gmail.com' OR id = '0437d29d-0f24-4192-9c56-1506b7495070';

COMMENT ON COLUMN profiles.role IS 'User role: user, moderator, or admin';