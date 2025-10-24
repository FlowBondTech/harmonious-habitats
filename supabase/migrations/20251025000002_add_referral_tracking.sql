-- Referral Tracking System Migration
-- Adds referral attribution and stats tracking for user growth

-- Add referral tracking columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS referral_source TEXT CHECK (referral_source IN ('event', 'direct_link', 'ambassador', 'organic')),
  ADD COLUMN IF NOT EXISTS referral_event_id UUID REFERENCES events(id),
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for referral queries
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by
  ON profiles(referred_by)
  WHERE referred_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_referral_event
  ON profiles(referral_event_id)
  WHERE referral_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed
  ON profiles(onboarding_completed);

-- Create referral_stats table for cached analytics
CREATE TABLE IF NOT EXISTS referral_stats (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_referrals INTEGER DEFAULT 0,
  completed_referrals INTEGER DEFAULT 0,
  pending_referrals INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  last_referral_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT valid_conversion_rate CHECK (conversion_rate >= 0 AND conversion_rate <= 100),
  CONSTRAINT valid_referral_counts CHECK (
    total_referrals >= 0 AND
    completed_referrals >= 0 AND
    pending_referrals >= 0 AND
    completed_referrals + pending_referrals <= total_referrals
  )
);

-- Enable RLS on referral_stats
ALTER TABLE referral_stats ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can view their own referral stats
CREATE POLICY "Users can view their own referral stats" ON referral_stats
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RLS policy: Admins can view all referral stats
CREATE POLICY "Admins can view all referral stats" ON referral_stats
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to update referral stats for a user
CREATE OR REPLACE FUNCTION update_referral_stats(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total INTEGER;
  v_completed INTEGER;
  v_pending INTEGER;
  v_rate DECIMAL(5,2);
  v_last_referral TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Count total referrals (from profiles)
  SELECT COUNT(*) INTO v_total
  FROM profiles
  WHERE referred_by = p_user_id;

  -- Count completed referrals
  SELECT COUNT(*) INTO v_completed
  FROM profiles
  WHERE referred_by = p_user_id
  AND onboarding_completed = true;

  -- Calculate pending
  v_pending := v_total - v_completed;

  -- Calculate conversion rate
  IF v_total > 0 THEN
    v_rate := (v_completed::DECIMAL / v_total::DECIMAL * 100);
  ELSE
    v_rate := 0;
  END IF;

  -- Get last referral timestamp
  SELECT MAX(created_at) INTO v_last_referral
  FROM profiles
  WHERE referred_by = p_user_id;

  -- Upsert referral stats
  INSERT INTO referral_stats (
    user_id,
    total_referrals,
    completed_referrals,
    pending_referrals,
    conversion_rate,
    last_referral_at,
    updated_at
  ) VALUES (
    p_user_id,
    v_total,
    v_completed,
    v_pending,
    v_rate,
    v_last_referral,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_referrals = EXCLUDED.total_referrals,
    completed_referrals = EXCLUDED.completed_referrals,
    pending_referrals = EXCLUDED.pending_referrals,
    conversion_rate = EXCLUDED.conversion_rate,
    last_referral_at = EXCLUDED.last_referral_at,
    updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to track referral when user is created
CREATE OR REPLACE FUNCTION track_referral_on_registration(
  p_user_id UUID,
  p_referred_by UUID,
  p_referral_source TEXT,
  p_referral_event_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update user's referral info
  UPDATE profiles
  SET
    referred_by = p_referred_by,
    referral_source = p_referral_source,
    referral_event_id = p_referral_event_id
  WHERE id = p_user_id;

  -- Update referrer's stats
  PERFORM update_referral_stats(p_referred_by);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to mark onboarding as completed
CREATE OR REPLACE FUNCTION complete_onboarding(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_referred_by UUID;
BEGIN
  -- Get referrer
  SELECT referred_by INTO v_referred_by
  FROM profiles
  WHERE id = p_user_id;

  -- Mark onboarding as completed
  UPDATE profiles
  SET
    onboarding_completed = true,
    onboarding_completed_at = CURRENT_TIMESTAMP
  WHERE id = p_user_id
  AND onboarding_completed = false;

  -- Update referrer's stats if exists
  IF v_referred_by IS NOT NULL THEN
    PERFORM update_referral_stats(v_referred_by);
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get referral leaderboard
CREATE OR REPLACE FUNCTION get_referral_leaderboard(p_limit INTEGER DEFAULT 10)
RETURNS TABLE(
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  total_referrals INTEGER,
  completed_referrals INTEGER,
  conversion_rate DECIMAL(5,2),
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rs.user_id,
    p.full_name,
    p.avatar_url,
    rs.total_referrals,
    rs.completed_referrals,
    rs.conversion_rate,
    ROW_NUMBER() OVER (ORDER BY rs.completed_referrals DESC, rs.total_referrals DESC) as rank
  FROM referral_stats rs
  JOIN profiles p ON p.id = rs.user_id
  WHERE rs.total_referrals > 0
  ORDER BY rs.completed_referrals DESC, rs.total_referrals DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's referral details
CREATE OR REPLACE FUNCTION get_user_referrals(p_user_id UUID)
RETURNS TABLE(
  referred_user_id UUID,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  referral_source TEXT,
  referral_event_id UUID,
  event_title TEXT,
  onboarding_completed BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.email,
    p.avatar_url,
    p.referral_source,
    p.referral_event_id,
    e.title as event_title,
    p.onboarding_completed,
    p.created_at
  FROM profiles p
  LEFT JOIN events e ON e.id = p.referral_event_id
  WHERE p.referred_by = p_user_id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update referral stats when profile is updated
CREATE OR REPLACE FUNCTION trigger_update_referral_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- If onboarding_completed changed to true, update referrer's stats
  IF NEW.onboarding_completed = true AND (OLD.onboarding_completed IS NULL OR OLD.onboarding_completed = false) THEN
    IF NEW.referred_by IS NOT NULL THEN
      PERFORM update_referral_stats(NEW.referred_by);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_referral_stats_on_profile_change
  AFTER UPDATE ON profiles
  FOR EACH ROW
  WHEN (NEW.onboarding_completed = true AND (OLD.onboarding_completed IS NULL OR OLD.onboarding_completed = false))
  EXECUTE FUNCTION trigger_update_referral_stats();

-- Trigger to update referral stats when new referral is added
CREATE OR REPLACE FUNCTION trigger_new_referral()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referred_by IS NOT NULL THEN
    PERFORM update_referral_stats(NEW.referred_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER new_referral_tracking
  AFTER INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.referred_by IS NOT NULL)
  EXECUTE FUNCTION trigger_new_referral();

-- Add comments for documentation
COMMENT ON COLUMN profiles.referred_by IS 'User ID of the person who referred this user (for referral tracking and rewards)';
COMMENT ON COLUMN profiles.referral_source IS 'How the user was referred: event (in-person at event), direct_link (referral link), ambassador (brand ambassador), organic (found naturally)';
COMMENT ON COLUMN profiles.referral_event_id IS 'If referred via event check-in, the event that brought them in';
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether user has completed full profile setup and onboarding flow';
COMMENT ON COLUMN profiles.onboarding_completed_at IS 'Timestamp when user completed onboarding (used for referral conversion tracking)';

COMMENT ON TABLE referral_stats IS 'Cached referral analytics for each user who has referred others. Updated automatically via triggers.';
COMMENT ON COLUMN referral_stats.total_referrals IS 'Total number of users referred (completed + pending)';
COMMENT ON COLUMN referral_stats.completed_referrals IS 'Number of referred users who completed onboarding';
COMMENT ON COLUMN referral_stats.pending_referrals IS 'Number of referred users who have not yet completed onboarding';
COMMENT ON COLUMN referral_stats.conversion_rate IS 'Percentage of referrals who completed onboarding (0-100)';
