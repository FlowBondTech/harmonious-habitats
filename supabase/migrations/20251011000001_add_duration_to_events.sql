-- Add duration_minutes field to events table
-- This allows storing the calculated duration for easier querying and filtering

ALTER TABLE events
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- Update existing events to calculate and store duration
UPDATE events
SET duration_minutes = EXTRACT(EPOCH FROM (
  (DATE '2000-01-01' + end_time) - (DATE '2000-01-01' + start_time)
)) / 60
WHERE duration_minutes IS NULL;

-- Add comment explaining the field
COMMENT ON COLUMN events.duration_minutes IS 'Event duration in minutes, calculated from start_time and end_time';

-- Create an index for filtering by duration
CREATE INDEX IF NOT EXISTS idx_events_duration ON events(duration_minutes) WHERE duration_minutes IS NOT NULL;
