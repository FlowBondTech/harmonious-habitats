-- Notifications and Feedback System
-- This migration adds notification and feedback functionality for events

-- Notifications table for in-app and future email notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Recipient
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Notification details
  type TEXT NOT NULL CHECK (type IN (
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
    'space_booking_rejected'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Related entities
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  related_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Notification state
  read_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Event feedback table (private for moderation initially)
CREATE TABLE IF NOT EXISTS event_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Feedback details
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic feedback
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5) NOT NULL,
  would_recommend BOOLEAN,
  
  -- Detailed ratings (optional)
  content_rating INTEGER CHECK (content_rating >= 1 AND content_rating <= 5),
  facilitator_rating INTEGER CHECK (facilitator_rating >= 1 AND facilitator_rating <= 5),
  venue_rating INTEGER CHECK (venue_rating >= 1 AND venue_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  
  -- Written feedback
  what_went_well TEXT,
  what_could_improve TEXT,
  additional_comments TEXT,
  
  -- Follow-up questions
  learned_something_new BOOLEAN,
  felt_welcomed BOOLEAN,
  clear_instructions BOOLEAN,
  appropriate_skill_level BOOLEAN,
  
  -- Moderation
  is_public BOOLEAN DEFAULT false,
  moderated_at TIMESTAMP WITH TIME ZONE,
  moderated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  moderation_notes TEXT,
  
  -- Metadata
  feedback_metadata JSONB DEFAULT '{}',
  
  -- Prevent duplicate feedback
  UNIQUE(event_id, user_id)
);

-- Participant management enhancements
-- Add rejection functionality to event_participants
ALTER TABLE event_participants 
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS reinstated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reinstated_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Update the status enum to include rejected
DO $$
BEGIN
  -- Check if 'rejected' status doesn't exist in the constraint
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.check_constraints 
    WHERE constraint_name LIKE '%event_participants_status_check%' 
    AND check_clause LIKE '%rejected%'
  ) THEN
    -- Drop the old constraint and add new one with rejected status
    ALTER TABLE event_participants DROP CONSTRAINT IF EXISTS event_participants_status_check;
    ALTER TABLE event_participants ADD CONSTRAINT event_participants_status_check 
      CHECK (status IN ('registered', 'waitlisted', 'cancelled', 'attended', 'no_show', 'rejected'));
  END IF;
END $$;

-- Notification preferences table for future email integration
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- In-app notifications
  event_reminders BOOLEAN DEFAULT true,
  feedback_requests BOOLEAN DEFAULT true,
  registration_updates BOOLEAN DEFAULT true,
  space_updates BOOLEAN DEFAULT true,
  
  -- Future email notifications (for roadmap)
  email_notifications_enabled BOOLEAN DEFAULT false,
  email_daily_digest BOOLEAN DEFAULT false,
  email_weekly_summary BOOLEAN DEFAULT false,
  email_event_reminders BOOLEAN DEFAULT false,
  email_feedback_requests BOOLEAN DEFAULT false,
  
  -- Timing preferences
  reminder_24h BOOLEAN DEFAULT true,
  reminder_1h BOOLEAN DEFAULT true,
  reminder_starting_soon BOOLEAN DEFAULT true,
  
  -- Metadata
  preferences_metadata JSONB DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type_scheduled ON notifications(type, scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_event_feedback_event ON event_feedback(event_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_moderation ON event_feedback(is_public, moderated_at);
CREATE INDEX IF NOT EXISTS idx_participants_rejected ON event_participants(event_id, status) WHERE status = 'rejected';

-- RLS Policies

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (true); -- Will be restricted by application logic

CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Event feedback policies
CREATE POLICY "Users can create their own feedback" ON event_feedback
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM event_participants
      WHERE event_participants.event_id = event_feedback.event_id
      AND event_participants.user_id = auth.uid()
      AND event_participants.status = 'attended'
    )
  );

CREATE POLICY "Users can view their own feedback" ON event_feedback
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Event organizers can view feedback for their events" ON event_feedback
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_feedback.event_id
      AND events.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own feedback" ON event_feedback
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Notification preferences policies
CREATE POLICY "Users can manage their own preferences" ON notification_preferences
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Functions for notification management

-- Function to create pre-event reminders
CREATE OR REPLACE FUNCTION schedule_event_reminders(p_event_id UUID)
RETURNS void AS $$
DECLARE
  v_event events%ROWTYPE;
  v_participant RECORD;
  v_event_datetime TIMESTAMP WITH TIME ZONE;
  v_reminder_24h TIMESTAMP WITH TIME ZONE;
  v_reminder_1h TIMESTAMP WITH TIME ZONE;
  v_reminder_soon TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get event details
  SELECT * INTO v_event FROM events WHERE id = p_event_id;
  
  IF v_event.id IS NULL THEN
    RETURN;
  END IF;
  
  -- Calculate event datetime
  v_event_datetime := (v_event.date || ' ' || v_event.start_time)::TIMESTAMP WITH TIME ZONE;
  
  -- Calculate reminder times
  v_reminder_24h := v_event_datetime - INTERVAL '24 hours';
  v_reminder_1h := v_event_datetime - INTERVAL '1 hour';
  v_reminder_soon := v_event_datetime - INTERVAL '15 minutes';
  
  -- Schedule reminders for all registered participants
  FOR v_participant IN 
    SELECT ep.user_id, np.reminder_24h, np.reminder_1h, np.reminder_starting_soon
    FROM event_participants ep
    LEFT JOIN notification_preferences np ON ep.user_id = np.user_id
    WHERE ep.event_id = p_event_id
    AND ep.status IN ('registered', 'waitlisted')
  LOOP
    -- 24-hour reminder
    IF COALESCE(v_participant.reminder_24h, true) AND v_reminder_24h > CURRENT_TIMESTAMP THEN
      INSERT INTO notifications (
        user_id, type, title, message, event_id, scheduled_for
      ) VALUES (
        v_participant.user_id,
        'event_reminder_24h',
        'Event Tomorrow: ' || v_event.title,
        'Don''t forget about "' || v_event.title || '" happening tomorrow at ' || 
        v_event.start_time || '. We''re excited to see you there!',
        p_event_id,
        v_reminder_24h
      );
    END IF;
    
    -- 1-hour reminder
    IF COALESCE(v_participant.reminder_1h, true) AND v_reminder_1h > CURRENT_TIMESTAMP THEN
      INSERT INTO notifications (
        user_id, type, title, message, event_id, scheduled_for
      ) VALUES (
        v_participant.user_id,
        'event_reminder_1h',
        'Event Starting Soon: ' || v_event.title,
        '"' || v_event.title || '" starts in 1 hour! Make sure you have everything you need.',
        p_event_id,
        v_reminder_1h
      );
    END IF;
    
    -- Starting soon reminder
    IF COALESCE(v_participant.reminder_starting_soon, true) AND v_reminder_soon > CURRENT_TIMESTAMP THEN
      INSERT INTO notifications (
        user_id, type, title, message, event_id, scheduled_for
      ) VALUES (
        v_participant.user_id,
        'event_starting_soon',
        'Event Starting: ' || v_event.title,
        '"' || v_event.title || '" is starting in 15 minutes! Time to join.',
        p_event_id,
        v_reminder_soon
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to request feedback after events
CREATE OR REPLACE FUNCTION schedule_feedback_requests()
RETURNS void AS $$
DECLARE
  v_event RECORD;
  v_participant RECORD;
  v_event_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Find events that ended in the last 2 hours and haven't had feedback requested
  FOR v_event IN
    SELECT e.*, (e.date || ' ' || e.end_time)::TIMESTAMP WITH TIME ZONE as event_end
    FROM events e
    WHERE e.status = 'published'
    AND (e.date || ' ' || e.end_time)::TIMESTAMP WITH TIME ZONE < CURRENT_TIMESTAMP
    AND (e.date || ' ' || e.end_time)::TIMESTAMP WITH TIME ZONE > CURRENT_TIMESTAMP - INTERVAL '2 hours'
    AND NOT EXISTS (
      SELECT 1 FROM notifications n 
      WHERE n.event_id = e.id 
      AND n.type = 'feedback_request'
    )
  LOOP
    -- Request feedback from attended participants
    FOR v_participant IN
      SELECT ep.user_id, np.feedback_requests
      FROM event_participants ep
      LEFT JOIN notification_preferences np ON ep.user_id = np.user_id
      WHERE ep.event_id = v_event.id
      AND ep.status = 'attended'
    LOOP
      IF COALESCE(v_participant.feedback_requests, true) THEN
        INSERT INTO notifications (
          user_id, type, title, message, event_id
        ) VALUES (
          v_participant.user_id,
          'feedback_request',
          'How was "' || v_event.title || '"?',
          'We''d love to hear about your experience at "' || v_event.title || '". Your feedback helps us improve future events!',
          v_event.id
        );
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to reject a participant (for hosts)
CREATE OR REPLACE FUNCTION reject_participant(
  p_event_id UUID,
  p_user_id UUID,
  p_rejected_by UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  v_is_organizer boolean;
BEGIN
  -- Check if the rejector is the event organizer
  SELECT EXISTS(
    SELECT 1 FROM events 
    WHERE id = p_event_id 
    AND organizer_id = p_rejected_by
  ) INTO v_is_organizer;
  
  IF NOT v_is_organizer THEN
    RAISE EXCEPTION 'Only event organizers can reject participants';
  END IF;
  
  -- Update participant status
  UPDATE event_participants 
  SET 
    status = 'rejected',
    rejected_at = CURRENT_TIMESTAMP,
    rejected_by = p_rejected_by,
    rejection_reason = p_reason
  WHERE event_id = p_event_id 
  AND user_id = p_user_id
  AND status NOT IN ('rejected', 'cancelled');
  
  -- Create notification for rejected user
  INSERT INTO notifications (
    user_id, type, title, message, event_id, related_user_id
  ) VALUES (
    p_user_id,
    'registration_cancelled',
    'Registration Update',
    'Your registration for this event has been updated by the organizer.',
    p_event_id,
    p_rejected_by
  );
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to reinstate a participant
CREATE OR REPLACE FUNCTION reinstate_participant(
  p_event_id UUID,
  p_user_id UUID,
  p_reinstated_by UUID
)
RETURNS boolean AS $$
DECLARE
  v_is_organizer boolean;
BEGIN
  -- Check if the reinstater is the event organizer
  SELECT EXISTS(
    SELECT 1 FROM events 
    WHERE id = p_event_id 
    AND organizer_id = p_reinstated_by
  ) INTO v_is_organizer;
  
  IF NOT v_is_organizer THEN
    RAISE EXCEPTION 'Only event organizers can reinstate participants';
  END IF;
  
  -- Update participant status
  UPDATE event_participants 
  SET 
    status = 'registered',
    reinstated_at = CURRENT_TIMESTAMP,
    reinstated_by = p_reinstated_by
  WHERE event_id = p_event_id 
  AND user_id = p_user_id
  AND status = 'rejected';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Trigger to schedule reminders when participants register
CREATE OR REPLACE FUNCTION trigger_schedule_reminders()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('registered', 'waitlisted') AND 
     (OLD IS NULL OR OLD.status NOT IN ('registered', 'waitlisted')) THEN
    PERFORM schedule_event_reminders(NEW.event_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schedule_reminders_on_registration
  AFTER INSERT OR UPDATE ON event_participants
  FOR EACH ROW
  EXECUTE FUNCTION trigger_schedule_reminders();

-- Insert default notification preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM profiles 
WHERE id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE notifications IS 'In-app and future email notifications for users';
COMMENT ON TABLE event_feedback IS 'Private feedback for events, moderated before going public';
COMMENT ON TABLE notification_preferences IS 'User preferences for notifications and future email settings';
COMMENT ON FUNCTION schedule_event_reminders IS 'Schedules pre-event reminder notifications for participants';
COMMENT ON FUNCTION schedule_feedback_requests IS 'Requests feedback from attendees after events complete';
COMMENT ON FUNCTION reject_participant IS 'Allows event organizers to reject participants';
COMMENT ON FUNCTION reinstate_participant IS 'Allows event organizers to reinstate rejected participants';