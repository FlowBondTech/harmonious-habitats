-- Add missing columns to spaces table that are used in the app but missing from database

DO $$
BEGIN
  -- Add animals_allowed column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='spaces' AND column_name='animals_allowed'
  ) THEN
    ALTER TABLE spaces ADD COLUMN animals_allowed BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added animals_allowed column';
  ELSE
    RAISE NOTICE 'animals_allowed column already exists';
  END IF;

  -- Add owner_has_pets column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='spaces' AND column_name='owner_has_pets'
  ) THEN
    ALTER TABLE spaces ADD COLUMN owner_has_pets BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added owner_has_pets column';
  ELSE
    RAISE NOTICE 'owner_has_pets column already exists';
  END IF;

  -- Add owner_pet_types column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='spaces' AND column_name='owner_pet_types'
  ) THEN
    ALTER TABLE spaces ADD COLUMN owner_pet_types TEXT[];
    RAISE NOTICE 'Added owner_pet_types column';
  ELSE
    RAISE NOTICE 'owner_pet_types column already exists';
  END IF;
END $$;

-- Verify the columns were added
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'spaces'
  AND column_name IN ('animals_allowed', 'owner_has_pets', 'owner_pet_types')
ORDER BY column_name;
