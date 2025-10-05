-- Essential schema setup for Harmony Spaces
-- Run this in Supabase SQL Editor

-- Add missing profile columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS interests TEXT[];

-- Create ensure_profile_exists function
CREATE OR REPLACE FUNCTION ensure_profile_exists(user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO profiles (id, created_at, updated_at)
  VALUES (user_id, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create get_user_role_safe function
CREATE OR REPLACE FUNCTION get_user_role_safe(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = user_id;

  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create user_locations table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  location_name TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  visit_count INTEGER DEFAULT 1,
  last_visited_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for user_locations
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own locations" ON user_locations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own locations" ON user_locations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own locations" ON user_locations
  FOR UPDATE USING (auth.uid() = user_id);

-- Fix space-related tables (simplified version)
-- Note: You may need to run the full migrations for complete space functionality
