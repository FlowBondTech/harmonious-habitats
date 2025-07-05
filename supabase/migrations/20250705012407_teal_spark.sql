/*
  # Add animal types support
  
  1. New Columns
    - Add `animals_allowed` boolean column to spaces table
  
  2. New Tables
    - Create `space_animal_types` junction table if it doesn't exist
  
  3. Security
    - Enable RLS on the new table
    - Add policies for managing and viewing animal types
*/

-- Add animals_allowed column to spaces table
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS animals_allowed BOOLEAN DEFAULT false;

-- Create space_animal_types table if it doesn't exist
CREATE TABLE IF NOT EXISTS space_animal_types (
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  animal_type TEXT NOT NULL,
  PRIMARY KEY (space_id, animal_type)
);

-- Enable RLS if not already enabled
ALTER TABLE space_animal_types ENABLE ROW LEVEL SECURITY;

-- Add policies if they don't exist
DO $$
BEGIN
  -- Check if the policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'space_animal_types' 
    AND policyname = 'Space owners can manage animal types'
  ) THEN
    CREATE POLICY "Space owners can manage animal types" 
      ON space_animal_types
      FOR ALL
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM spaces
        WHERE spaces.id = space_animal_types.space_id
        AND spaces.owner_id = auth.uid()
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM spaces
        WHERE spaces.id = space_animal_types.space_id
        AND spaces.owner_id = auth.uid()
      ));
  END IF;
  
  -- Check if the policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'space_animal_types' 
    AND policyname = 'Users can view space animal types'
  ) THEN
    CREATE POLICY "Users can view space animal types" 
      ON space_animal_types
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;