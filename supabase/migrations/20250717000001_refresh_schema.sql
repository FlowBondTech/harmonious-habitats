-- Refresh schema to ensure all changes are visible to PostgREST
-- This migration forces a schema cache refresh

-- Verify space-images bucket exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'space-images') THEN
        INSERT INTO storage.buckets (id, name, public) VALUES ('space-images', 'space-images', true);
    END IF;
END $$;

-- Verify owner_has_pets column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'spaces' 
        AND column_name = 'owner_has_pets'
    ) THEN
        ALTER TABLE spaces ADD COLUMN owner_has_pets BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Verify owner_pet_types column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'spaces' 
        AND column_name = 'owner_pet_types'
    ) THEN
        ALTER TABLE spaces ADD COLUMN owner_pet_types TEXT[] DEFAULT NULL;
    END IF;
END $$;

-- Force PostgREST schema cache reload by notifying
NOTIFY pgrst, 'reload schema';