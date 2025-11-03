-- Event Registry System Migration
-- Adds wedding registry-style item claiming for community events

-- ============================================================================
-- 1. Extend events table with registry settings
-- ============================================================================

ALTER TABLE events
ADD COLUMN IF NOT EXISTS venue_provides_equipment BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS registry_visibility TEXT CHECK (registry_visibility IN ('public', 'organizer_only')) DEFAULT 'public',
ADD COLUMN IF NOT EXISTS registry_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN events.venue_provides_equipment IS 'True for studios/venues with equipment, false for home/informal gatherings';
COMMENT ON COLUMN events.registry_visibility IS 'Who can see what people are bringing: public (all registered) or organizer_only';
COMMENT ON COLUMN events.registry_enabled IS 'Whether the registry feature is enabled for this event';

-- ============================================================================
-- 2. Extend event_materials table with registry features
-- ============================================================================

ALTER TABLE event_materials
ADD COLUMN IF NOT EXISTS registry_type TEXT CHECK (registry_type IN ('required', 'lending')) DEFAULT 'required',
ADD COLUMN IF NOT EXISTS max_quantity INTEGER,
ADD COLUMN IF NOT EXISTS current_claims INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS visibility TEXT CHECK (visibility IN ('public', 'organizer_only')) DEFAULT 'public',
ADD COLUMN IF NOT EXISTS is_template_item BOOLEAN DEFAULT false;

COMMENT ON COLUMN event_materials.registry_type IS 'required = things needed for event, lending = extras people can bring to share';
COMMENT ON COLUMN event_materials.max_quantity IS 'Maximum number that can be claimed (null = unlimited)';
COMMENT ON COLUMN event_materials.current_claims IS 'Current number of claims/reservations';
COMMENT ON COLUMN event_materials.visibility IS 'Inherits from event by default, can be overridden per item';
COMMENT ON COLUMN event_materials.is_template_item IS 'True if auto-generated from template, false if organizer added manually';

-- ============================================================================
-- 3. Create event_material_claims table
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_material_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES event_materials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  claim_type TEXT NOT NULL CHECK (claim_type IN ('personal', 'lending')),
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('claimed', 'cancelled')) DEFAULT 'claimed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Prevent duplicate claims
  UNIQUE(material_id, user_id, claim_type)
);

COMMENT ON TABLE event_material_claims IS 'Tracks who is bringing/reserving what items for events';
COMMENT ON COLUMN event_material_claims.claim_type IS 'personal = for their own use, lending = extra to share with others';
COMMENT ON COLUMN event_material_claims.quantity IS 'How many of this item they are bringing/reserving';
COMMENT ON COLUMN event_material_claims.notes IS 'Optional details (e.g., "bringing acoustic guitar" or "gluten-free pie")';
COMMENT ON COLUMN event_material_claims.status IS 'claimed = active, cancelled = user cancelled their claim';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_claims_material ON event_material_claims(material_id);
CREATE INDEX IF NOT EXISTS idx_claims_user ON event_material_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON event_material_claims(status);

-- ============================================================================
-- 4. Create trigger to update current_claims counter
-- ============================================================================

CREATE OR REPLACE FUNCTION update_material_claims_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate current_claims for the affected material
  UPDATE event_materials
  SET current_claims = (
    SELECT COALESCE(SUM(quantity), 0)
    FROM event_material_claims
    WHERE material_id = COALESCE(NEW.material_id, OLD.material_id)
      AND status = 'claimed'
  )
  WHERE id = COALESCE(NEW.material_id, OLD.material_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_claims_count ON event_material_claims;
CREATE TRIGGER trigger_update_claims_count
  AFTER INSERT OR UPDATE OR DELETE ON event_material_claims
  FOR EACH ROW
  EXECUTE FUNCTION update_material_claims_count();

-- ============================================================================
-- 5. Row Level Security (RLS) Policies
-- ============================================================================

ALTER TABLE event_material_claims ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view claims based on event visibility
CREATE POLICY "Users can view claims based on event visibility"
  ON event_material_claims FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      -- User can always see their own claims
      user_id = auth.uid()
      OR
      -- Check event visibility setting
      EXISTS (
        SELECT 1 FROM event_materials em
        JOIN events e ON e.id = em.event_id
        WHERE em.id = event_material_claims.material_id
          AND (
            -- Public visibility: user must be registered for event
            (e.registry_visibility = 'public'
             AND EXISTS (
               SELECT 1 FROM event_participants ep
               WHERE ep.event_id = e.id
                 AND ep.user_id = auth.uid()
                 AND ep.status = 'registered'
             ))
            OR
            -- Organizer only: user must be event organizer
            (e.registry_visibility = 'organizer_only'
             AND e.organizer_id = auth.uid())
          )
      )
    )
  );

-- Allow registered participants to create claims
CREATE POLICY "Registered participants can create claims"
  ON event_material_claims FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM event_materials em
      JOIN events e ON e.id = em.event_id
      JOIN event_participants ep ON ep.event_id = e.id
      WHERE em.id = material_id
        AND ep.user_id = auth.uid()
        AND ep.status = 'registered'
        AND e.registry_enabled = true
    )
  );

-- Allow users to update their own claims
CREATE POLICY "Users can update their own claims"
  ON event_material_claims FOR UPDATE
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Allow users to delete their own claims
CREATE POLICY "Users can delete their own claims"
  ON event_material_claims FOR DELETE
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- ============================================================================
-- 6. Helper function to get available quantity for a material
-- ============================================================================

CREATE OR REPLACE FUNCTION get_material_available_quantity(p_material_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_max_quantity INTEGER;
  v_current_claims INTEGER;
BEGIN
  SELECT max_quantity, current_claims
  INTO v_max_quantity, v_current_claims
  FROM event_materials
  WHERE id = p_material_id;

  -- If max_quantity is NULL, unlimited availability
  IF v_max_quantity IS NULL THEN
    RETURN 999999; -- Large number to represent unlimited
  END IF;

  -- Return remaining available quantity
  RETURN GREATEST(0, v_max_quantity - COALESCE(v_current_claims, 0));
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_material_available_quantity IS 'Returns available quantity for a material (max - claimed). Returns 999999 for unlimited.';

-- ============================================================================
-- 7. Create updated_at trigger for event_material_claims
-- ============================================================================

CREATE OR REPLACE FUNCTION update_event_material_claims_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_event_material_claims_updated_at ON event_material_claims;
CREATE TRIGGER trigger_update_event_material_claims_updated_at
  BEFORE UPDATE ON event_material_claims
  FOR EACH ROW
  EXECUTE FUNCTION update_event_material_claims_updated_at();
