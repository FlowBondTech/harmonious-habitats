-- Event Facilitators System
-- This migration creates the many-to-many relationship for events with multiple facilitators

-- Create event_facilitators table
CREATE TABLE IF NOT EXISTS event_facilitators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Relationships
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Role and status
  role TEXT CHECK (role IN (
    'activity_lead',
    'co_facilitator',
    'preparer',
    'setup',
    'cleaner',
    'breakdown',
    'post_event_cleanup',
    'helper'
  )) NOT NULL DEFAULT 'helper',

  status TEXT CHECK (status IN ('invited', 'confirmed', 'declined', 'removed')) DEFAULT 'invited',

  -- Additional details
  notes TEXT,
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  declined_at TIMESTAMP WITH TIME ZONE,

  -- Prevent duplicate facilitators for same event
  UNIQUE(event_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_facilitators_event ON event_facilitators(event_id);
CREATE INDEX IF NOT EXISTS idx_event_facilitators_user ON event_facilitators(user_id);
CREATE INDEX IF NOT EXISTS idx_event_facilitators_status ON event_facilitators(status) WHERE status != 'removed';
CREATE INDEX IF NOT EXISTS idx_event_facilitators_role ON event_facilitators(role);

-- Create updated_at trigger
CREATE TRIGGER update_event_facilitators_updated_at
  BEFORE UPDATE ON event_facilitators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE event_facilitators ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Anyone can view facilitators for public events
CREATE POLICY "Anyone can view event facilitators" ON event_facilitators
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_facilitators.event_id
    )
  );

-- Event organizers can manage facilitators
CREATE POLICY "Event organizers can manage facilitators" ON event_facilitators
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_facilitators.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Facilitators can view their own assignments
CREATE POLICY "Users can view their own facilitator assignments" ON event_facilitators
  FOR SELECT
  USING (user_id = auth.uid());

-- Facilitators can update their own status (confirm/decline)
CREATE POLICY "Facilitators can update their own status" ON event_facilitators
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() AND
    status IN ('confirmed', 'declined')
  );

-- Function to notify facilitators when invited
CREATE OR REPLACE FUNCTION notify_facilitator_invitation()
RETURNS TRIGGER AS $$
DECLARE
  v_event_title TEXT;
  v_organizer_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'invited' THEN
    -- Get event and organizer details
    SELECT e.title, p.full_name INTO v_event_title, v_organizer_name
    FROM events e
    JOIN profiles p ON p.id = e.organizer_id
    WHERE e.id = NEW.event_id;

    -- Create notification
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      event_id,
      related_user_id,
      metadata
    ) VALUES (
      NEW.user_id,
      'facilitator_invitation',
      'Facilitator Invitation',
      v_organizer_name || ' invited you to facilitate "' || v_event_title || '" as ' ||
        REPLACE(NEW.role, '_', ' '),
      NEW.event_id,
      NEW.invited_by,
      jsonb_build_object(
        'facilitator_id', NEW.id,
        'role', NEW.role
      )
    );
  END IF;

  -- Notify organizer when facilitator responds
  IF TG_OP = 'UPDATE' AND OLD.status = 'invited' AND NEW.status IN ('confirmed', 'declined') THEN
    SELECT e.title, e.organizer_id INTO v_event_title
    FROM events e
    WHERE e.id = NEW.event_id;

    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      event_id,
      related_user_id,
      metadata
    )
    SELECT
      e.organizer_id,
      'facilitator_response',
      'Facilitator ' || CASE WHEN NEW.status = 'confirmed' THEN 'Confirmed' ELSE 'Declined' END,
      p.full_name || ' has ' ||
        CASE WHEN NEW.status = 'confirmed' THEN 'confirmed' ELSE 'declined' END ||
        ' your invitation to facilitate "' || v_event_title || '"',
      NEW.event_id,
      NEW.user_id,
      jsonb_build_object(
        'facilitator_id', NEW.id,
        'role', NEW.role,
        'status', NEW.status
      )
    FROM events e
    JOIN profiles p ON p.id = NEW.user_id
    WHERE e.id = NEW.event_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for facilitator notifications
DROP TRIGGER IF EXISTS trigger_notify_facilitator_invitation ON event_facilitators;
CREATE TRIGGER trigger_notify_facilitator_invitation
  AFTER INSERT OR UPDATE ON event_facilitators
  FOR EACH ROW
  EXECUTE FUNCTION notify_facilitator_invitation();

-- Expand notification types to include facilitator invitations
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN (
  'event_reminder_24h',
  'event_reminder_1h',
  'event_starting_soon',
  'event_cancelled',
  'event_updated',
  'feedback_request',
  'registration_confirmed',
  'waitlist_promoted',
  'space_booking_request',
  'space_booking_approved',
  'space_booking_rejected',
  'new_message',
  'facilitator_invitation',
  'facilitator_response'
));

-- RPC function to get event facilitators with user details
CREATE OR REPLACE FUNCTION get_event_facilitators(p_event_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  role TEXT,
  status TEXT,
  notes TEXT,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  user_full_name TEXT,
  user_avatar_url TEXT,
  user_bio TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ef.id,
    ef.user_id,
    ef.role,
    ef.status,
    ef.notes,
    ef.confirmed_at,
    p.full_name,
    p.avatar_url,
    p.bio
  FROM event_facilitators ef
  JOIN profiles p ON p.id = ef.user_id
  WHERE ef.event_id = p_event_id
  AND ef.status != 'removed'
  ORDER BY
    CASE ef.status
      WHEN 'confirmed' THEN 1
      WHEN 'invited' THEN 2
      WHEN 'declined' THEN 3
    END,
    CASE ef.role
      WHEN 'activity_lead' THEN 1
      WHEN 'co_facilitator' THEN 2
      ELSE 3
    END,
    ef.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to invite facilitator
CREATE OR REPLACE FUNCTION invite_event_facilitator(
  p_event_id UUID,
  p_user_id UUID,
  p_role TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_organizer_id UUID;
  v_facilitator_id UUID;
BEGIN
  -- Verify caller is the event organizer
  SELECT organizer_id INTO v_organizer_id
  FROM events
  WHERE id = p_event_id;

  IF v_organizer_id != auth.uid() THEN
    RAISE EXCEPTION 'Only event organizer can invite facilitators';
  END IF;

  -- Insert or update facilitator
  INSERT INTO event_facilitators (
    event_id,
    user_id,
    role,
    notes,
    invited_by,
    status
  ) VALUES (
    p_event_id,
    p_user_id,
    p_role,
    p_notes,
    auth.uid(),
    'invited'
  )
  ON CONFLICT (event_id, user_id)
  DO UPDATE SET
    role = EXCLUDED.role,
    notes = EXCLUDED.notes,
    status = 'invited',
    invited_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
  RETURNING id INTO v_facilitator_id;

  RETURN v_facilitator_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE event_facilitators IS 'Many-to-many relationship for events with multiple facilitators';
COMMENT ON COLUMN event_facilitators.role IS 'Facilitator role: activity_lead, co_facilitator, preparer, setup, cleaner, breakdown, post_event_cleanup, helper';
COMMENT ON COLUMN event_facilitators.status IS 'Invitation status: invited, confirmed, declined, removed';
COMMENT ON FUNCTION get_event_facilitators IS 'Get all facilitators for an event with user details';
COMMENT ON FUNCTION invite_event_facilitator IS 'Invite a user to facilitate an event';
