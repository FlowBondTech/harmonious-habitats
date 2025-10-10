-- Fix user_locations table - add all missing columns
-- Run this in Supabase SQL Editor

-- Add address column if it doesn't exist
ALTER TABLE user_locations
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add is_favorite column if it doesn't exist
ALTER TABLE user_locations
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Add visit_count column if it doesn't exist
ALTER TABLE user_locations
ADD COLUMN IF NOT EXISTS visit_count INTEGER DEFAULT 0;

-- Add total_time_spent column if it doesn't exist (interval type for tracking time)
ALTER TABLE user_locations
ADD COLUMN IF NOT EXISTS total_time_spent INTERVAL DEFAULT '00:00:00';

-- Add updated_at column if it doesn't exist
ALTER TABLE user_locations
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_locations_user_favorite
ON user_locations(user_id, is_favorite DESC);

CREATE INDEX IF NOT EXISTS idx_user_locations_visit_count
ON user_locations(visit_count DESC);

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_user_locations_updated_at ON user_locations;
CREATE TRIGGER update_user_locations_updated_at
BEFORE UPDATE ON user_locations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON COLUMN user_locations.address IS 'Human-readable address of the location';
COMMENT ON COLUMN user_locations.is_favorite IS 'Whether this location is marked as a favorite by the user';
COMMENT ON COLUMN user_locations.visit_count IS 'Number of times the user has visited this location';
COMMENT ON COLUMN user_locations.total_time_spent IS 'Total time spent at this location';
COMMENT ON COLUMN user_locations.updated_at IS 'Timestamp when the record was last updated';

-- Update any existing rows to have sensible defaults
UPDATE user_locations
SET visit_count = 1
WHERE visit_count IS NULL OR visit_count = 0;