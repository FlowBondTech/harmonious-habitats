-- Fix events table to add missing essential columns
-- Run this in Supabase SQL Editor

-- Add the category column (the critical missing field)
ALTER TABLE events
ADD COLUMN IF NOT EXISTS category TEXT;

-- Add other essential columns that may be missing
ALTER TABLE events
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'local',
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York',
ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS registration_required BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS waitlist_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS skill_level TEXT DEFAULT 'all',
ADD COLUMN IF NOT EXISTS prerequisites TEXT,
ADD COLUMN IF NOT EXISTS what_to_bring TEXT,
ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suggested_donation TEXT,
ADD COLUMN IF NOT EXISTS minimum_donation DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS maximum_donation DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS exchange_type TEXT DEFAULT 'donation',
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public',
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_rule TEXT,
ADD COLUMN IF NOT EXISTS recurring_event_id UUID,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS holistic_categories TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS submission_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancellation_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completion_notes TEXT,
ADD COLUMN IF NOT EXISTS search_vector tsvector,
ADD COLUMN IF NOT EXISTS virtual_meeting_url TEXT,
ADD COLUMN IF NOT EXISTS virtual_meeting_password TEXT,
ADD COLUMN IF NOT EXISTS virtual_platform TEXT,
ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS location_details TEXT;

-- Add check constraints
ALTER TABLE events DROP CONSTRAINT IF EXISTS valid_times;
ALTER TABLE events ADD CONSTRAINT valid_times CHECK (end_time > start_time);

ALTER TABLE events DROP CONSTRAINT IF EXISTS valid_capacity;
ALTER TABLE events ADD CONSTRAINT valid_capacity CHECK (capacity >= 0);

ALTER TABLE events DROP CONSTRAINT IF EXISTS valid_donation_range;
ALTER TABLE events ADD CONSTRAINT valid_donation_range CHECK (
  (minimum_donation IS NULL OR maximum_donation IS NULL) OR
  (minimum_donation <= maximum_donation)
);

ALTER TABLE events DROP CONSTRAINT IF EXISTS events_event_type_check;
ALTER TABLE events ADD CONSTRAINT events_event_type_check
  CHECK (event_type IN ('local', 'virtual', 'global_physical'));

ALTER TABLE events DROP CONSTRAINT IF EXISTS events_skill_level_check;
ALTER TABLE events ADD CONSTRAINT events_skill_level_check
  CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'all'));

ALTER TABLE events DROP CONSTRAINT IF EXISTS events_exchange_type_check;
ALTER TABLE events ADD CONSTRAINT events_exchange_type_check
  CHECK (exchange_type IN ('donation', 'fixed', 'sliding_scale', 'barter', 'free'));

ALTER TABLE events DROP CONSTRAINT IF EXISTS events_visibility_check;
ALTER TABLE events ADD CONSTRAINT events_visibility_check
  CHECK (visibility IN ('public', 'private', 'unlisted'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_search ON events USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_events_tags ON events USING GIN(tags);

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

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_event_search_vector_trigger ON events;
CREATE TRIGGER update_event_search_vector_trigger
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_event_search_vector();

-- Create event_categories table if it doesn't exist
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

-- Enable RLS on event_categories
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;

-- Anyone can view active event categories
DROP POLICY IF EXISTS "Anyone can view event categories" ON event_categories;
CREATE POLICY "Anyone can view event categories" ON event_categories
  FOR SELECT
  TO authenticated
  USING (active = true);

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

-- Comment for documentation
COMMENT ON COLUMN events.category IS 'Event category - should match one of the event_categories names';
