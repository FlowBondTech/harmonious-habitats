/*
  # Add animal types support for spaces

  1. New Table
    - `space_animal_types`
      - `space_id` (uuid, primary key, references spaces.id)
      - `animal_type` (text, primary key)
  
  2. Changes
    - Add `animals_allowed` boolean column to spaces table
  
  3. Security
    - Enable RLS on `space_animal_types` table
    - Add policies for space owners to manage animal types
    - Add policy for users to view animal types
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

-- Add policies
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

CREATE POLICY "Users can view space animal types" 
  ON space_animal_types
  FOR SELECT
  TO authenticated
  USING (true);