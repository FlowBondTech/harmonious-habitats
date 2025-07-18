-- Comprehensive Events System Schema
-- This migration creates a complete event management system with all necessary features

-- First, ensure we have the events table with all necessary fields
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Event ownership and organization
  organizer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  space_id UUID REFERENCES spaces(id) ON DELETE SET NULL, -- Optional: event at a specific space
  time_offering_id UUID REFERENCES time_offerings(id) ON DELETE SET NULL, -- Optional: event from time offering
  
  -- Basic event information
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  event_type TEXT CHECK (event_type IN ('local', 'virtual', 'global_physical')) DEFAULT 'local',
  
  -- Timing
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT DEFAULT 'America/New_York',
  
  -- Location (for physical events)
  location_name TEXT,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_details TEXT, -- Additional location info like parking, entrance, etc.
  
  -- Virtual event details
  virtual_meeting_url TEXT,
  virtual_meeting_password TEXT,
  virtual_platform TEXT, -- zoom, meet, teams, etc.
  
  -- Capacity and registration
  capacity INTEGER DEFAULT 0, -- 0 means unlimited
  registration_required BOOLEAN DEFAULT true,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  waitlist_enabled BOOLEAN DEFAULT true,
  
  -- Skill level and requirements
  skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'all')) DEFAULT 'all',
  prerequisites TEXT,
  what_to_bring TEXT,
  
  -- Pricing and donations
  is_free BOOLEAN DEFAULT false,
  suggested_donation TEXT,
  minimum_donation DECIMAL(10, 2),
  maximum_donation DECIMAL(10, 2),
  exchange_type TEXT CHECK (exchange_type IN ('donation', 'fixed', 'sliding_scale', 'barter', 'free')) DEFAULT 'donation',
  
  -- Media
  image_url TEXT,
  image_urls TEXT[] DEFAULT '{}',
  
  -- Status and visibility
  status TEXT CHECK (status IN ('draft', 'published', 'cancelled', 'completed', 'postponed')) DEFAULT 'draft',
  visibility TEXT CHECK (visibility IN ('public', 'private', 'unlisted')) DEFAULT 'public',
  verified BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  
  -- Recurring events
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT, -- RFC 5545 RRULE format
  recurring_event_id UUID, -- Links recurring events together
  
  -- Tags and categories
  tags TEXT[] DEFAULT '{}',
  holistic_categories TEXT[] DEFAULT '{}',
  
  -- Metadata
  submission_metadata JSONB DEFAULT '{}',
  cancellation_reason TEXT,
  cancellation_date TIMESTAMP WITH TIME ZONE,
  completion_notes TEXT,
  
  -- Search optimization
  search_vector tsvector,
  
  -- Constraints
  CONSTRAINT valid_times CHECK (end_time > start_time),
  CONSTRAINT valid_capacity CHECK (capacity >= 0),
  CONSTRAINT valid_donation_range CHECK (
    (minimum_donation IS NULL OR maximum_donation IS NULL) OR 
    (minimum_donation <= maximum_donation)
  )
);

-- Event participants/RSVPs
CREATE TABLE IF NOT EXISTS event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Registration details
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status TEXT CHECK (status IN ('registered', 'waitlisted', 'cancelled', 'attended', 'no_show')) DEFAULT 'registered',
  
  -- Attendance tracking
  checked_in_at TIMESTAMP WITH TIME ZONE,
  checked_out_at TIMESTAMP WITH TIME ZONE,
  attendance_confirmed BOOLEAN DEFAULT false,
  
  -- Additional info
  guest_count INTEGER DEFAULT 0, -- Additional guests they're bringing
  special_requirements TEXT,
  emergency_contact TEXT,
  
  -- Payment/donation tracking
  donation_amount DECIMAL(10, 2),
  payment_status TEXT CHECK (payment_status IN ('pending', 'completed', 'refunded', 'waived')),
  payment_date TIMESTAMP WITH TIME ZONE,
  
  -- Communication preferences
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  feedback_requested_at TIMESTAMP WITH TIME ZONE,
  
  -- Unique constraint to prevent duplicate registrations
  UNIQUE(event_id, user_id)
);

-- Event reviews and feedback
CREATE TABLE IF NOT EXISTS event_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Review content
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review_text TEXT,
  
  -- Detailed ratings
  content_rating INTEGER CHECK (content_rating >= 1 AND content_rating <= 5),
  facilitator_rating INTEGER CHECK (facilitator_rating >= 1 AND facilitator_rating <= 5),
  venue_rating INTEGER CHECK (venue_rating >= 1 AND venue_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  verified_attendance BOOLEAN DEFAULT false,
  
  -- Unique constraint - one review per user per event
  UNIQUE(event_id, user_id)
);

-- Event announcements/updates
CREATE TABLE IF NOT EXISTS event_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Tracking
  read_by UUID[] DEFAULT '{}', -- Array of user IDs who have read this
  pinned BOOLEAN DEFAULT false
);

-- Event categories lookup table
CREATE TABLE IF NOT EXISTS event_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  parent_category_id UUID REFERENCES event_categories(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true
);

-- Event materials/requirements
CREATE TABLE IF NOT EXISTS event_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  item TEXT NOT NULL,
  quantity TEXT,
  is_required BOOLEAN DEFAULT true,
  provider TEXT CHECK (provider IN ('participant', 'organizer', 'either')) DEFAULT 'participant',
  notes TEXT
);

-- Event co-hosts/facilitators
CREATE TABLE IF NOT EXISTS event_facilitators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'co-facilitator',
  bio TEXT,
  
  UNIQUE(event_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_location ON events(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_events_search ON events USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_events_tags ON events USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_participants_event ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_status ON event_participants(status);

CREATE INDEX IF NOT EXISTS idx_reviews_event ON event_reviews(event_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON event_reviews(user_id);

-- Full text search function
CREATE OR REPLACE FUNCTION update_event_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.location_name, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for search vector
CREATE TRIGGER update_event_search_vector_trigger
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_event_search_vector();

-- Function to get event participant count
CREATE OR REPLACE FUNCTION get_event_participant_count(event_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM event_participants
    WHERE event_participants.event_id = get_event_participant_count.event_id
    AND status IN ('registered', 'attended')
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can register for event
CREATE OR REPLACE FUNCTION can_register_for_event(p_event_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_event events%ROWTYPE;
  v_participant_count INTEGER;
  v_existing_registration INTEGER;
BEGIN
  -- Get event details
  SELECT * INTO v_event FROM events WHERE id = p_event_id;
  
  -- Check if event exists and is published
  IF v_event.id IS NULL OR v_event.status != 'published' THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user is already registered
  SELECT COUNT(*) INTO v_existing_registration
  FROM event_participants
  WHERE event_id = p_event_id AND user_id = p_user_id
  AND status NOT IN ('cancelled');
  
  IF v_existing_registration > 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Check capacity if limited
  IF v_event.capacity > 0 THEN
    SELECT get_event_participant_count(p_event_id) INTO v_participant_count;
    IF v_participant_count >= v_event.capacity THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Check registration deadline
  IF v_event.registration_deadline IS NOT NULL AND 
     v_event.registration_deadline < CURRENT_TIMESTAMP THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_facilitators ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Anyone can view published events" ON events
  FOR SELECT
  TO authenticated
  USING (status = 'published' AND visibility = 'public');

CREATE POLICY "Organizers can view their own events" ON events
  FOR SELECT
  TO authenticated
  USING (organizer_id = auth.uid());

CREATE POLICY "Users can create events" ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "Organizers can update their own events" ON events
  FOR UPDATE
  TO authenticated
  USING (organizer_id = auth.uid())
  WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "Organizers can delete their own events" ON events
  FOR DELETE
  TO authenticated
  USING (organizer_id = auth.uid());

-- Event participants policies
CREATE POLICY "Users can view event participants for events they organize" ON event_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_participants.event_id 
      AND events.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own registrations" ON event_participants
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can register for events" ON event_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND can_register_for_event(event_id, user_id));

CREATE POLICY "Users can update their own registrations" ON event_participants
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Event reviews policies
CREATE POLICY "Anyone can view event reviews" ON event_reviews
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Verified attendees can create reviews" ON event_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM event_participants
      WHERE event_participants.event_id = event_reviews.event_id
      AND event_participants.user_id = auth.uid()
      AND event_participants.status = 'attended'
    )
  );

CREATE POLICY "Users can update their own reviews" ON event_reviews
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Event announcements policies
CREATE POLICY "Anyone can view event announcements" ON event_announcements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_announcements.event_id
      AND (events.status = 'published' OR events.organizer_id = auth.uid())
    )
  );

CREATE POLICY "Event organizers can create announcements" ON event_announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_announcements.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Event categories - everyone can view
CREATE POLICY "Anyone can view event categories" ON event_categories
  FOR SELECT
  TO authenticated
  USING (active = true);

-- Event materials - viewable by registered users and organizers
CREATE POLICY "Registered users and organizers can view materials" ON event_materials
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_materials.event_id
      AND (
        events.organizer_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM event_participants
          WHERE event_participants.event_id = events.id
          AND event_participants.user_id = auth.uid()
          AND event_participants.status IN ('registered', 'attended')
        )
      )
    )
  );

-- Insert default event categories
INSERT INTO event_categories (name, description, icon, color, display_order) VALUES
  ('Workshop', 'Hands-on learning experiences', 'tool', '#4A7C2A', 1),
  ('Class', 'Structured educational sessions', 'graduation-cap', '#2A5C7C', 2),
  ('Ceremony', 'Sacred and ceremonial gatherings', 'flame', '#7C2A5C', 3),
  ('Healing Circle', 'Group healing and support sessions', 'heart', '#C2185B', 4),
  ('Meditation', 'Guided meditation and mindfulness', 'circle', '#5C2A7C', 5),
  ('Movement', 'Yoga, dance, and physical practices', 'activity', '#2A7C5C', 6),
  ('Community', 'Social gatherings and community building', 'users', '#7C5C2A', 7),
  ('Nature', 'Outdoor and nature-based activities', 'tree', '#2A7C2A', 8),
  ('Arts & Creativity', 'Creative expression and artistic practices', 'palette', '#7C2A2A', 9),
  ('Talk & Discussion', 'Lectures, talks, and group discussions', 'message-circle', '#2A2A7C', 10)
ON CONFLICT (name) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE events IS 'Main events table storing all event information';
COMMENT ON TABLE event_participants IS 'Tracks event registrations and attendance';
COMMENT ON TABLE event_reviews IS 'User reviews and ratings for attended events';
COMMENT ON TABLE event_announcements IS 'Updates and announcements for events';
COMMENT ON TABLE event_categories IS 'Categorization system for events';
COMMENT ON TABLE event_materials IS 'Required or suggested materials for events';
COMMENT ON TABLE event_facilitators IS 'Co-hosts and facilitators for events';