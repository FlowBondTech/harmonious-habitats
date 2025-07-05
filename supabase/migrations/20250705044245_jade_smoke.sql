/*
# Fix Event Participants and Add Index

1. New Indexes
  - Add index on event_participants(user_id) to improve query performance
  - Add index on events(status) to improve filtering by status

2. Changes
  - Add default timestamp for joined_at in event_participants
  - Add trigger to automatically update events.updated_at when participants change

3. Security
  - Update event_participants policy to allow easier participation
*/

-- Create index for faster participant lookup
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON public.event_participants(user_id);

-- Create index for faster status filtering
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);

-- Ensure joined_at has a default value
ALTER TABLE public.event_participants 
ALTER COLUMN joined_at SET DEFAULT now();

-- Create a function to update events.updated_at when participants change
CREATE OR REPLACE FUNCTION update_event_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE events 
  SET updated_at = now() 
  WHERE id = NEW.event_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function
DROP TRIGGER IF EXISTS update_event_on_participant_change ON public.event_participants;

CREATE TRIGGER update_event_on_participant_change
AFTER INSERT OR UPDATE OR DELETE ON public.event_participants
FOR EACH ROW
EXECUTE FUNCTION update_event_timestamp();

-- Update policy for event participants to make joining easier
DROP POLICY IF EXISTS "Users can join events" ON public.event_participants;
CREATE POLICY "Users can join events"
ON public.event_participants
FOR INSERT
TO authenticated
USING (true)
WITH CHECK (user_id = auth.uid());