-- Add announcement notification types to the notifications table
-- Run this in Supabase SQL Editor

ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN (
  -- Event notifications
  'event_reminder_24h',
  'event_reminder_1h',
  'event_starting_soon',
  'event_cancelled',
  'event_updated',
  'feedback_request',
  'registration_confirmed',
  'waitlist_promoted',
  -- Space notifications
  'space_booking_request',
  'space_booking_approved',
  'space_booking_rejected',
  -- Message notifications
  'new_message',
  -- Facilitator notifications
  'facilitator_invitation',
  'facilitator_response',
  -- Admin announcement types (NEW)
  'announcement_info',
  'announcement_success',
  'announcement_warning',
  'announcement_error',
  'announcement_system'
));
