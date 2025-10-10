-- Add user_type column to profiles table
-- Run this in the Supabase SQL Editor

-- Add the user_type column if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'user' CHECK (user_type IN ('user', 'moderator', 'admin'));

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);

-- Set admin user_type for cryptokoh@gmail.com
UPDATE profiles
SET user_type = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'cryptokoh@gmail.com'
);

-- Also keep is_admin in sync (in case it's used elsewhere)
UPDATE profiles
SET is_admin = true
WHERE user_type = 'admin';

-- Verify the change
SELECT
  u.email,
  p.user_type,
  p.is_admin,
  p.full_name
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'cryptokoh@gmail.com';
