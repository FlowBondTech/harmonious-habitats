-- Setup storage buckets and policies for image uploads

-- Create space-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('space-images', 'space-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create profile-images bucket if it doesn't exist  
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create event-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for space-images bucket

-- Policy: Anyone can view space images (public bucket)
CREATE POLICY IF NOT EXISTS "Public space images are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'space-images');

-- Policy: Authenticated users can upload space images
CREATE POLICY IF NOT EXISTS "Authenticated users can upload space images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'space-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own space images
CREATE POLICY IF NOT EXISTS "Users can update their own space images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'space-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own space images
CREATE POLICY IF NOT EXISTS "Users can delete their own space images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'space-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for profile-images bucket

-- Policy: Anyone can view profile images (public bucket)
CREATE POLICY IF NOT EXISTS "Public profile images are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

-- Policy: Authenticated users can upload profile images
CREATE POLICY IF NOT EXISTS "Authenticated users can upload profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own profile images
CREATE POLICY IF NOT EXISTS "Users can update their own profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own profile images
CREATE POLICY IF NOT EXISTS "Users can delete their own profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for event-images bucket

-- Policy: Anyone can view event images (public bucket)
CREATE POLICY IF NOT EXISTS "Public event images are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-images');

-- Policy: Authenticated users can upload event images
CREATE POLICY IF NOT EXISTS "Authenticated users can upload event images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own event images
CREATE POLICY IF NOT EXISTS "Users can update their own event images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own event images
CREATE POLICY IF NOT EXISTS "Users can delete their own event images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Comments for documentation
COMMENT ON SCHEMA storage IS 'Supabase storage for file uploads';

-- Note: The foldername function extracts folder structure from file paths
-- This allows users to only access files in folders matching their user ID