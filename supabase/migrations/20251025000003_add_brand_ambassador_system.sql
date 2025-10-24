-- Brand Ambassador System Migration
-- Adds brand ambassador tiers, ambassador-only events, and auto-promotion

-- Add brand ambassador fields to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_brand_ambassador BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ambassador_tier TEXT CHECK (ambassador_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  ADD COLUMN IF NOT EXISTS ambassador_since TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS ambassador_notes TEXT;

-- Create index for ambassador queries
CREATE INDEX IF NOT EXISTS idx_profiles_brand_ambassador
  ON profiles(is_brand_ambassador)
  WHERE is_brand_ambassador = true;

-- Add ambassador_only field to events
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS ambassador_only BOOLEAN DEFAULT false;

-- Create index for ambassador-only events
CREATE INDEX IF NOT EXISTS idx_events_ambassador_only
  ON events(ambassador_only)
  WHERE ambassador_only = true;

-- Function to calculate ambassador tier based on completed referrals
CREATE OR REPLACE FUNCTION calculate_ambassador_tier(completed_referrals INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF completed_referrals >= 100 THEN
    RETURN 'platinum';
  ELSIF completed_referrals >= 50 THEN
    RETURN 'gold';
  ELSIF completed_referrals >= 25 THEN
    RETURN 'silver';
  ELSIF completed_referrals >= 10 THEN
    RETURN 'bronze';
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update ambassador status based on referral stats
CREATE OR REPLACE FUNCTION update_ambassador_status(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_completed_referrals INTEGER;
  v_new_tier TEXT;
  v_current_tier TEXT;
  v_is_ambassador BOOLEAN;
BEGIN
  -- Get current referral stats
  SELECT completed_referrals INTO v_completed_referrals
  FROM referral_stats
  WHERE user_id = p_user_id;

  -- If no stats found, exit
  IF v_completed_referrals IS NULL THEN
    RETURN;
  END IF;

  -- Calculate new tier
  v_new_tier := calculate_ambassador_tier(v_completed_referrals);

  -- Get current ambassador status
  SELECT is_brand_ambassador, ambassador_tier
  INTO v_is_ambassador, v_current_tier
  FROM profiles
  WHERE id = p_user_id;

  -- Update profile if tier changed or newly qualified
  IF v_new_tier IS NOT NULL THEN
    -- User qualifies for ambassador status
    IF NOT v_is_ambassador OR v_current_tier != v_new_tier THEN
      UPDATE profiles
      SET
        is_brand_ambassador = true,
        ambassador_tier = v_new_tier,
        ambassador_since = COALESCE(ambassador_since, CURRENT_TIMESTAMP),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = p_user_id;
    END IF;
  ELSIF v_is_ambassador THEN
    -- User no longer qualifies (shouldn't happen often, but handle it)
    UPDATE profiles
    SET
      is_brand_ambassador = false,
      ambassador_tier = NULL,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update ambassador status when referral stats change
CREATE OR REPLACE FUNCTION trigger_update_ambassador_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update ambassador status whenever completed_referrals changes
  IF NEW.completed_referrals != COALESCE(OLD.completed_referrals, 0) THEN
    PERFORM update_ambassador_status(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ambassador_status_on_referral_change
  AFTER INSERT OR UPDATE ON referral_stats
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_ambassador_status();

-- Function to manually promote user to ambassador (admin only)
CREATE OR REPLACE FUNCTION admin_promote_to_ambassador(
  p_user_id UUID,
  p_tier TEXT DEFAULT 'bronze',
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Validate tier
  IF p_tier NOT IN ('bronze', 'silver', 'gold', 'platinum') THEN
    RAISE EXCEPTION 'Invalid ambassador tier: %', p_tier;
  END IF;

  -- Update profile
  UPDATE profiles
  SET
    is_brand_ambassador = true,
    ambassador_tier = p_tier,
    ambassador_since = COALESCE(ambassador_since, CURRENT_TIMESTAMP),
    ambassador_notes = p_notes,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to remove ambassador status (admin only)
CREATE OR REPLACE FUNCTION admin_remove_ambassador(
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update profile
  UPDATE profiles
  SET
    is_brand_ambassador = false,
    ambassador_tier = NULL,
    ambassador_notes = p_reason,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get all brand ambassadors
CREATE OR REPLACE FUNCTION get_brand_ambassadors(p_tier TEXT DEFAULT NULL)
RETURNS TABLE(
  user_id UUID,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  ambassador_tier TEXT,
  ambassador_since TIMESTAMP WITH TIME ZONE,
  total_referrals INTEGER,
  completed_referrals INTEGER,
  conversion_rate DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.email,
    p.avatar_url,
    p.ambassador_tier,
    p.ambassador_since,
    COALESCE(rs.total_referrals, 0) as total_referrals,
    COALESCE(rs.completed_referrals, 0) as completed_referrals,
    COALESCE(rs.conversion_rate, 0) as conversion_rate
  FROM profiles p
  LEFT JOIN referral_stats rs ON rs.user_id = p.id
  WHERE p.is_brand_ambassador = true
    AND (p_tier IS NULL OR p.ambassador_tier = p_tier)
  ORDER BY
    CASE p.ambassador_tier
      WHEN 'platinum' THEN 1
      WHEN 'gold' THEN 2
      WHEN 'silver' THEN 3
      WHEN 'bronze' THEN 4
    END,
    rs.completed_referrals DESC NULLS LAST,
    p.ambassador_since ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get ambassador-only events
CREATE OR REPLACE FUNCTION get_ambassador_events(p_user_id UUID)
RETURNS TABLE(
  event_id UUID,
  title TEXT,
  description TEXT,
  date DATE,
  start_time TIME,
  end_time TIME,
  location_name TEXT,
  organizer_name TEXT,
  participant_count BIGINT
) AS $$
BEGIN
  -- Check if user is an ambassador
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_user_id
    AND is_brand_ambassador = true
  ) THEN
    -- Return empty result if not an ambassador
    RETURN;
  END IF;

  -- Return ambassador-only events
  RETURN QUERY
  SELECT
    e.id,
    e.title,
    e.description,
    e.date,
    e.start_time,
    e.end_time,
    e.location_name,
    p.full_name as organizer_name,
    COUNT(ep.id) as participant_count
  FROM events e
  JOIN profiles p ON p.id = e.organizer_id
  LEFT JOIN event_participants ep ON ep.event_id = e.id AND ep.status = 'registered'
  WHERE e.ambassador_only = true
    AND e.status = 'published'
    AND e.date >= CURRENT_DATE
  GROUP BY e.id, e.title, e.description, e.date, e.start_time, e.end_time,
           e.location_name, p.full_name
  ORDER BY e.date ASC, e.start_time ASC;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies for ambassador-only events
-- Allow ambassadors to see ambassador-only events
CREATE POLICY "Ambassadors can view ambassador-only events" ON events
  FOR SELECT
  TO authenticated
  USING (
    ambassador_only = false
    OR
    (
      ambassador_only = true
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_brand_ambassador = true
      )
    )
  );

-- Add comments for documentation
COMMENT ON COLUMN profiles.is_brand_ambassador IS 'Whether user is a brand ambassador for the platform';
COMMENT ON COLUMN profiles.ambassador_tier IS 'Ambassador tier: bronze (10+), silver (25+), gold (50+), platinum (100+) completed referrals';
COMMENT ON COLUMN profiles.ambassador_since IS 'Timestamp when user first became an ambassador';
COMMENT ON COLUMN profiles.ambassador_notes IS 'Admin notes about ambassador status or manual promotions/demotions';

COMMENT ON COLUMN events.ambassador_only IS 'Whether this event is only visible to brand ambassadors';

COMMENT ON FUNCTION calculate_ambassador_tier IS 'Calculates ambassador tier based on completed referrals: bronze=10, silver=25, gold=50, platinum=100';
COMMENT ON FUNCTION update_ambassador_status IS 'Automatically updates user ambassador status based on referral performance';
COMMENT ON FUNCTION admin_promote_to_ambassador IS 'Manually promotes a user to ambassador status (admin function)';
COMMENT ON FUNCTION admin_remove_ambassador IS 'Removes ambassador status from a user (admin function)';
COMMENT ON FUNCTION get_brand_ambassadors IS 'Returns list of all brand ambassadors, optionally filtered by tier';
COMMENT ON FUNCTION get_ambassador_events IS 'Returns ambassador-only events that the user can access';
