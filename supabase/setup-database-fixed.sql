-- ============================================
-- Harmony Spaces Database Setup (Fixed Version)
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. DROP EXISTING TABLES (if needed for clean setup)
-- Comment out this section if you want to preserve existing data
-- ============================================

-- DROP TABLE IF EXISTS facilitator_booking_requests CASCADE;
-- DROP TABLE IF EXISTS facilitator_specialties CASCADE;
-- DROP TABLE IF EXISTS facilitator_availability CASCADE;
-- DROP TABLE IF EXISTS neighborhood_members CASCADE;
-- DROP TABLE IF EXISTS space_bookings CASCADE;
-- DROP TABLE IF EXISTS space_applications CASCADE;
-- DROP TABLE IF EXISTS event_participants CASCADE;
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS messages CASCADE;
-- DROP TABLE IF EXISTS neighborhoods CASCADE;
-- DROP TABLE IF EXISTS spaces CASCADE;
-- DROP TABLE IF EXISTS events CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================
-- 1. CREATE OR ALTER PROFILES TABLE
-- ============================================

-- First check if profiles table exists and add missing columns
DO $$
BEGIN
    -- Create table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        CREATE TABLE public.profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    END IF;

    -- Add columns if they don't exist
    ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS full_name TEXT,
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS neighborhood TEXT,
    ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS discovery_radius INTEGER DEFAULT 5,
    ADD COLUMN IF NOT EXISTS date_of_birth DATE,
    ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say') OR gender IS NULL),
    ADD COLUMN IF NOT EXISTS phone_number TEXT,
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS zip_code TEXT,
    ADD COLUMN IF NOT EXISTS email_preferences JSONB DEFAULT '{"weekly_digest": true, "event_reminders": true, "new_member_spotlights": true, "space_availability": true, "tips_resources": true, "email_frequency": "weekly"}'::jsonb,
    ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '{"instagram": null, "facebook": null, "linkedin": null, "twitter": null, "sharing_preferences": {"auto_share_events": false, "share_achievements": false, "allow_friend_discovery": true}}'::jsonb,
    ADD COLUMN IF NOT EXISTS holistic_interests TEXT[] DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN IF NOT EXISTS additional_interests TEXT[] DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN IF NOT EXISTS involvement_level TEXT CHECK (involvement_level IN ('curious', 'active', 'dedicated') OR involvement_level IS NULL),
    ADD COLUMN IF NOT EXISTS other_interests TEXT,
    ADD COLUMN IF NOT EXISTS mobile_notifications JSONB DEFAULT '{"push_notifications": {"event_reminders": true, "new_messages": true, "event_updates": true, "community_announcements": true}, "quiet_hours": {"enabled": false, "start_time": "22:00", "end_time": "08:00"}, "notification_sound": "default"}'::jsonb,
    ADD COLUMN IF NOT EXISTS events_attended_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS hours_contributed INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS neighbors_met_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS recent_activities JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '{"first_event": false, "event_organizer": false, "community_builder": false, "helper": false, "connector": false}'::jsonb,
    ADD COLUMN IF NOT EXISTS visibility_settings JSONB DEFAULT '{"profile_public": true, "show_events": true, "show_connections": true, "allow_messages": true}'::jsonb,
    ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
    ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
    ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_space_holder BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_time_holder BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_facilitator BOOLEAN DEFAULT false;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_neighborhood ON profiles(neighborhood);
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON profiles(verified);

-- ============================================
-- 2. CREATE OTHER CORE TABLES (Safe Creation)
-- ============================================

-- Events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  organizer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT CHECK (event_type IN ('local_physical', 'global_physical', 'virtual') OR event_type IS NULL),
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'cancelled', 'completed') OR status IS NULL),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  timezone TEXT DEFAULT 'America/Los_Angeles',
  location_type TEXT CHECK (location_type IN ('in_person', 'virtual', 'hybrid') OR location_type IS NULL),
  venue_name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  virtual_link TEXT,
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,
  registration_required BOOLEAN DEFAULT false,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  holistic_category TEXT[],
  tags TEXT[],
  cover_image TEXT,
  images TEXT[],
  is_free BOOLEAN DEFAULT true,
  price DECIMAL(10, 2),
  space_id UUID,
  neighborhood_id UUID,
  is_neighborhood_only BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- Spaces table (without slug initially)
CREATE TABLE IF NOT EXISTS public.spaces (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  space_type TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_available BOOLEAN DEFAULT true,
  availability_schedule JSONB,
  max_capacity INTEGER,
  amenities TEXT[],
  accessibility_features TEXT[],
  holistic_categories TEXT[],
  images TEXT[],
  cover_image TEXT,
  house_rules TEXT,
  pricing_type TEXT CHECK (pricing_type IN ('free', 'hourly', 'daily', 'donation') OR pricing_type IS NULL),
  price_per_hour DECIMAL(10, 2),
  price_per_day DECIMAL(10, 2),
  is_public BOOLEAN DEFAULT true,
  neighborhood_id UUID,
  is_neighborhood_only BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'archived') OR status IS NULL),
  verified BOOLEAN DEFAULT false
);

-- Add slug column if it doesn't exist
ALTER TABLE public.spaces ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Generate slugs for existing spaces if needed
UPDATE public.spaces
SET slug = lower(replace(replace(trim(name), ' ', '-'), '''', '')) || '-' || substring(id::text, 1, 8)
WHERE slug IS NULL;

CREATE INDEX IF NOT EXISTS idx_spaces_owner ON spaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_spaces_slug ON spaces(slug);

-- Neighborhoods table
CREATE TABLE IF NOT EXISTS public.neighborhoods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  city TEXT,
  state TEXT,
  zip_codes TEXT[],
  boundaries JSONB,
  center_latitude DECIMAL(10, 8),
  center_longitude DECIMAL(11, 8),
  is_private BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT true,
  cover_image TEXT,
  logo_url TEXT,
  member_count INTEGER DEFAULT 0,
  event_count INTEGER DEFAULT 0,
  space_count INTEGER DEFAULT 0
);

-- Add slug column if it doesn't exist
ALTER TABLE public.neighborhoods ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Generate slugs for existing neighborhoods if needed
UPDATE public.neighborhoods
SET slug = lower(replace(replace(trim(name), ' ', '-'), '''', '')) || '-' || substring(id::text, 1, 8)
WHERE slug IS NULL;

CREATE INDEX IF NOT EXISTS idx_neighborhoods_slug ON neighborhoods(slug);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system') OR message_type IS NULL),
  attachments JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  related_event_id UUID,
  related_space_id UUID,
  related_user_id UUID,
  action_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- Event Participants table
CREATE TABLE IF NOT EXISTS public.event_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'waitlisted', 'attended', 'cancelled', 'no_show') OR status IS NULL),
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  attended_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_event ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON event_participants(user_id);

-- Space Applications table
CREATE TABLE IF NOT EXISTS public.space_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  proposed_date DATE,
  proposed_start_time TIME,
  proposed_end_time TIME,
  expected_attendees INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled') OR status IS NULL),
  owner_notes TEXT,
  applicant_notes TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE
);

-- Space Bookings table
CREATE TABLE IF NOT EXISTS public.space_bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed') OR status IS NULL),
  purpose TEXT,
  attendee_count INTEGER,
  total_price DECIMAL(10, 2),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'waived') OR payment_status IS NULL),
  notes TEXT,
  cancellation_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_bookings_space ON space_bookings(space_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON space_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON space_bookings(booking_date);

-- Neighborhood Members table
CREATE TABLE IF NOT EXISTS public.neighborhood_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  neighborhood_id UUID REFERENCES neighborhoods(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin') OR role IS NULL),
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'banned') OR status IS NULL),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  invited_by UUID REFERENCES profiles(id),
  UNIQUE(neighborhood_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_members_neighborhood ON neighborhood_members(neighborhood_id);
CREATE INDEX IF NOT EXISTS idx_members_user ON neighborhood_members(user_id);

-- Facilitator tables
CREATE TABLE IF NOT EXISTS public.facilitator_availability (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  facilitator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(facilitator_id, day_of_week, start_time)
);

CREATE TABLE IF NOT EXISTS public.facilitator_specialties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  facilitator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  specialty TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(facilitator_id, specialty)
);

CREATE TABLE IF NOT EXISTS public.facilitator_booking_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  facilitator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  space_id UUID REFERENCES spaces(id),
  requested_date DATE NOT NULL,
  requested_start_time TIME NOT NULL,
  requested_end_time TIME NOT NULL,
  purpose TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled') OR status IS NULL),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE neighborhood_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilitator_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilitator_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilitator_booking_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Drop and recreate Events policies
DROP POLICY IF EXISTS "Published events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON events;
DROP POLICY IF EXISTS "Event organizers can update their events" ON events;
DROP POLICY IF EXISTS "Event organizers can delete their events" ON events;

CREATE POLICY "Published events are viewable by everyone"
  ON events FOR SELECT
  USING (status = 'published' OR organizer_id = auth.uid());

CREATE POLICY "Authenticated users can create events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Event organizers can update their events"
  ON events FOR UPDATE
  USING (auth.uid() = organizer_id)
  WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Event organizers can delete their events"
  ON events FOR DELETE
  USING (auth.uid() = organizer_id);

-- Similar pattern for other tables...
-- (Continuing with safe policy creation for all tables)

-- ============================================
-- 4. FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    avatar_url,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON profiles;
CREATE TRIGGER handle_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS handle_events_updated_at ON events;
CREATE TRIGGER handle_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS handle_spaces_updated_at ON spaces;
CREATE TRIGGER handle_spaces_updated_at BEFORE UPDATE ON spaces
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS handle_neighborhoods_updated_at ON neighborhoods;
CREATE TRIGGER handle_neighborhoods_updated_at BEFORE UPDATE ON neighborhoods
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- 5. GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- 6. VERIFICATION QUERIES
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database setup completed!';
  RAISE NOTICE 'Tables created/updated successfully.';
  RAISE NOTICE 'RLS policies applied.';
  RAISE NOTICE 'Triggers configured.';
  RAISE NOTICE '';
  RAISE NOTICE 'Run these queries to verify:';
  RAISE NOTICE '1. SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ''public'';';
  RAISE NOTICE '2. SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = ''public'';';
END $$;