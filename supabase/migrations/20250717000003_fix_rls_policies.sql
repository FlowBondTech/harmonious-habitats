-- Fix Row Level Security policies for space-related tables
-- This ensures authenticated users can insert data for their own spaces

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can insert holistic categories for their own spaces" ON space_holistic_categories;
DROP POLICY IF EXISTS "Users can view holistic categories" ON space_holistic_categories;
DROP POLICY IF EXISTS "Users can insert accessibility features for their own spaces" ON space_accessibility_features;
DROP POLICY IF EXISTS "Users can view accessibility features" ON space_accessibility_features;
DROP POLICY IF EXISTS "Users can insert animal types for their own spaces" ON space_animal_types;
DROP POLICY IF EXISTS "Users can view animal types" ON space_animal_types;
DROP POLICY IF EXISTS "Users can insert amenities for their own spaces" ON space_amenities;
DROP POLICY IF EXISTS "Users can view amenities" ON space_amenities;

-- Space Holistic Categories - Allow users to insert categories for their own spaces
CREATE POLICY "Users can insert holistic categories for their own spaces"
ON space_holistic_categories FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM spaces 
    WHERE spaces.id = space_holistic_categories.space_id 
    AND spaces.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can view holistic categories"
ON space_holistic_categories FOR SELECT
TO authenticated
USING (true);

-- Space Accessibility Features - Allow users to insert features for their own spaces
CREATE POLICY "Users can insert accessibility features for their own spaces"
ON space_accessibility_features FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM spaces 
    WHERE spaces.id = space_accessibility_features.space_id 
    AND spaces.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can view accessibility features"
ON space_accessibility_features FOR SELECT
TO authenticated
USING (true);

-- Space Animal Types - Allow users to insert animal types for their own spaces
CREATE POLICY "Users can insert animal types for their own spaces"
ON space_animal_types FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM spaces 
    WHERE spaces.id = space_animal_types.space_id 
    AND spaces.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can view animal types"
ON space_animal_types FOR SELECT
TO authenticated
USING (true);

-- Space Amenities - Allow users to insert amenities for their own spaces
CREATE POLICY "Users can insert amenities for their own spaces"
ON space_amenities FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM spaces 
    WHERE spaces.id = space_amenities.space_id 
    AND spaces.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can view amenities"
ON space_amenities FOR SELECT
TO authenticated
USING (true);

-- Enable RLS on all tables if not already enabled
ALTER TABLE space_holistic_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_accessibility_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_animal_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_amenities ENABLE ROW LEVEL SECURITY;