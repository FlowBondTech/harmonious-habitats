-- Add Message Notifications
-- This migration integrates messages into the notification system

-- Expand notification types to include messages
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
  'new_message'
));

-- Add conversation_id reference to notifications
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;

-- Create index for conversation notifications
CREATE INDEX IF NOT EXISTS idx_notifications_conversation ON notifications(conversation_id) WHERE conversation_id IS NOT NULL;

-- Function to create notification for new message
CREATE OR REPLACE FUNCTION create_notification_for_message()
RETURNS TRIGGER AS $$
DECLARE
  v_recipient_id UUID;
  v_sender_name TEXT;
  v_conversation_type TEXT;
  v_conversation_participants UUID[];
BEGIN
  -- Get sender name
  SELECT full_name INTO v_sender_name
  FROM profiles
  WHERE id = NEW.sender_id;

  -- If conversation_id exists, notify all participants except sender
  IF NEW.conversation_id IS NOT NULL THEN
    -- Get conversation type
    SELECT type INTO v_conversation_type
    FROM conversations
    WHERE id = NEW.conversation_id;

    -- Get all participants except sender
    SELECT array_agg(user_id) INTO v_conversation_participants
    FROM conversation_participants
    WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id
    AND left_at IS NULL;

    -- Create notification for each participant
    IF v_conversation_participants IS NOT NULL THEN
      FOR v_recipient_id IN SELECT unnest(v_conversation_participants)
      LOOP
        -- Check if recipient has notification preferences enabled
        -- (We'll default to true for now, can add preference check later)
        INSERT INTO notifications (
          user_id,
          type,
          title,
          message,
          conversation_id,
          related_user_id,
          metadata
        ) VALUES (
          v_recipient_id,
          'new_message',
          CASE
            WHEN v_conversation_type = 'direct' THEN v_sender_name
            WHEN v_conversation_type = 'event' THEN 'Event Chat'
            WHEN v_conversation_type = 'space' THEN 'Space Chat'
            ELSE 'Group Chat'
          END,
          LEFT(NEW.content, 100), -- Preview of message
          NEW.conversation_id,
          NEW.sender_id,
          jsonb_build_object(
            'message_id', NEW.id,
            'conversation_type', v_conversation_type
          )
        );
      END LOOP;
    END IF;
  -- Legacy: Direct messages without conversation_id
  ELSIF NEW.recipient_id IS NOT NULL THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_user_id,
      metadata
    ) VALUES (
      NEW.recipient_id,
      'new_message',
      v_sender_name,
      LEFT(NEW.content, 100),
      NEW.sender_id,
      jsonb_build_object('message_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for message notifications
DROP TRIGGER IF EXISTS trigger_create_message_notification ON messages;
CREATE TRIGGER trigger_create_message_notification
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_for_message();

-- Update notification preferences to include message notifications
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS message_notifications BOOLEAN DEFAULT true;

-- Function to get unread notification count (including messages)
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM notifications
  WHERE user_id = p_user_id
  AND read_at IS NULL
  AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP);

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON COLUMN notifications.conversation_id IS 'Reference to conversation for message notifications';
COMMENT ON FUNCTION create_notification_for_message IS 'Automatically creates notifications when new messages are sent';
COMMENT ON FUNCTION get_unread_notification_count IS 'Returns total number of unread notifications for a user including message notifications';
