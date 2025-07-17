-- Create storage buckets using proper Supabase functions
-- This ensures buckets are created with proper permissions

-- Create space-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'space-images',
  'space-images', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create profile-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create event-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing policies if they exist (to recreate them properly)
DROP POLICY IF EXISTS "Public space images are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload space images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own space images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own space images" ON storage.objects;

-- Recreate storage policies for space-images bucket
CREATE POLICY "Public space images are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'space-images');

CREATE POLICY "Authenticated users can upload space images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'space-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own space images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'space-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own space images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'space-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Apply similar policies for other buckets
CREATE POLICY "Public profile images are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

CREATE POLICY "Authenticated users can upload profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public event images are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-images');

CREATE POLICY "Authenticated users can upload event images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);