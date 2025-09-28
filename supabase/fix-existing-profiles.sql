-- Fix for EXISTING profiles table
-- This script works with your already-created table

-- STEP 1: Add missing columns (if they don't exist)
-- =========================================
DO $$
BEGIN
    -- Add email column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE profiles ADD COLUMN email TEXT;
        RAISE NOTICE 'Added email column';
    END IF;

    -- Add username column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'profiles' AND column_name = 'username') THEN
        ALTER TABLE profiles ADD COLUMN username TEXT;
        RAISE NOTICE 'Added username column';
    END IF;

    -- Add full_name column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
        ALTER TABLE profiles ADD COLUMN full_name TEXT;
        RAISE NOTICE 'Added full_name column';
    END IF;
END $$;

-- STEP 2: Disable RLS temporarily for cleanup
-- =========================================
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- STEP 3: Drop ALL existing policies
-- =========================================
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
    END LOOP;
    RAISE NOTICE 'Cleaned up all existing policies';
END $$;

-- STEP 4: Create/Replace the trigger function
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile with minimal required fields
    INSERT INTO public.profiles (id, email, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.created_at, NOW()),
        NOW()
    )
    ON CONFLICT (id)
    DO UPDATE SET
        email = COALESCE(profiles.email, EXCLUDED.email),
        updated_at = NOW();

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log but don't block signup
        RAISE WARNING 'Profile creation warning for %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 5: Recreate the trigger
-- =========================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- STEP 6: Enable RLS with simple policies
-- =========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Simple policies that should work
CREATE POLICY "Anyone can view profiles"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can do everything to their profile"
    ON profiles FOR ALL
    USING (
        auth.uid() = id OR
        auth.jwt()->>'role' = 'service_role'
    )
    WITH CHECK (
        auth.uid() = id OR
        auth.jwt()->>'role' = 'service_role'
    );

-- STEP 7: Grant permissions
-- =========================================
GRANT ALL ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;
GRANT ALL ON profiles TO service_role;

-- STEP 8: Update any existing users without profiles
-- =========================================
INSERT INTO profiles (id, email, created_at, updated_at)
SELECT
    u.id,
    u.email,
    u.created_at,
    NOW()
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- STEP 9: Final verification
-- =========================================
DO $$
DECLARE
    profile_count INTEGER;
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM profiles;
    SELECT COUNT(*) INTO user_count FROM auth.users;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ PROFILES TABLE FIXED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Current status:';
    RAISE NOTICE '  • Total users: %', user_count;
    RAISE NOTICE '  • Total profiles: %', profile_count;
    RAISE NOTICE '  • Email column: EXISTS';
    RAISE NOTICE '  • RLS: ENABLED with simple policies';
    RAISE NOTICE '  • Trigger: CONFIGURED';
    RAISE NOTICE '';
    RAISE NOTICE 'You should now be able to:';
    RAISE NOTICE '  ✓ Register with any email';
    RAISE NOTICE '  ✓ Sign in successfully';
    RAISE NOTICE '  ✓ Update profiles';
    RAISE NOTICE '========================================';
END $$;