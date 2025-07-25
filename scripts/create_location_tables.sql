-- Create user_locations table for storing manual and GPS-tracked locations
CREATE TABLE IF NOT EXISTS user_locations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL, -- e.g., "My favorite coffee shop", "Work", "Home"
  type text NOT NULL CHECK (type IN ('manual', 'tracked')), -- manual entry vs GPS tracked
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  address text,
  visit_count integer DEFAULT 1,
  total_time_spent interval DEFAULT '0'::interval, -- total time spent at location
  last_visited timestamp with time zone DEFAULT now(),
  is_favorite boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create user_location_visits table for tracking individual visits
CREATE TABLE IF NOT EXISTS user_location_visits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  location_id uuid REFERENCES user_locations(id) ON DELETE CASCADE NOT NULL,
  arrived_at timestamp with time zone NOT NULL,
  departed_at timestamp with time zone,
  duration interval GENERATED ALWAYS AS (
    CASE 
      WHEN departed_at IS NOT NULL THEN departed_at - arrived_at
      ELSE NULL
    END
  ) STORED,
  created_at timestamp with time zone DEFAULT now()
);

-- Create user_location_preferences table for storing user preferences
CREATE TABLE IF NOT EXISTS user_location_preferences (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  track_gps_enabled boolean DEFAULT false,
  tracking_frequency interval DEFAULT '5 minutes'::interval,
  auto_detect_hotspots boolean DEFAULT true,
  hotspot_threshold integer DEFAULT 5, -- visits needed to consider a hotspot
  class_suggestion_radius double precision DEFAULT 0.5, -- km radius for suggestions
  last_gps_update timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create suggested_classes table for location-based suggestions
CREATE TABLE IF NOT EXISTS suggested_classes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  location_id uuid REFERENCES user_locations(id) ON DELETE CASCADE,
  distance double precision NOT NULL, -- distance in km
  relevance_score double precision NOT NULL, -- 0-1 score based on various factors
  reason text NOT NULL, -- e.g., "Near your favorite coffee shop"
  dismissed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX idx_user_locations_coordinates ON user_locations(latitude, longitude);
CREATE INDEX idx_user_location_visits_user_location ON user_location_visits(user_id, location_id);
CREATE INDEX idx_user_location_visits_arrived ON user_location_visits(arrived_at);
CREATE INDEX idx_suggested_classes_user_not_dismissed ON suggested_classes(user_id, dismissed) WHERE NOT dismissed;

-- Enable RLS
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_location_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_location_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggested_classes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_locations
CREATE POLICY "Users can view their own locations" ON user_locations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own locations" ON user_locations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own locations" ON user_locations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own locations" ON user_locations
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_location_visits
CREATE POLICY "Users can view their own visits" ON user_location_visits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own visits" ON user_location_visits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own visits" ON user_location_visits
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_location_preferences
CREATE POLICY "Users can view their own preferences" ON user_location_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_location_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_location_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for suggested_classes
CREATE POLICY "Users can view their own suggestions" ON suggested_classes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own suggestions" ON suggested_classes
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 double precision,
  lon1 double precision,
  lat2 double precision,
  lon2 double precision
) RETURNS double precision AS $$
DECLARE
  R double precision := 6371; -- Earth's radius in km
  dlat double precision;
  dlon double precision;
  a double precision;
  c double precision;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;