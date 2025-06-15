/*
  # Add profile setup completion tracking

  1. Changes
    - Add `profile_setup_completed` column to `user_profiles` table
    - Set default value to false for new users
    - Update existing users to have completed setup (since they're already in the system)

  2. Security
    - No changes to RLS policies needed
*/

-- Add profile_setup_completed column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'profile_setup_completed'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN profile_setup_completed boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Update existing users to have completed setup (since they're already in the system)
UPDATE user_profiles 
SET profile_setup_completed = true 
WHERE profile_setup_completed = false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_setup_completed 
ON user_profiles(profile_setup_completed);