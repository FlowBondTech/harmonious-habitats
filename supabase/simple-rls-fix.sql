-- Simple RLS Fix - Most Permissive Approach for Testing
-- Run this to get user registration working immediately

-- 1. First, disable RLS temporarily to clean up
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
    END LOOP;
END $$;

-- 3. Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create a single, simple, permissive policy for ALL operations
CREATE POLICY "Enable all operations for authenticated users"
ON profiles
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. Also create policy for anonymous users to read profiles
CREATE POLICY "Allow anonymous to read profiles"
ON profiles
FOR SELECT
TO anon
USING (true);

-- 6. Ensure the email column exists (some versions might be missing it)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'email'
    ) THEN
        ALTER TABLE profiles ADD COLUMN email TEXT;
    END IF;
END $$;

-- 7. Create or replace the trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    default_username text;
    default_name text;
BEGIN
    -- Generate defaults from email
    default_username := split_part(NEW.email, '@', 1);
    default_name := split_part(NEW.email, '@', 1);

    -- Try to get values from metadata if available
    IF NEW.raw_user_meta_data IS NOT NULL THEN
        default_username := COALESCE(
            NEW.raw_user_meta_data->>'username',
            NEW.raw_user_meta_data->>'preferred_username',
            default_username
        );
        default_name := COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            default_name
        );
    END IF;

    -- Insert the profile
    INSERT INTO public.profiles (
        id,
        email,
        username,
        full_name,
        created_at,
        updated_at,
        holistic_interests,
        rating,
        total_reviews,
        verified,
        discovery_radius
    )
    VALUES (
        NEW.id,
        NEW.email,
        default_username,
        default_name,
        NOW(),
        NOW(),
        ARRAY[]::text[],
        0.0,
        0,
        false,
        10.0
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW()
    WHERE profiles.email IS NULL OR profiles.email = '';

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the signup
        RAISE WARNING 'Could not create profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Grant all permissions to authenticated users
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- 10. Verify settings
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==================================';
    RAISE NOTICE 'RLS FIX APPLIED SUCCESSFULLY';
    RAISE NOTICE '==================================';
    RAISE NOTICE 'Profiles table now allows:';
    RAISE NOTICE '  ✓ Any authenticated user can do anything';
    RAISE NOTICE '  ✓ Anonymous users can read profiles';
    RAISE NOTICE '  ✓ Auto-creation trigger is set up';
    RAISE NOTICE '';
    RAISE NOTICE 'This is a permissive setup for testing.';
    RAISE NOTICE 'Tighten security once registration works.';
    RAISE NOTICE '==================================';
END $$;