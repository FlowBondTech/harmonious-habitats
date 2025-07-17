-- Add owner pet information columns to spaces table

-- Add the missing pet columns
ALTER TABLE spaces 
ADD COLUMN IF NOT EXISTS owner_has_pets BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS owner_pet_types TEXT[] DEFAULT NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_spaces_owner_has_pets ON spaces(owner_has_pets);
CREATE INDEX IF NOT EXISTS idx_spaces_owner_pet_types ON spaces USING GIN(owner_pet_types);

-- Add comments for documentation
COMMENT ON COLUMN spaces.owner_has_pets IS 'Whether the space owner has pets on the property';
COMMENT ON COLUMN spaces.owner_pet_types IS 'Array of pet types the owner has (dogs, cats, birds, etc.)';

-- Update any existing spaces that might need default values
UPDATE spaces 
SET owner_has_pets = false 
WHERE owner_has_pets IS NULL;

UPDATE spaces 
SET owner_pet_types = NULL 
WHERE owner_pet_types IS NULL;