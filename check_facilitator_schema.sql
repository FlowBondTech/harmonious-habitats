-- Check what columns exist in spaces table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'spaces'
  AND column_name LIKE '%facilitator%'
ORDER BY ordinal_position;

-- Check if space_applications table exists and its columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'space_applications'
ORDER BY ordinal_position;

-- Check what columns exist in profiles table related to facilitators
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name LIKE '%facilitator%'
ORDER BY ordinal_position;

-- Check if the table exists at all
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_name IN ('space_applications', 'facilitator_availability', 'facilitator_specialties')
  AND table_schema = 'public';
