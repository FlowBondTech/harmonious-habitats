-- Quick Registration System Migration
-- Adds fields for in-person event check-in with magic link verification

-- Add columns to event_participants for quick registration
ALTER TABLE event_participants
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'verified' CHECK (verification_status IN ('pending', 'verified', 'expired')),
  ADD COLUMN IF NOT EXISTS verification_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS pending_name TEXT,
  ADD COLUMN IF NOT EXISTS pending_email TEXT,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS registered_via TEXT DEFAULT 'online' CHECK (registered_via IN ('in-person', 'online', 'qr-code'));

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_event_participants_verification_token
  ON event_participants(verification_token)
  WHERE verification_token IS NOT NULL;

-- Create index for pending registrations
CREATE INDEX IF NOT EXISTS idx_event_participants_verification_status
  ON event_participants(verification_status);

-- Create index for referral tracking
CREATE INDEX IF NOT EXISTS idx_event_participants_referred_by
  ON event_participants(referred_by)
  WHERE referred_by IS NOT NULL;

-- Function to generate secure verification token
CREATE OR REPLACE FUNCTION generate_verification_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
  token_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random token (32 characters, URL-safe)
    token := encode(gen_random_bytes(24), 'base64');
    token := replace(replace(replace(token, '+', '-'), '/', '_'), '=', '');

    -- Check if token already exists
    SELECT EXISTS(
      SELECT 1 FROM event_participants WHERE verification_token = token
    ) INTO token_exists;

    -- If token doesn't exist, return it
    IF NOT token_exists THEN
      RETURN token;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to create quick registration
CREATE OR REPLACE FUNCTION create_quick_registration(
  p_event_id UUID,
  p_name TEXT,
  p_email TEXT,
  p_referrer_id UUID
)
RETURNS TABLE(
  registration_id UUID,
  verification_token TEXT,
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_token TEXT;
  v_registration_id UUID;
  v_existing_user_id UUID;
BEGIN
  -- Check if email already has a registered user
  SELECT id INTO v_existing_user_id
  FROM profiles
  WHERE email = p_email
  LIMIT 1;

  -- If user exists, check if they're already registered
  IF v_existing_user_id IS NOT NULL THEN
    IF EXISTS(
      SELECT 1 FROM event_participants
      WHERE event_id = p_event_id
      AND user_id = v_existing_user_id
      AND status NOT IN ('cancelled')
    ) THEN
      RETURN QUERY SELECT
        NULL::UUID,
        NULL::TEXT,
        FALSE,
        'User is already registered for this event';
      RETURN;
    END IF;
  END IF;

  -- Generate verification token
  v_token := generate_verification_token();

  -- Create pending registration
  INSERT INTO event_participants (
    event_id,
    user_id,
    verification_status,
    verification_token,
    verification_sent_at,
    pending_name,
    pending_email,
    referred_by,
    registered_via,
    status
  ) VALUES (
    p_event_id,
    v_existing_user_id, -- NULL if new user, UUID if existing
    CASE WHEN v_existing_user_id IS NOT NULL THEN 'verified' ELSE 'pending' END,
    CASE WHEN v_existing_user_id IS NOT NULL THEN NULL ELSE v_token END,
    CASE WHEN v_existing_user_id IS NOT NULL THEN NULL ELSE CURRENT_TIMESTAMP END,
    p_name,
    p_email,
    p_referrer_id,
    'in-person',
    CASE WHEN v_existing_user_id IS NOT NULL THEN 'registered' ELSE 'waitlisted' END
  )
  RETURNING id INTO v_registration_id;

  RETURN QUERY SELECT
    v_registration_id,
    v_token,
    TRUE,
    CASE
      WHEN v_existing_user_id IS NOT NULL
      THEN 'Existing user registered successfully'
      ELSE 'Verification link sent'
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to verify registration token
CREATE OR REPLACE FUNCTION verify_registration_token(
  p_token TEXT,
  p_user_id UUID
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  event_id UUID,
  event_title TEXT
) AS $$
DECLARE
  v_registration event_participants%ROWTYPE;
  v_event events%ROWTYPE;
BEGIN
  -- Get registration by token
  SELECT * INTO v_registration
  FROM event_participants
  WHERE verification_token = p_token
  AND verification_status = 'pending';

  -- Check if token exists
  IF v_registration.id IS NULL THEN
    RETURN QUERY SELECT
      FALSE,
      'Invalid or expired verification token'::TEXT,
      NULL::UUID,
      NULL::TEXT;
    RETURN;
  END IF;

  -- Check if token is expired (24 hours)
  IF v_registration.verification_sent_at < (CURRENT_TIMESTAMP - INTERVAL '24 hours') THEN
    -- Mark as expired
    UPDATE event_participants
    SET verification_status = 'expired'
    WHERE id = v_registration.id;

    RETURN QUERY SELECT
      FALSE,
      'Verification token has expired'::TEXT,
      NULL::UUID,
      NULL::TEXT;
    RETURN;
  END IF;

  -- Get event details
  SELECT * INTO v_event
  FROM events
  WHERE id = v_registration.event_id;

  -- Update registration with user_id and mark as verified
  UPDATE event_participants
  SET
    user_id = p_user_id,
    verification_status = 'verified',
    verified_at = CURRENT_TIMESTAMP,
    status = 'registered',
    verification_token = NULL -- Clear token after use
  WHERE id = v_registration.id;

  -- Return success with event info
  RETURN QUERY SELECT
    TRUE,
    'Registration verified successfully'::TEXT,
    v_event.id,
    v_event.title;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending registrations for an event
CREATE OR REPLACE FUNCTION get_pending_registrations(p_event_id UUID)
RETURNS TABLE(
  id UUID,
  pending_name TEXT,
  pending_email TEXT,
  verification_sent_at TIMESTAMP WITH TIME ZONE,
  registered_via TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ep.id,
    ep.pending_name,
    ep.pending_email,
    ep.verification_sent_at,
    ep.registered_via
  FROM event_participants ep
  WHERE ep.event_id = p_event_id
  AND ep.verification_status = 'pending'
  ORDER BY ep.verification_sent_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies to allow organizers to create quick registrations
-- Allow event organizers to insert pending registrations without user_id
CREATE POLICY "Event organizers can create quick registrations" ON event_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_participants.event_id
      AND events.organizer_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- Allow pending registrations to be viewed by event organizers
CREATE POLICY "Event organizers can view pending registrations" ON event_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_participants.event_id
      AND events.organizer_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- Add comment for documentation
COMMENT ON COLUMN event_participants.verification_status IS 'Status of registration verification: pending (waiting for magic link), verified (completed), expired (token expired)';
COMMENT ON COLUMN event_participants.verification_token IS 'Unique token for magic link verification, cleared after use';
COMMENT ON COLUMN event_participants.pending_name IS 'Name entered during in-person registration, before user account created';
COMMENT ON COLUMN event_participants.pending_email IS 'Email entered during in-person registration, used to send verification link';
COMMENT ON COLUMN event_participants.referred_by IS 'User ID of event organizer who registered this attendee (for referral tracking)';
COMMENT ON COLUMN event_participants.registered_via IS 'Method of registration: in-person (at event check-in), online (via website), qr-code (scanned QR)';
