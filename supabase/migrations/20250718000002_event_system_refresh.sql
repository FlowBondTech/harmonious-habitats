-- Refresh the schema cache to ensure all new functions are available
-- This is a maintenance migration to ensure the event system is properly initialized

-- Verify the event_participants table has all required columns
DO $$
BEGIN
  -- Add registered_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'event_participants' 
    AND column_name = 'registered_at'
  ) THEN
    ALTER TABLE event_participants 
    ADD COLUMN registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Create or replace the participant count function with better performance
CREATE OR REPLACE FUNCTION get_event_participant_count(p_event_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE((
    SELECT COUNT(*)::INTEGER
    FROM event_participants
    WHERE event_id = p_event_id
    AND status IN ('registered', 'attended')
  ), 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- Create a view for event discovery with participant counts
CREATE OR REPLACE VIEW event_discovery AS
SELECT 
  e.*,
  get_event_participant_count(e.id) as participant_count,
  p.full_name as organizer_name,
  p.avatar_url as organizer_avatar,
  p.verified as organizer_verified,
  CASE 
    WHEN e.capacity > 0 AND get_event_participant_count(e.id) >= e.capacity 
    THEN true 
    ELSE false 
  END as is_full
FROM events e
LEFT JOIN profiles p ON e.organizer_id = p.id
WHERE e.status = 'published' 
AND e.visibility = 'public';

-- Grant access to the view
GRANT SELECT ON event_discovery TO authenticated;

-- Create index for better text search performance
CREATE INDEX IF NOT EXISTS idx_events_search_vector_gin ON events USING GIN(search_vector);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_events_date_status ON events(date, status) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_events_category_date ON events(category, date) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_event_participants_event_status ON event_participants(event_id, status);

-- Add comments for documentation
COMMENT ON VIEW event_discovery IS 'Optimized view for event discovery with participant counts and organizer info';
COMMENT ON FUNCTION get_event_participant_count IS 'Returns the number of registered/attended participants for an event';