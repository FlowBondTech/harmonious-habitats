-- Minimal fix: Just add the missing columns to spaces table
-- This is what we need to uncomment the filter in supabase.ts

DO $$
BEGIN
  -- Add allow_facilitator_applications column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='spaces' AND column_name='allow_facilitator_applications'
  ) THEN
    ALTER TABLE spaces ADD COLUMN allow_facilitator_applications BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added allow_facilitator_applications column';
  ELSE
    RAISE NOTICE 'allow_facilitator_applications column already exists';
  END IF;

  -- Add application_requirements column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='spaces' AND column_name='application_requirements'
  ) THEN
    ALTER TABLE spaces ADD COLUMN application_requirements JSONB DEFAULT '{}';
    RAISE NOTICE 'Added application_requirements column';
  ELSE
    RAISE NOTICE 'application_requirements column already exists';
  END IF;

  -- Add booking_preferences column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='spaces' AND column_name='booking_preferences'
  ) THEN
    ALTER TABLE spaces ADD COLUMN booking_preferences JSONB DEFAULT '{}';
    RAISE NOTICE 'Added booking_preferences column';
  ELSE
    RAISE NOTICE 'booking_preferences column already exists';
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
  AND column_name IN ('allow_facilitator_applications', 'application_requirements', 'booking_preferences')
ORDER BY column_name;
