-- Create time_offerings table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS time_offerings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holder_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),

  -- Skills and expertise
  skill_level TEXT DEFAULT 'all' CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'all')),
  skills_offered TEXT[],

  -- Availability
  availability_type TEXT DEFAULT 'flexible' CHECK (availability_type IN ('flexible', 'scheduled', 'on_demand')),
  hours_per_week INTEGER,
  preferred_days TEXT[],
  preferred_times TEXT[],

  -- Exchange preferences
  exchange_type TEXT DEFAULT 'time_exchange' CHECK (exchange_type IN ('time_exchange', 'skill_trade', 'donation', 'free', 'flexible')),
  suggested_donation DECIMAL(10, 2),

  -- Location preferences
  location_preference TEXT DEFAULT 'flexible' CHECK (location_preference IN ('in_person', 'virtual', 'flexible')),
  service_area TEXT,
  max_travel_distance INTEGER,

  -- Additional details
  prerequisites TEXT,
  materials_needed TEXT,
  max_participants INTEGER DEFAULT 1,
  min_session_length INTEGER DEFAULT 30, -- in minutes
  max_session_length INTEGER DEFAULT 120, -- in minutes

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Statistics
  total_hours_given INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2),

  -- Search and discovery
  tags TEXT[] DEFAULT '{}',
  featured BOOLEAN DEFAULT false,
  search_vector tsvector
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_offerings_holder ON time_offerings(holder_id);
CREATE INDEX IF NOT EXISTS idx_time_offerings_status ON time_offerings(status);
CREATE INDEX IF NOT EXISTS idx_time_offerings_category ON time_offerings(category);
CREATE INDEX IF NOT EXISTS idx_time_offerings_search ON time_offerings USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_time_offerings_tags ON time_offerings USING GIN(tags);

-- Full text search function
CREATE OR REPLACE FUNCTION update_time_offering_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for search vector
DROP TRIGGER IF EXISTS update_time_offering_search_vector_trigger ON time_offerings;
CREATE TRIGGER update_time_offering_search_vector_trigger
  BEFORE INSERT OR UPDATE ON time_offerings
  FOR EACH ROW
  EXECUTE FUNCTION update_time_offering_search_vector();

-- Enable RLS
ALTER TABLE time_offerings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Anyone can view active time offerings" ON time_offerings;
CREATE POLICY "Anyone can view active time offerings" ON time_offerings
  FOR SELECT TO authenticated
  USING (status = 'active' OR holder_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own time offerings" ON time_offerings;
CREATE POLICY "Users can manage their own time offerings" ON time_offerings
  FOR ALL TO authenticated
  USING (holder_id = auth.uid())
  WITH CHECK (holder_id = auth.uid());

-- Comments for documentation
COMMENT ON TABLE time_offerings IS 'Time bank offerings where community members share their skills and time';
COMMENT ON COLUMN time_offerings.holder_id IS 'User who is offering their time/skills';
COMMENT ON COLUMN time_offerings.exchange_type IS 'How the time offering is exchanged (time bank, donation, etc)';
COMMENT ON COLUMN time_offerings.service_area IS 'Geographic area where service is offered';