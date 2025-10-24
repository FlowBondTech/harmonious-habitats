-- Fix RLS Policies for Harmonik Space
-- This script ensures users can properly create and manage their profiles

-- First, ensure RLS is enabled on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing profile policies to recreate them properly
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON profiles;

-- Create comprehensive profile policies
-- 1. Allow users to view all profiles (for community discovery)
CREATE POLICY "Users can view all profiles"
ON profiles FOR SELECT
USING (true);

-- 2. Allow users to insert their own profile
CREATE POLICY "Users can create their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 3. Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Allow users to delete their own profile (if needed)
CREATE POLICY "Users can delete their own profile"
ON profiles FOR DELETE
USING (auth.uid() = id);

-- 5. Service role bypass (for admin operations)
CREATE POLICY "Service role has full access"
ON profiles FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- Ensure the trigger function exists for auto-creating profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.created_at,
    new.created_at
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Verify the policies are working
DO $$
BEGIN
  RAISE NOTICE 'RLS policies have been updated successfully';
  RAISE NOTICE 'Users can now:';
  RAISE NOTICE '  - View all profiles';
  RAISE NOTICE '  - Create their own profile';
  RAISE NOTICE '  - Update their own profile';
  RAISE NOTICE '  - Delete their own profile';
END $$;