/*
  # Fix space animal types policies

  1. Changes
    - Add animals_allowed column to spaces table if not exists
    - Create space_animal_types table if not exists
    - Enable RLS on space_animal_types
    - Add policies with existence checks to prevent errors
*/

-- Add animals_allowed column to spaces table
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS animals_allowed BOOLEAN DEFAULT false;

-- Create space_animal_types table
CREATE TABLE IF NOT EXISTS space_animal_types (
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  animal_type TEXT NOT NULL,
  PRIMARY KEY (space_id, animal_type)
);

-- Enable RLS
ALTER TABLE space_animal_types ENABLE ROW LEVEL SECURITY;

-- Add policies with existence checks
DO $$ 
BEGIN
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