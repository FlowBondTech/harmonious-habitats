-- Fix missing space relationship tables
-- Run this in Supabase SQL Editor

-- Create space_amenities table
CREATE TABLE IF NOT EXISTS space_amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE NOT NULL,
  amenity TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(space_id, amenity)
);

-- Create space_accessibility_features table
CREATE TABLE IF NOT EXISTS space_accessibility_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE NOT NULL,
  feature TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(space_id, feature)
);

-- Create space_holistic_categories table
CREATE TABLE IF NOT EXISTS space_holistic_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(space_id, category)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_space_amenities_space ON space_amenities(space_id);
CREATE INDEX IF NOT EXISTS idx_space_accessibility_space ON space_accessibility_features(space_id);
CREATE INDEX IF NOT EXISTS idx_space_holistic_space ON space_holistic_categories(space_id);

-- Enable RLS
ALTER TABLE space_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_accessibility_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_holistic_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for space_amenities
DROP POLICY IF EXISTS "Anyone can view space amenities" ON space_amenities;
CREATE POLICY "Anyone can view space amenities" ON space_amenities
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Space owners can manage amenities" ON space_amenities;
CREATE POLICY "Space owners can manage amenities" ON space_amenities
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_amenities.space_id
      AND spaces.owner_id = auth.uid()
    )
  );

-- RLS Policies for space_accessibility_features
DROP POLICY IF EXISTS "Anyone can view accessibility features" ON space_accessibility_features;
CREATE POLICY "Anyone can view accessibility features" ON space_accessibility_features
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Space owners can manage accessibility" ON space_accessibility_features;
CREATE POLICY "Space owners can manage accessibility" ON space_accessibility_features
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_accessibility_features.space_id
      AND spaces.owner_id = auth.uid()
    )
  );

-- RLS Policies for space_holistic_categories
DROP POLICY IF EXISTS "Anyone can view holistic categories" ON space_holistic_categories;
CREATE POLICY "Anyone can view holistic categories" ON space_holistic_categories
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Space owners can manage categories" ON space_holistic_categories;
CREATE POLICY "Space owners can manage categories" ON space_holistic_categories
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_holistic_categories.space_id
      AND spaces.owner_id = auth.uid()
    )
  );

-- Comments for documentation
COMMENT ON TABLE space_amenities IS 'Amenities available at each space';
COMMENT ON TABLE space_accessibility_features IS 'Accessibility features of each space';
COMMENT ON TABLE space_holistic_categories IS 'Holistic/wellness categories for each space';

-- Fix get_user_role_safe permissions (in case it's not properly set)
GRANT EXECUTE ON FUNCTION get_user_role_safe(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role_safe(UUID) TO anon;

-- Also ensure ensure_profile_exists has proper permissions
GRANT EXECUTE ON FUNCTION ensure_profile_exists(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_profile_exists(UUID) TO anon;
