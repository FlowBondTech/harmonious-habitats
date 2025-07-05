/*
  # Add animal types support for spaces

  1. New Features
    - Add `animals_allowed` boolean column to spaces table
    - Create `space_animal_types` table for tracking allowed animal types
  
  2. Security
    - Enable RLS on `space_animal_types` table
    - Add policies for space owners to manage animal types
    - Add policies for users to view animal types
*/

-- Add animals_allowed column to spaces table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'spaces' AND column_name = 'animals_allowed'
  ) THEN
    ALTER TABLE spaces ADD COLUMN animals_allowed BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create space_animal_types table if it doesn't exist
CREATE TABLE IF NOT EXISTS space_animal_types (
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  animal_type TEXT NOT NULL,
  PRIMARY KEY (space_id, animal_type)
);

-- Enable RLS
ALTER TABLE space_animal_types ENABLE ROW LEVEL SECURITY;

-- Drop existing policies using a safer approach
DROP POLICY IF EXISTS "Space owners can manage animal types" ON space_animal_types;
DROP POLICY IF EXISTS "Users can view space animal types" ON space_animal_types;

-- Add policies
CREATE POLICY "Space owners can manage animal types" 
  ON space_animal_types
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM spaces
    WHERE spaces.id = space_animal_types.space_id
    AND spaces.owner_id = auth.uid()
  ));

CREATE POLICY "Users can view space animal types" 
  ON space_animal_types
  FOR SELECT
  TO authenticated
  USING (true);