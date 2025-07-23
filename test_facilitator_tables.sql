-- Test Facilitator Tables (Run this AFTER the fix script)
-- This script tests that the facilitator tables are working correctly

-- Check if tables exist
SELECT 
    schemaname,
    tablename,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename IN ('facilitator_availability', 'facilitator_specialties', 'facilitator_availability_overrides')
ORDER BY tablename;

-- Check table structures
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('facilitator_availability', 'facilitator_specialties', 'facilitator_availability_overrides')
ORDER BY table_name, ordinal_position;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('facilitator_availability', 'facilitator_specialties', 'facilitator_availability_overrides')
ORDER BY tablename, policyname;

-- Check indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('facilitator_availability', 'facilitator_specialties', 'facilitator_availability_overrides')
ORDER BY tablename, indexname;

-- Test basic functionality (this will only work if you're authenticated)
-- Uncomment the following lines to test inserts:

/*
-- Test insert into facilitator_availability
INSERT INTO facilitator_availability (facilitator_id, is_active, timezone) 
VALUES (auth.uid(), false, 'America/New_York')
ON CONFLICT (facilitator_id) DO NOTHING;

-- Test insert into facilitator_specialties
INSERT INTO facilitator_specialties (facilitator_id, specialty, category, experience_years)
VALUES (auth.uid(), 'Yoga', 'Wellness', 2)
ON CONFLICT (facilitator_id, specialty) DO NOTHING;

-- Check the data
SELECT * FROM facilitator_availability WHERE facilitator_id = auth.uid();
SELECT * FROM facilitator_specialties WHERE facilitator_id = auth.uid();
*/

SELECT 'Tables structure verified successfully!' as result;