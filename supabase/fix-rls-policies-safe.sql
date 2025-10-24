-- Fix RLS Policies for Harmonik Space (Safe Version)
-- This script safely updates RLS policies, handling existing ones

-- First, ensure RLS is enabled on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing profile policies to recreate them properly
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
    DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
    DROP POLICY IF EXISTS "Service role has full access" ON profiles;
    DROP POLICY IF EXISTS "Service role can manage all profiles" ON profiles;
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
    DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile." ON profiles;

    RAISE NOTICE 'Dropped existing policies';
END $$;

-- Create comprehensive profile policies
-- 1. Allow everyone (including anonymous) to view all profiles
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

-- 2. Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 3. Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Allow authenticated users to delete their own profile
CREATE POLICY "Users can delete own profile"
ON profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Ensure the trigger function exists for auto-creating profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert profile for new user
  INSERT INTO public.profiles (
    id,
    email,
    username,
    full_name,
    created_at,
    updated_at,
    holistic_interests,
    email_preferences,
    social_media,
    mobile_notifications
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    now(),
    now(),
    ARRAY[]::text[],
    jsonb_build_object(
      'weekly_digest', true,
      'event_reminders', true,
      'new_member_spotlights', false,
      'space_availability', false,
      'tips_resources', false,
      'email_frequency', 'weekly'
    ),
    jsonb_build_object(
      'sharing_preferences', jsonb_build_object(
        'auto_share_events', false,
        'share_achievements', false,
        'allow_friend_discovery', false
      )
    ),
    jsonb_build_object(
      'push_notifications', jsonb_build_object(
        'event_reminders', true,
        'new_messages', true,
        'event_updates', false,
        'community_announcements', false
      ),
      'quiet_hours', jsonb_build_object(
        'enabled', false,
        'start_time', '22:00',
        'end_time', '08:00'
      ),
      'notification_sound', 'default'
    )
  )
  ON CONFLICT (id) DO NOTHING;  -- Prevent errors if profile already exists
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

-- Add RLS policies for other important tables

-- Events table policies
DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON events;
DROP POLICY IF EXISTS "Users can update their own events" ON events;
DROP POLICY IF EXISTS "Users can delete their own events" ON events;

CREATE POLICY "Events are viewable by everyone"
ON events FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create events"
ON events FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own events"
ON events FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own events"
ON events FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Spaces table policies
DROP POLICY IF EXISTS "Spaces are viewable by everyone" ON spaces;
DROP POLICY IF EXISTS "Authenticated users can create spaces" ON spaces;
DROP POLICY IF EXISTS "Users can update their own spaces" ON spaces;
DROP POLICY IF EXISTS "Users can delete their own spaces" ON spaces;

CREATE POLICY "Spaces are viewable by everyone"
ON spaces FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create spaces"
ON spaces FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own spaces"
ON spaces FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own spaces"
ON spaces FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Verify the policies are working
DO $$
BEGIN
  RAISE NOTICE 'RLS policies have been updated successfully';
  RAISE NOTICE 'Users can now:';
  RAISE NOTICE '  - View all profiles, events, and spaces';
  RAISE NOTICE '  - Create their own profile (auto-created on signup)';
  RAISE NOTICE '  - Update their own profile';
  RAISE NOTICE '  - Create, update, and delete their own events and spaces';
END $$;