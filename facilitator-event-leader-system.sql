-- ============================================
-- Facilitator Availability & Event Leader System
-- ============================================
-- Features:
-- - Facilitator availability time slots
-- - Facilitator service areas (neighborhoods)
-- - Facilitator whitelists (users/spaces)
-- - Event leaders (co-organizers with edit access)
-- - Facilitator assignments to events
-- - Facilitator invitations and volunteer management

-- ============================================
-- 1. FACILITATOR AVAILABILITY
-- ============================================

-- Facilitator availability schedules
CREATE TABLE IF NOT EXISTS facilitator_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facilitator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Recurring availability (weekly schedule)
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  start_time TIME,
  end_time TIME,

  -- One-time availability (specific dates)
  specific_date DATE,

  -- Type of availability
  availability_type TEXT CHECK (availability_type IN ('recurring', 'one_time', 'blocked')) DEFAULT 'recurring',
  is_available BOOLEAN DEFAULT true,

  -- Additional metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Either recurring (day_of_week) OR one-time (specific_date) must be set
  CONSTRAINT availability_type_check CHECK (
    (availability_type = 'recurring' AND day_of_week IS NOT NULL AND specific_date IS NULL) OR
    (availability_type = 'one_time' AND specific_date IS NOT NULL AND day_of_week IS NULL) OR
    (availability_type = 'blocked' AND specific_date IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_facilitator_availability_facilitator ON facilitator_availability(facilitator_id);
CREATE INDEX IF NOT EXISTS idx_facilitator_availability_day ON facilitator_availability(day_of_week) WHERE availability_type = 'recurring';
CREATE INDEX IF NOT EXISTS idx_facilitator_availability_date ON facilitator_availability(specific_date) WHERE availability_type IN ('one_time', 'blocked');

-- ============================================
-- 2. FACILITATOR SERVICE AREAS
-- ============================================

-- Neighborhoods/areas where facilitators will work
CREATE TABLE IF NOT EXISTS facilitator_service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facilitator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  neighborhood_id UUID REFERENCES neighborhoods(id) ON DELETE CASCADE,

  -- Distance willing to travel from this area (in miles)
  max_distance_miles DECIMAL(5,2) DEFAULT 10,

  -- Priority level (1-5, higher = more preferred)
  priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_facilitator_area UNIQUE(facilitator_id, neighborhood_id)
);

CREATE INDEX IF NOT EXISTS idx_facilitator_service_areas_facilitator ON facilitator_service_areas(facilitator_id);
CREATE INDEX IF NOT EXISTS idx_facilitator_service_areas_neighborhood ON facilitator_service_areas(neighborhood_id);

-- ============================================
-- 3. FACILITATOR WHITELISTS
-- ============================================

-- Specific users or spaces facilitators will work with
CREATE TABLE IF NOT EXISTS facilitator_whitelists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facilitator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Whitelist target (either user or space)
  whitelisted_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  whitelisted_space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,

  -- Whitelist type
  whitelist_type TEXT CHECK (whitelist_type IN ('preferred', 'exclusive', 'blocked')) DEFAULT 'preferred',

  -- Notes about why this entry exists
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Must specify either user or space, not both
  CONSTRAINT whitelist_target_check CHECK (
    (whitelisted_user_id IS NOT NULL AND whitelisted_space_id IS NULL) OR
    (whitelisted_space_id IS NOT NULL AND whitelisted_user_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_facilitator_whitelists_facilitator ON facilitator_whitelists(facilitator_id);
CREATE INDEX IF NOT EXISTS idx_facilitator_whitelists_user ON facilitator_whitelists(whitelisted_user_id);
CREATE INDEX IF NOT EXISTS idx_facilitator_whitelists_space ON facilitator_whitelists(whitelisted_space_id);
CREATE INDEX IF NOT EXISTS idx_facilitator_whitelists_type ON facilitator_whitelists(whitelist_type);

-- ============================================
-- 4. EVENT LEADERS (CO-ORGANIZERS)
-- ============================================

-- Event leaders who can edit events and manage facilitators
CREATE TABLE IF NOT EXISTS event_leaders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  leader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Permissions granted to this leader
  can_edit_event BOOLEAN DEFAULT true,
  can_manage_facilitators BOOLEAN DEFAULT true,
  can_send_invites BOOLEAN DEFAULT true,
  can_manage_volunteers BOOLEAN DEFAULT true,
  can_view_participants BOOLEAN DEFAULT true,

  -- Leader role
  role TEXT DEFAULT 'co-organizer', -- e.g., 'co-organizer', 'facilitator lead', 'volunteer coordinator'

  -- Who added this leader
  added_by UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_event_leader UNIQUE(event_id, leader_id)
);

CREATE INDEX IF NOT EXISTS idx_event_leaders_event ON event_leaders(event_id);
CREATE INDEX IF NOT EXISTS idx_event_leaders_leader ON event_leaders(leader_id);

-- ============================================
-- 5. EVENT FACILITATOR ASSIGNMENTS
-- ============================================

-- Facilitators assigned to specific events
CREATE TABLE IF NOT EXISTS event_facilitators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  facilitator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Assignment status
  status TEXT CHECK (status IN ('invited', 'confirmed', 'declined', 'removed')) DEFAULT 'invited',

  -- Role for this event
  role TEXT, -- e.g., 'lead facilitator', 'assistant', 'volunteer'

  -- Compensation
  compensation_type TEXT CHECK (compensation_type IN ('paid', 'volunteer', 'donation', 'exchange')),
  compensation_amount DECIMAL(10,2),
  compensation_notes TEXT,

  -- Invitation details
  invited_by UUID REFERENCES profiles(id),
  invited_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  response_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_event_facilitator UNIQUE(event_id, facilitator_id)
);

CREATE INDEX IF NOT EXISTS idx_event_facilitators_event ON event_facilitators(event_id);
CREATE INDEX IF NOT EXISTS idx_event_facilitators_facilitator ON event_facilitators(facilitator_id);
CREATE INDEX IF NOT EXISTS idx_event_facilitators_status ON event_facilitators(status);

-- ============================================
-- 6. FACILITATOR REVIEWS (for sorting)
-- ============================================

-- Already exists as event_reviews, but add facilitator-specific view
CREATE OR REPLACE VIEW facilitator_ratings AS
SELECT
  er.reviewer_id as facilitator_id,
  COUNT(*) as total_reviews,
  AVG(er.rating) as average_rating,
  COUNT(CASE WHEN er.rating >= 4 THEN 1 END) as positive_reviews,
  COUNT(CASE WHEN er.rating <= 2 THEN 1 END) as negative_reviews,
  MAX(er.created_at) as last_review_date
FROM event_reviews er
JOIN event_participants ep ON ep.event_id = er.event_id AND ep.user_id = er.reviewer_id
JOIN profiles p ON p.id = er.reviewer_id
WHERE p.is_facilitator = true
GROUP BY er.reviewer_id;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Facilitator Availability Policies
ALTER TABLE facilitator_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Facilitators can manage their own availability"
  ON facilitator_availability FOR ALL
  USING (facilitator_id = auth.uid());

CREATE POLICY "Anyone can view facilitator availability"
  ON facilitator_availability FOR SELECT
  USING (is_available = true);

-- Facilitator Service Areas Policies
ALTER TABLE facilitator_service_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Facilitators can manage their service areas"
  ON facilitator_service_areas FOR ALL
  USING (facilitator_id = auth.uid());

CREATE POLICY "Anyone can view facilitator service areas"
  ON facilitator_service_areas FOR SELECT
  USING (true);

-- Facilitator Whitelists Policies
ALTER TABLE facilitator_whitelists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Facilitators can manage their whitelists"
  ON facilitator_whitelists FOR ALL
  USING (facilitator_id = auth.uid());

CREATE POLICY "Whitelisted users can view their whitelist status"
  ON facilitator_whitelists FOR SELECT
  USING (
    whitelisted_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = facilitator_whitelists.whitelisted_space_id
      AND spaces.owner_id = auth.uid()
    )
  );

-- Event Leaders Policies
ALTER TABLE event_leaders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event organizers can manage leaders"
  ON event_leaders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_leaders.event_id
      AND events.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Event leaders can view themselves"
  ON event_leaders FOR SELECT
  USING (leader_id = auth.uid());

CREATE POLICY "Anyone can view event leaders for public events"
  ON event_leaders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_leaders.event_id
      AND events.status = 'published'
    )
  );

-- Event Facilitators Policies
ALTER TABLE event_facilitators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event organizers and leaders can manage facilitators"
  ON event_facilitators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_facilitators.event_id
      AND events.organizer_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM event_leaders
      WHERE event_leaders.event_id = event_facilitators.event_id
      AND event_leaders.leader_id = auth.uid()
      AND event_leaders.can_manage_facilitators = true
    )
  );

CREATE POLICY "Facilitators can view their assignments"
  ON event_facilitators FOR SELECT
  USING (facilitator_id = auth.uid());

CREATE POLICY "Facilitators can update their own status"
  ON event_facilitators FOR UPDATE
  USING (facilitator_id = auth.uid())
  WITH CHECK (
    facilitator_id = auth.uid() AND
    status IN ('confirmed', 'declined')
  );

CREATE POLICY "Anyone can view confirmed facilitators for public events"
  ON event_facilitators FOR SELECT
  USING (
    status = 'confirmed' AND
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_facilitators.event_id
      AND events.status = 'published'
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if a facilitator is available at a specific time
CREATE OR REPLACE FUNCTION is_facilitator_available(
  p_facilitator_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME
) RETURNS BOOLEAN AS $$
DECLARE
  v_day_of_week INTEGER;
  v_is_available BOOLEAN := false;
BEGIN
  -- Get day of week (0=Sunday, 6=Saturday)
  v_day_of_week := EXTRACT(DOW FROM p_date);

  -- Check for blocked dates
  IF EXISTS (
    SELECT 1 FROM facilitator_availability
    WHERE facilitator_id = p_facilitator_id
    AND availability_type = 'blocked'
    AND specific_date = p_date
    AND (
      (p_start_time >= start_time AND p_start_time < end_time) OR
      (p_end_time > start_time AND p_end_time <= end_time) OR
      (p_start_time <= start_time AND p_end_time >= end_time)
    )
  ) THEN
    RETURN false;
  END IF;

  -- Check for one-time availability
  IF EXISTS (
    SELECT 1 FROM facilitator_availability
    WHERE facilitator_id = p_facilitator_id
    AND availability_type = 'one_time'
    AND specific_date = p_date
    AND is_available = true
    AND p_start_time >= start_time
    AND p_end_time <= end_time
  ) THEN
    RETURN true;
  END IF;

  -- Check for recurring availability
  IF EXISTS (
    SELECT 1 FROM facilitator_availability
    WHERE facilitator_id = p_facilitator_id
    AND availability_type = 'recurring'
    AND day_of_week = v_day_of_week
    AND is_available = true
    AND p_start_time >= start_time
    AND p_end_time <= end_time
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Function to get facilitators sorted by distance and reviews
CREATE OR REPLACE FUNCTION get_available_facilitators(
  p_event_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_latitude DECIMAL,
  p_longitude DECIMAL,
  p_limit INTEGER DEFAULT 20
) RETURNS TABLE (
  facilitator_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  average_rating DECIMAL,
  total_reviews INTEGER,
  distance_miles DECIMAL,
  is_available BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as facilitator_id,
    p.full_name,
    p.avatar_url,
    COALESCE(fr.average_rating, 0) as average_rating,
    COALESCE(fr.total_reviews, 0)::INTEGER as total_reviews,
    -- Calculate distance using Haversine formula (approximate)
    (3959 * acos(
      cos(radians(p_latitude)) *
      cos(radians(CAST(p.facilitator_data->>'latitude' AS DECIMAL))) *
      cos(radians(CAST(p.facilitator_data->>'longitude' AS DECIMAL)) - radians(p_longitude)) +
      sin(radians(p_latitude)) *
      sin(radians(CAST(p.facilitator_data->>'latitude' AS DECIMAL)))
    ))::DECIMAL as distance_miles,
    is_facilitator_available(p.id, p_event_date, p_start_time, p_end_time) as is_available
  FROM profiles p
  LEFT JOIN facilitator_ratings fr ON fr.facilitator_id = p.id
  WHERE p.is_facilitator = true
    AND p.facilitator_verified = true
    AND p.facilitator_data->>'latitude' IS NOT NULL
    AND p.facilitator_data->>'longitude' IS NOT NULL
  ORDER BY
    is_facilitator_available(p.id, p_event_date, p_start_time, p_end_time) DESC,
    COALESCE(fr.average_rating, 0) DESC,
    distance_miles ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE facilitator_availability IS 'Facilitator availability schedules (recurring weekly or one-time dates)';
COMMENT ON TABLE facilitator_service_areas IS 'Neighborhoods and areas where facilitators will work';
COMMENT ON TABLE facilitator_whitelists IS 'Specific users or spaces facilitators prefer or block';
COMMENT ON TABLE event_leaders IS 'Co-organizers with edit access to events';
COMMENT ON TABLE event_facilitators IS 'Facilitators assigned to specific events with roles and compensation';
COMMENT ON VIEW facilitator_ratings IS 'Aggregated facilitator ratings from event reviews';
COMMENT ON FUNCTION is_facilitator_available IS 'Check if a facilitator is available at a specific date/time';
COMMENT ON FUNCTION get_available_facilitators IS 'Get facilitators sorted by distance and reviews for an event';
