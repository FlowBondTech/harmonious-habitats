-- Add multiple practitioners per event and event sign-off feature

-- Add event completion and sign-off fields to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('draft', 'published', 'in_progress', 'completed', 'cancelled')) DEFAULT 'published',
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS space_owner_signoff BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS space_owner_signoff_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS space_owner_signoff_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS space_owner_notes TEXT,
ADD COLUMN IF NOT EXISTS completion_notes TEXT;

-- Create event_practitioners table for multiple practitioners per event
CREATE TABLE IF NOT EXISTS event_practitioners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  practitioner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('lead', 'support', 'assistant')) NOT NULL DEFAULT 'support',
  responsibilities TEXT,
  is_confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  preparation_tasks TEXT[],
  cleanup_tasks TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, practitioner_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_practitioners_event_id ON event_practitioners(event_id);
CREATE INDEX IF NOT EXISTS idx_event_practitioners_practitioner_id ON event_practitioners(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_event_practitioners_role ON event_practitioners(role);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_is_completed ON events(is_completed);

-- Create event_signoff_log table for audit trail
CREATE TABLE IF NOT EXISTS event_signoff_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  signed_by UUID REFERENCES profiles(id) NOT NULL,
  signoff_type TEXT CHECK (signoff_type IN ('completion', 'issue_reported', 'partial_completion')) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  preparation_rating INTEGER CHECK (preparation_rating >= 1 AND preparation_rating <= 5),
  notes TEXT,
  issues_reported JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for event signoff log
CREATE INDEX idx_event_signoff_log_event_id ON event_signoff_log(event_id);
CREATE INDEX idx_event_signoff_log_signed_by ON event_signoff_log(signed_by);

-- Enable RLS on new tables
ALTER TABLE event_practitioners ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_signoff_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_practitioners

-- Event organizers can manage practitioners for their events
CREATE POLICY "Event organizers can manage practitioners" ON event_practitioners
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_practitioners.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Practitioners can view events they're assigned to
CREATE POLICY "Practitioners can view their assignments" ON event_practitioners
  FOR SELECT TO authenticated
  USING (practitioner_id = auth.uid());

-- Practitioners can confirm their participation
CREATE POLICY "Practitioners can confirm participation" ON event_practitioners
  FOR UPDATE TO authenticated
  USING (
    practitioner_id = auth.uid()
    AND (is_confirmed IS FALSE OR is_confirmed IS NULL)
  );

-- RLS Policies for event_signoff_log

-- Space owners can create signoffs for events in their spaces
CREATE POLICY "Space owners can sign off events" ON event_signoff_log
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      JOIN spaces ON events.space_id = spaces.id
      WHERE events.id = event_signoff_log.event_id
      AND spaces.owner_id = auth.uid()
    )
  );

-- Event organizers and space owners can view signoff logs
CREATE POLICY "View signoff logs" ON event_signoff_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      LEFT JOIN spaces ON events.space_id = spaces.id
      WHERE events.id = event_signoff_log.event_id
      AND (events.organizer_id = auth.uid() OR spaces.owner_id = auth.uid())
    )
  );

-- Function to handle event completion and signoff
CREATE OR REPLACE FUNCTION complete_event_with_signoff(
  p_event_id UUID,
  p_signoff_type TEXT DEFAULT 'completion',
  p_rating INTEGER DEFAULT NULL,
  p_cleanliness_rating INTEGER DEFAULT NULL,
  p_preparation_rating INTEGER DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_issues JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_space_id UUID;
  v_space_owner_id UUID;
  v_is_space_owner BOOLEAN;
  v_result JSONB;
BEGIN
  -- Get space and owner info
  SELECT e.space_id, s.owner_id
  INTO v_space_id, v_space_owner_id
  FROM events e
  LEFT JOIN spaces s ON e.space_id = s.id
  WHERE e.id = p_event_id;

  -- Check if current user is the space owner
  v_is_space_owner := (auth.uid() = v_space_owner_id);

  IF v_is_space_owner THEN
    -- Update event with space owner signoff
    UPDATE events
    SET
      space_owner_signoff = true,
      space_owner_signoff_at = CURRENT_TIMESTAMP,
      space_owner_signoff_by = auth.uid(),
      space_owner_notes = p_notes,
      is_completed = true,
      completed_at = CURRENT_TIMESTAMP,
      status = 'completed'
    WHERE id = p_event_id;

    -- Create signoff log entry
    INSERT INTO event_signoff_log (
      event_id,
      signed_by,
      signoff_type,
      rating,
      cleanliness_rating,
      preparation_rating,
      notes,
      issues_reported
    ) VALUES (
      p_event_id,
      auth.uid(),
      p_signoff_type,
      p_rating,
      p_cleanliness_rating,
      p_preparation_rating,
      p_notes,
      p_issues
    );

    v_result := jsonb_build_object(
      'success', true,
      'message', 'Event successfully signed off and completed'
    );
  ELSE
    v_result := jsonb_build_object(
      'success', false,
      'message', 'Only space owners can sign off events'
    );
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add practitioners to an event
CREATE OR REPLACE FUNCTION add_event_practitioner(
  p_event_id UUID,
  p_practitioner_id UUID,
  p_role TEXT DEFAULT 'support',
  p_responsibilities TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_is_organizer BOOLEAN;
  v_result JSONB;
BEGIN
  -- Check if current user is the event organizer
  SELECT EXISTS (
    SELECT 1 FROM events
    WHERE id = p_event_id
    AND organizer_id = auth.uid()
  ) INTO v_is_organizer;

  IF v_is_organizer THEN
    INSERT INTO event_practitioners (
      event_id,
      practitioner_id,
      role,
      responsibilities
    ) VALUES (
      p_event_id,
      p_practitioner_id,
      p_role,
      p_responsibilities
    )
    ON CONFLICT (event_id, practitioner_id)
    DO UPDATE SET
      role = EXCLUDED.role,
      responsibilities = EXCLUDED.responsibilities,
      updated_at = CURRENT_TIMESTAMP;

    v_result := jsonb_build_object(
      'success', true,
      'message', 'Practitioner added successfully'
    );
  ELSE
    v_result := jsonb_build_object(
      'success', false,
      'message', 'Only event organizers can add practitioners'
    );
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger for event_practitioners
CREATE TRIGGER update_event_practitioners_updated_at BEFORE UPDATE
  ON event_practitioners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for event details with practitioners
CREATE OR REPLACE VIEW event_details_with_practitioners AS
SELECT
  e.*,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'practitioner_id', ep.practitioner_id,
        'role', ep.role,
        'responsibilities', ep.responsibilities,
        'is_confirmed', ep.is_confirmed,
        'confirmed_at', ep.confirmed_at,
        'full_name', p.full_name,
        'avatar_url', p.avatar_url,
        'is_facilitator', p.is_facilitator
      ) ORDER BY
        CASE ep.role
          WHEN 'lead' THEN 1
          WHEN 'support' THEN 2
          WHEN 'assistant' THEN 3
        END
    ) FILTER (WHERE ep.practitioner_id IS NOT NULL),
    '[]'::jsonb
  ) AS practitioners
FROM events e
LEFT JOIN event_practitioners ep ON e.id = ep.event_id
LEFT JOIN profiles p ON ep.practitioner_id = p.id
GROUP BY e.id;

-- Comments for documentation
COMMENT ON TABLE event_practitioners IS 'Multiple practitioners can be assigned to an event with different roles';
COMMENT ON COLUMN event_practitioners.role IS 'Role of the practitioner: lead (main facilitator), support (helps with prep/cleanup), assistant';
COMMENT ON COLUMN event_practitioners.preparation_tasks IS 'Array of preparation tasks assigned to this practitioner';
COMMENT ON COLUMN event_practitioners.cleanup_tasks IS 'Array of cleanup tasks assigned to this practitioner';
COMMENT ON TABLE event_signoff_log IS 'Audit trail for event completions and space owner signoffs';
COMMENT ON COLUMN events.space_owner_signoff IS 'Whether the space owner has signed off on event completion';
COMMENT ON FUNCTION complete_event_with_signoff IS 'Space owners can sign off on event completion with ratings and feedback';
COMMENT ON FUNCTION add_event_practitioner IS 'Event organizers can add multiple practitioners to their events';