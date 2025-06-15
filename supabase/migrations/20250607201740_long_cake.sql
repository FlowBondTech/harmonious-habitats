/*
  # Add Location Support for Location-Based Groups

  1. Schema Updates
    - Add location fields to user_profiles (address, latitude, longitude)
    - Add location fields to spaces (latitude, longitude, location_radius, location_restricted)
    - Add indexes for geospatial queries

  2. Functions
    - Add function to calculate distance between coordinates
    - Add function to check if user is within space radius

  3. Security
    - Update RLS policies to respect location restrictions
*/

-- Add location fields to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'address'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN address text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN latitude decimal(10,8);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN longitude decimal(11,8);
  END IF;
END $$;

-- Add location fields to spaces
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spaces' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE spaces ADD COLUMN latitude decimal(10,8);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spaces' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE spaces ADD COLUMN longitude decimal(11,8);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spaces' AND column_name = 'location_radius'
  ) THEN
    ALTER TABLE spaces ADD COLUMN location_radius integer; -- radius in miles
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spaces' AND column_name = 'location_restricted'
  ) THEN
    ALTER TABLE spaces ADD COLUMN location_restricted boolean DEFAULT false;
  END IF;
END $$;

-- Create indexes for geospatial queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_location 
ON user_profiles(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_spaces_location 
ON spaces(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Function to calculate distance between two points in miles using Haversine formula
CREATE OR REPLACE FUNCTION calculate_distance_miles(
  lat1 decimal, lng1 decimal, 
  lat2 decimal, lng2 decimal
) RETURNS decimal AS $$
DECLARE
  earth_radius_miles constant decimal := 3959.0;
  dlat decimal;
  dlng decimal;
  a decimal;
  c decimal;
BEGIN
  -- Convert degrees to radians
  dlat := radians(lat2 - lat1);
  dlng := radians(lng2 - lng1);
  
  -- Haversine formula
  a := sin(dlat/2) * sin(dlat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dlng/2) * sin(dlng/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN earth_radius_miles * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if user can access a location-restricted space
CREATE OR REPLACE FUNCTION user_can_access_space(
  user_id_param uuid,
  space_id_param uuid
) RETURNS boolean AS $$
DECLARE
  space_record record;
  user_record record;
  distance_miles decimal;
BEGIN
  -- Get space location info
  SELECT latitude, longitude, location_radius, location_restricted
  INTO space_record
  FROM spaces
  WHERE id = space_id_param;
  
  -- If space is not location restricted, allow access
  IF NOT space_record.location_restricted OR space_record.latitude IS NULL THEN
    RETURN true;
  END IF;
  
  -- Get user location
  SELECT latitude, longitude
  INTO user_record
  FROM user_profiles
  WHERE id = user_id_param;
  
  -- If user has no location, deny access to location-restricted spaces
  IF user_record.latitude IS NULL THEN
    RETURN false;
  END IF;
  
  -- Calculate distance
  distance_miles := calculate_distance_miles(
    user_record.latitude, user_record.longitude,
    space_record.latitude, space_record.longitude
  );
  
  -- Check if within radius
  RETURN distance_miles <= space_record.location_radius;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update spaces RLS policy to respect location restrictions
DROP POLICY IF EXISTS "Anyone can view spaces" ON spaces;

CREATE POLICY "Users can view accessible spaces"
  ON spaces
  FOR SELECT
  TO authenticated
  USING (
    -- Always allow viewing if not location restricted
    NOT location_restricted 
    OR 
    -- Allow if within location radius
    user_can_access_space(auth.uid(), id)
    OR
    -- Always allow space holders to see their own spaces
    holder_id = auth.uid()
    OR
    -- Always allow admins to see all spaces
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Update space_attendees policies to respect location restrictions
DROP POLICY IF EXISTS "Users can join spaces" ON space_attendees;

CREATE POLICY "Users can join accessible spaces"
  ON space_attendees
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND 
    (
      -- Allow joining if space is not location restricted
      NOT EXISTS (
        SELECT 1 FROM spaces 
        WHERE id = space_id AND location_restricted = true
      )
      OR
      -- Allow if within location radius
      user_can_access_space(auth.uid(), space_id)
    )
  );