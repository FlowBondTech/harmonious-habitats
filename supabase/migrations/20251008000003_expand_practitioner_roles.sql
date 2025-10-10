-- Expand event_practitioners role options to support diverse facilitator types

-- Drop the existing CHECK constraint on role
ALTER TABLE event_practitioners
DROP CONSTRAINT IF EXISTS event_practitioners_role_check;

-- Add new CHECK constraint with expanded role options
ALTER TABLE event_practitioners
ADD CONSTRAINT event_practitioners_role_check
CHECK (role IN (
  'activity_lead',      -- Main facilitator running the activity
  'preparer',           -- Sets up materials, space preparation
  'cleaner',            -- Cleans during/after event
  'post_event_cleanup', -- Post-event cleanup crew
  'greeter',            -- Welcomes participants
  'food_service',       -- Handles food/beverages
  'materials_manager',  -- Manages supplies and materials
  'tech_support',       -- Handles technical aspects (A/V, virtual, etc.)
  'assistant',          -- General assistant
  'coordinator'         -- Coordinates between different roles
));

-- Update existing roles to new naming convention
UPDATE event_practitioners
SET role = 'activity_lead'
WHERE role = 'lead';

UPDATE event_practitioners
SET role = 'assistant'
WHERE role = 'support';

-- Update the view to reflect new role ordering
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
          WHEN 'activity_lead' THEN 1
          WHEN 'coordinator' THEN 2
          WHEN 'preparer' THEN 3
          WHEN 'greeter' THEN 4
          WHEN 'materials_manager' THEN 5
          WHEN 'food_service' THEN 6
          WHEN 'tech_support' THEN 7
          WHEN 'assistant' THEN 8
          WHEN 'cleaner' THEN 9
          WHEN 'post_event_cleanup' THEN 10
        END
    ) FILTER (WHERE ep.practitioner_id IS NOT NULL),
    '[]'::jsonb
  ) AS practitioners
FROM events e
LEFT JOIN event_practitioners ep ON e.id = ep.event_id
LEFT JOIN profiles p ON ep.practitioner_id = p.id
GROUP BY e.id;

-- Update function to use new default role
CREATE OR REPLACE FUNCTION add_event_practitioner(
  p_event_id UUID,
  p_practitioner_id UUID,
  p_role TEXT DEFAULT 'assistant',
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

-- Update comments to reflect new roles
COMMENT ON COLUMN event_practitioners.role IS 'Role of the practitioner: activity_lead, preparer, cleaner, post_event_cleanup, greeter, food_service, materials_manager, tech_support, assistant, coordinator';
COMMENT ON TABLE event_practitioners IS 'Multiple practitioners can be assigned to an event with different roles - supports diverse facilitator types for large events';
