-- Make cryptokoh@gmail.com an admin user
-- Run this in the Supabase SQL Editor

-- Update any existing profile for cryptokoh@gmail.com to admin
UPDATE profiles
SET is_admin = true,
    updated_at = NOW()
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'cryptokoh@gmail.com'
);

-- If the user doesn't exist yet, create a trigger to auto-assign admin when they sign up
CREATE OR REPLACE FUNCTION set_admin_for_cryptokoh()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is cryptokoh@gmail.com, set them as admin
  IF NEW.email = 'cryptokoh@gmail.com' THEN
    INSERT INTO profiles (
      id,
      is_admin,
      full_name,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      true,
      'Admin User',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      is_admin = true,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-assign admin role on signup
DROP TRIGGER IF EXISTS auto_admin_cryptokoh ON auth.users;
CREATE TRIGGER auto_admin_cryptokoh
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION set_admin_for_cryptokoh();

-- Verify the change
SELECT
  u.email,
  p.is_admin,
  p.full_name,
  p.updated_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'cryptokoh@gmail.com';
