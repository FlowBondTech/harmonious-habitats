-- ============================================
-- Harmony Spaces Database Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. CREATE PROFILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  neighborhood TEXT,
  rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  discovery_radius INTEGER DEFAULT 5,

  -- Personal Information
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  phone_number TEXT,
  address TEXT,
  city TEXT,
  zip_code TEXT,

  -- Email Preferences (JSONB)
  email_preferences JSONB DEFAULT '{"weekly_digest": true, "event_reminders": true, "new_member_spotlights": true, "space_availability": true, "tips_resources": true, "email_frequency": "weekly"}'::jsonb,

  -- Social Media (JSONB)
  social_media JSONB DEFAULT '{"instagram": null, "facebook": null, "linkedin": null, "twitter": null, "sharing_preferences": {"auto_share_events": false, "share_achievements": false, "allow_friend_discovery": true}}'::jsonb,

  -- Interests
  holistic_interests TEXT[] DEFAULT ARRAY[]::TEXT[],
  additional_interests TEXT[] DEFAULT ARRAY[]::TEXT[],
  involvement_level TEXT CHECK (involvement_level IN ('curious', 'active', 'dedicated')),
  other_interests TEXT,

  -- Mobile Notifications (JSONB)
  mobile_notifications JSONB DEFAULT '{"push_notifications": {"event_reminders": true, "new_messages": true, "event_updates": true, "community_announcements": true}, "quiet_hours": {"enabled": false, "start_time": "22:00", "end_time": "08:00"}, "notification_sound": "default"}'::jsonb,

  -- Profile Statistics
  events_attended_count INTEGER DEFAULT 0,
  hours_contributed INTEGER DEFAULT 0,
  neighbors_met_count INTEGER DEFAULT 0,

  -- Activity & Achievements (JSONB)
  recent_activities JSONB DEFAULT '[]'::jsonb,
  achievements JSONB DEFAULT '{"first_event": false, "event_organizer": false, "community_builder": false, "helper": false, "connector": false}'::jsonb,

  -- Privacy & Visibility
  visibility_settings JSONB DEFAULT '{"profile_public": true, "show_events": true, "show_connections": true, "allow_messages": true}'::jsonb,

  -- Location
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_updated_at TIMESTAMP WITH TIME ZONE,

  -- Roles
  is_admin BOOLEAN DEFAULT false,
  is_space_holder BOOLEAN DEFAULT false,
  is_time_holder BOOLEAN DEFAULT false,
  is_facilitator BOOLEAN DEFAULT false
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_neighborhood ON profiles(neighborhood);
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON profiles(verified);

-- ============================================
-- 2. CREATE OTHER CORE TABLES
-- ============================================

-- Events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Basic Info
  title TEXT NOT NULL,
  description TEXT,
  organizer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Event Type and Status
  event_type TEXT CHECK (event_type IN ('local_physical', 'global_physical', 'virtual')),
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),

  -- Date and Time
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  timezone TEXT DEFAULT 'America/Los_Angeles',

  -- Location
  location_type TEXT CHECK (location_type IN ('in_person', 'virtual', 'hybrid')),
  venue_name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  virtual_link TEXT,

  -- Capacity and Registration
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,
  registration_required BOOLEAN DEFAULT false,
  registration_deadline TIMESTAMP WITH TIME ZONE,

  -- Categories and Tags
  holistic_category TEXT[],
  tags TEXT[],

  -- Images and Media
  cover_image TEXT,
  images TEXT[],

  -- Pricing
  is_free BOOLEAN DEFAULT true,
  price DECIMAL(10, 2),

  -- Space Reference
  space_id UUID,

  -- Neighborhood
  neighborhood_id UUID,
  is_neighborhood_only BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- Spaces table
CREATE TABLE IF NOT EXISTS public.spaces (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Owner Info
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Basic Info
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  space_type TEXT,

  -- Location
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Availability
  is_available BOOLEAN DEFAULT true,
  availability_schedule JSONB,

  -- Capacity
  max_capacity INTEGER,

  -- Features
  amenities TEXT[],
  accessibility_features TEXT[],
  holistic_categories TEXT[],

  -- Images
  images TEXT[],
  cover_image TEXT,

  -- Rules and Pricing
  house_rules TEXT,
  pricing_type TEXT CHECK (pricing_type IN ('free', 'hourly', 'daily', 'donation')),
  price_per_hour DECIMAL(10, 2),
  price_per_day DECIMAL(10, 2),

  -- Visibility
  is_public BOOLEAN DEFAULT true,
  neighborhood_id UUID,
  is_neighborhood_only BOOLEAN DEFAULT false,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'archived')),
  verified BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_spaces_owner ON spaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_spaces_slug ON spaces(slug);

-- Neighborhoods table
CREATE TABLE IF NOT EXISTS public.neighborhoods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,

  -- Location
  city TEXT,
  state TEXT,
  zip_codes TEXT[],
  boundaries JSONB, -- GeoJSON for neighborhood boundaries
  center_latitude DECIMAL(10, 8),
  center_longitude DECIMAL(11, 8),

  -- Settings
  is_private BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT true,

  -- Images
  cover_image TEXT,
  logo_url TEXT,

  -- Stats
  member_count INTEGER DEFAULT 0,
  event_count INTEGER DEFAULT 0,
  space_count INTEGER DEFAULT 0
);

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

  -- Message type
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
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

  -- Related entities
  related_event_id UUID,
  related_space_id UUID,
  related_user_id UUID,

  -- Action URL
  action_url TEXT,

  -- Additional data
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

  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'waitlisted', 'attended', 'cancelled', 'no_show')),
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

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),

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

  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),

  purpose TEXT,
  attendee_count INTEGER,

  total_price DECIMAL(10, 2),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'waived')),

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

  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'banned')),

  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  invited_by UUID REFERENCES profiles(id),

  UNIQUE(neighborhood_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_members_neighborhood ON neighborhood_members(neighborhood_id);
CREATE INDEX IF NOT EXISTS idx_members_user ON neighborhood_members(user_id);

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

-- Events Policies
CREATE POLICY "Published events are viewable by everyone"
  ON events FOR SELECT
  USING (status = 'published' OR organizer_id = auth.uid());

CREATE POLICY "Authenticated users can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Event organizers can update their events"
  ON events FOR UPDATE
  USING (auth.uid() = organizer_id)
  WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Event organizers can delete their events"
  ON events FOR DELETE
  USING (auth.uid() = organizer_id);

-- Spaces Policies
CREATE POLICY "Public spaces are viewable by everyone"
  ON spaces FOR SELECT
  USING (is_public = true OR owner_id = auth.uid());

CREATE POLICY "Authenticated users can create spaces"
  ON spaces FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Space owners can update their spaces"
  ON spaces FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Space owners can delete their spaces"
  ON spaces FOR DELETE
  USING (auth.uid() = owner_id);

-- Neighborhoods Policies
CREATE POLICY "Public neighborhoods are viewable by everyone"
  ON neighborhoods FOR SELECT
  USING (is_private = false OR EXISTS (
    SELECT 1 FROM neighborhood_members
    WHERE neighborhood_members.neighborhood_id = neighborhoods.id
    AND neighborhood_members.user_id = auth.uid()
    AND neighborhood_members.status = 'active'
  ));

-- Messages Policies
CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Notifications Policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Event Participants Policies
CREATE POLICY "Event participants are viewable by event organizers and participants"
  ON event_participants FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT organizer_id FROM events WHERE events.id = event_participants.event_id
    )
  );

CREATE POLICY "Users can register for events"
  ON event_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their participation"
  ON event_participants FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Space Applications Policies
CREATE POLICY "Applications viewable by applicant and space owner"
  ON space_applications FOR SELECT
  USING (
    auth.uid() = applicant_id OR
    auth.uid() IN (
      SELECT owner_id FROM spaces WHERE spaces.id = space_applications.space_id
    )
  );

CREATE POLICY "Users can submit applications"
  ON space_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = applicant_id);

-- Space Bookings Policies
CREATE POLICY "Bookings viewable by user and space owner"
  ON space_bookings FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT owner_id FROM spaces WHERE spaces.id = space_bookings.space_id
    )
  );

CREATE POLICY "Users can create bookings"
  ON space_bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Neighborhood Members Policies
CREATE POLICY "Members can view neighborhood membership"
  ON neighborhood_members FOR SELECT
  USING (true);

CREATE POLICY "Users can join neighborhoods"
  ON neighborhood_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

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
  );
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
CREATE TRIGGER handle_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_spaces_updated_at BEFORE UPDATE ON spaces
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_neighborhoods_updated_at BEFORE UPDATE ON neighborhoods
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- 5. FACILITATOR TABLES (Additional Features)
-- ============================================

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
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on facilitator tables
ALTER TABLE facilitator_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilitator_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilitator_booking_requests ENABLE ROW LEVEL SECURITY;

-- Facilitator table policies
CREATE POLICY "Facilitator info is public"
  ON facilitator_availability FOR SELECT
  USING (true);

CREATE POLICY "Facilitators can manage their availability"
  ON facilitator_availability FOR ALL
  USING (auth.uid() = facilitator_id)
  WITH CHECK (auth.uid() = facilitator_id);

CREATE POLICY "Facilitator specialties are public"
  ON facilitator_specialties FOR SELECT
  USING (true);

CREATE POLICY "Facilitators can manage their specialties"
  ON facilitator_specialties FOR ALL
  USING (auth.uid() = facilitator_id)
  WITH CHECK (auth.uid() = facilitator_id);

CREATE POLICY "Booking requests viewable by involved parties"
  ON facilitator_booking_requests FOR SELECT
  USING (auth.uid() = facilitator_id OR auth.uid() = requester_id);

CREATE POLICY "Users can create booking requests"
  ON facilitator_booking_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Involved parties can update booking requests"
  ON facilitator_booking_requests FOR UPDATE
  USING (auth.uid() = facilitator_id OR auth.uid() = requester_id);

-- ============================================
-- 6. HELPFUL VIEWS
-- ============================================

-- View for upcoming events with participant count
CREATE OR REPLACE VIEW upcoming_events AS
SELECT
  e.*,
  p.full_name as organizer_name,
  p.avatar_url as organizer_avatar,
  COUNT(ep.id) as participant_count
FROM events e
LEFT JOIN profiles p ON e.organizer_id = p.id
LEFT JOIN event_participants ep ON e.id = ep.event_id AND ep.status = 'registered'
WHERE e.date >= CURRENT_DATE
  AND e.status = 'published'
GROUP BY e.id, p.id;

-- View for active spaces with owner info
CREATE OR REPLACE VIEW active_spaces AS
SELECT
  s.*,
  p.full_name as owner_name,
  p.avatar_url as owner_avatar,
  p.verified as owner_verified
FROM spaces s
LEFT JOIN profiles p ON s.owner_id = p.id
WHERE s.status = 'active' AND s.is_available = true;

-- ============================================
-- END OF DATABASE SETUP
-- ============================================

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database setup completed successfully!';
END $$;