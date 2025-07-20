-- Enable PostGIS extension for geographic features
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create neighborhoods table
CREATE TABLE neighborhoods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Basic information
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Location
  center_point GEOGRAPHY(POINT, 4326), -- Center point for simple radius-based neighborhoods
  radius_miles INTEGER DEFAULT 2, -- Default 2 mile radius
  
  -- Metadata
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  member_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Premium feature flag
  is_premium BOOLEAN DEFAULT true,
  
  -- Settings
  settings JSONB DEFAULT '{
    "require_verification": true,
    "allow_invites": true,
    "max_invites_per_member": 5,
    "show_in_directory": true
  }'::jsonb
);

-- Create neighborhood boundaries table for complex polygon boundaries (future enhancement)
CREATE TABLE neighborhood_boundaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  neighborhood_id UUID REFERENCES neighborhoods(id) ON DELETE CASCADE,
  boundary GEOGRAPHY(POLYGON, 4326),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create neighborhood members table
CREATE TABLE neighborhood_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  neighborhood_id UUID REFERENCES neighborhoods(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Membership status
  status TEXT CHECK (status IN ('pending', 'verified', 'invited', 'rejected')) DEFAULT 'pending',
  
  -- Verification
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_address TEXT, -- Stored encrypted in future
  verification_method TEXT, -- 'auto', 'manual', 'invited'
  
  -- For invited members
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  invited_at TIMESTAMP WITH TIME ZONE,
  invite_message TEXT,
  
  -- Permissions
  is_gate_holder BOOLEAN DEFAULT false,
  
  -- Activity
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(neighborhood_id, user_id)
);

-- Add neighborhood-related fields to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS primary_neighborhood_id UUID REFERENCES neighborhoods(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS verified_address TEXT, -- Will be encrypted
ADD COLUMN IF NOT EXISTS address_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS neighborhood_premium BOOLEAN DEFAULT false;

-- Add neighborhood fields to events
ALTER TABLE events
ADD COLUMN IF NOT EXISTS neighborhood_id UUID REFERENCES neighborhoods(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS neighborhood_only BOOLEAN DEFAULT false;

-- Add neighborhood fields to spaces  
ALTER TABLE spaces
ADD COLUMN IF NOT EXISTS neighborhood_id UUID REFERENCES neighborhoods(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS neighborhood_only BOOLEAN DEFAULT false;

-- Create indexes for performance
CREATE INDEX idx_neighborhoods_slug ON neighborhoods(slug);
CREATE INDEX idx_neighborhoods_active ON neighborhoods(is_active) WHERE is_active = true;
CREATE INDEX idx_neighborhood_members_user ON neighborhood_members(user_id);
CREATE INDEX idx_neighborhood_members_status ON neighborhood_members(neighborhood_id, status);
CREATE INDEX idx_neighborhood_members_gate_holders ON neighborhood_members(neighborhood_id) WHERE is_gate_holder = true;

-- Spatial index for geographic queries
CREATE INDEX idx_neighborhoods_center_point ON neighborhoods USING GIST(center_point);

-- Indexes for neighborhood filtering
CREATE INDEX idx_events_neighborhood ON events(neighborhood_id) WHERE neighborhood_id IS NOT NULL;
CREATE INDEX idx_spaces_neighborhood ON spaces(neighborhood_id) WHERE neighborhood_id IS NOT NULL;

-- Function to check if a point is within a neighborhood (simple radius check)
CREATE OR REPLACE FUNCTION is_point_in_neighborhood(
  check_point GEOGRAPHY(POINT, 4326),
  neighborhood_uuid UUID
) RETURNS BOOLEAN AS $$
DECLARE
  neighborhood_center GEOGRAPHY(POINT, 4326);
  neighborhood_radius INTEGER;
BEGIN
  SELECT center_point, radius_miles * 1609.34 -- Convert miles to meters
  INTO neighborhood_center, neighborhood_radius
  FROM neighborhoods
  WHERE id = neighborhood_uuid AND is_active = true;
  
  IF neighborhood_center IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN ST_DWithin(check_point, neighborhood_center, neighborhood_radius);
END;
$$ LANGUAGE plpgsql;

-- Function to get user's nearby neighborhoods
CREATE OR REPLACE FUNCTION get_nearby_neighborhoods(
  user_location GEOGRAPHY(POINT, 4326),
  max_distance_miles INTEGER DEFAULT 10
) RETURNS TABLE(
  id UUID,
  name TEXT,
  slug TEXT,
  distance_miles NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.name,
    n.slug,
    ROUND((ST_Distance(user_location, n.center_point) / 1609.34)::NUMERIC, 1) as distance_miles
  FROM neighborhoods n
  WHERE n.is_active = true
    AND ST_DWithin(user_location, n.center_point, max_distance_miles * 1609.34)
  ORDER BY ST_Distance(user_location, n.center_point);
END;
$$ LANGUAGE plpgsql;

-- RLS Policies

-- Neighborhoods table
ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;

-- Anyone can view active neighborhoods
CREATE POLICY "Anyone can view active neighborhoods"
  ON neighborhoods FOR SELECT
  USING (is_active = true);

-- Only admins can create neighborhoods (for now)
CREATE POLICY "Admins can manage neighborhoods"
  ON neighborhoods FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Neighborhood members table
ALTER TABLE neighborhood_members ENABLE ROW LEVEL SECURITY;

-- Members can view their neighborhood's member list
CREATE POLICY "Members can view neighborhood members"
  ON neighborhood_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM neighborhood_members nm
      WHERE nm.neighborhood_id = neighborhood_members.neighborhood_id
        AND nm.user_id = auth.uid()
        AND nm.status IN ('verified', 'invited')
    )
  );

-- Users can view their own membership records
CREATE POLICY "Users can view own membership"
  ON neighborhood_members FOR SELECT
  USING (user_id = auth.uid());

-- Gate holders can manage members
CREATE POLICY "Gate holders can manage members"
  ON neighborhood_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM neighborhood_members nm
      WHERE nm.neighborhood_id = neighborhood_members.neighborhood_id
        AND nm.user_id = auth.uid()
        AND nm.is_gate_holder = true
        AND nm.status = 'verified'
    )
  );

-- Users can request to join (insert pending record)
CREATE POLICY "Users can request to join"
  ON neighborhood_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid() 
    AND status = 'pending'
    AND is_gate_holder = false
  );

-- Update triggers
CREATE OR REPLACE FUNCTION update_neighborhood_member_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE neighborhoods
  SET member_count = (
    SELECT COUNT(*)
    FROM neighborhood_members
    WHERE neighborhood_id = COALESCE(NEW.neighborhood_id, OLD.neighborhood_id)
      AND status IN ('verified', 'invited')
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.neighborhood_id, OLD.neighborhood_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_neighborhood_member_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON neighborhood_members
FOR EACH ROW
EXECUTE FUNCTION update_neighborhood_member_count();

-- Add comments for documentation
COMMENT ON TABLE neighborhoods IS 'Geographic neighborhoods for hyperlocal community building';
COMMENT ON TABLE neighborhood_members IS 'Membership and verification status for neighborhood members';
COMMENT ON COLUMN neighborhoods.center_point IS 'Geographic center point of the neighborhood';
COMMENT ON COLUMN neighborhoods.radius_miles IS 'Radius in miles for simple circular neighborhoods';
COMMENT ON COLUMN neighborhood_members.status IS 'pending: awaiting verification, verified: address verified, invited: invited by gate holder, rejected: verification failed';
COMMENT ON COLUMN neighborhood_members.is_gate_holder IS 'Gate holders can invite non-residents and manage membership';