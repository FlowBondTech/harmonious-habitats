-- Fix Space Creation Errors SQL Script
-- Run this in Supabase SQL Editor

-- 1. Fix neighborhoods table - add is_active column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'neighborhoods' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE neighborhoods
    ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL;

    RAISE NOTICE 'Added is_active column to neighborhoods table';
  ELSE
    RAISE NOTICE 'is_active column already exists in neighborhoods table';
  END IF;
END $$;

-- 2. Fix spaces table - add missing columns for space sharing
DO $$
BEGIN
  -- Add booking_restriction_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spaces' AND column_name = 'booking_restriction_type'
  ) THEN
    ALTER TABLE spaces
    ADD COLUMN booking_restriction_type TEXT CHECK (booking_restriction_type IN ('radius', 'neighborhoods', 'public'));

    RAISE NOTICE 'Added booking_restriction_type column to spaces table';
  END IF;

  -- Add allowed_neighborhoods
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spaces' AND column_name = 'allowed_neighborhoods'
  ) THEN
    ALTER TABLE spaces
    ADD COLUMN allowed_neighborhoods TEXT[];

    RAISE NOTICE 'Added allowed_neighborhoods column to spaces table';
  END IF;

  -- Add submission_metadata
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spaces' AND column_name = 'submission_metadata'
  ) THEN
    ALTER TABLE spaces
    ADD COLUMN submission_metadata JSONB;

    RAISE NOTICE 'Added submission_metadata column to spaces table';
  END IF;

  -- Add submission_user_agent
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spaces' AND column_name = 'submission_user_agent'
  ) THEN
    ALTER TABLE spaces
    ADD COLUMN submission_user_agent TEXT;

    RAISE NOTICE 'Added submission_user_agent column to spaces table';
  END IF;

  -- Check if capacity column exists (was added earlier)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spaces' AND column_name = 'capacity'
  ) THEN
    ALTER TABLE spaces
    ADD COLUMN capacity INTEGER;

    RAISE NOTICE 'Added capacity column to spaces table';
  ELSE
    RAISE NOTICE 'capacity column already exists in spaces table';
  END IF;
END $$;

-- 3. Create space-images storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'space-images',
  'space-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- 4. Set up storage policies for space-images bucket
-- Delete existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Public can view space images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload space images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own space images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own space images" ON storage.objects;

-- Allow public to view images
CREATE POLICY "Public can view space images"
ON storage.objects FOR SELECT
USING (bucket_id = 'space-images');

-- Allow authenticated users to upload images to their own folder
CREATE POLICY "Authenticated users can upload space images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'space-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own images
CREATE POLICY "Users can update own space images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'space-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'space-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own images
CREATE POLICY "Users can delete own space images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'space-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Verify schema changes
SELECT
  'neighborhoods.is_active' as field,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'neighborhoods' AND column_name = 'is_active'
  ) as exists
UNION ALL
SELECT
  'spaces.booking_restriction_type',
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spaces' AND column_name = 'booking_restriction_type'
  )
UNION ALL
SELECT
  'spaces.allowed_neighborhoods',
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spaces' AND column_name = 'allowed_neighborhoods'
  )
UNION ALL
SELECT
  'spaces.submission_metadata',
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spaces' AND column_name = 'submission_metadata'
  )
UNION ALL
SELECT
  'spaces.submission_user_agent',
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spaces' AND column_name = 'submission_user_agent'
  )
UNION ALL
SELECT
  'spaces.capacity',
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spaces' AND column_name = 'capacity'
  )
UNION ALL
SELECT
  'space-images bucket',
  EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'space-images'
  );

-- 6. Test neighborhoods query
SELECT COUNT(*) as active_neighborhoods_count
FROM neighborhoods
WHERE is_active = true;
