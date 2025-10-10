-- Create admin_user_ratings table for admins to rate users
CREATE TABLE IF NOT EXISTS admin_user_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating DECIMAL(3,2) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  feedback_category VARCHAR(50), -- e.g., 'community_contribution', 'event_quality', 'space_sharing', 'overall'
  feedback_text TEXT,
  is_public BOOLEAN DEFAULT false, -- Whether this rating is visible to the user
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT different_users CHECK (user_id != admin_id),
  CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5)
);

-- Add indexes for performance
CREATE INDEX idx_admin_user_ratings_user_id ON admin_user_ratings(user_id);
CREATE INDEX idx_admin_user_ratings_admin_id ON admin_user_ratings(admin_id);
CREATE INDEX idx_admin_user_ratings_created_at ON admin_user_ratings(created_at DESC);

-- Add computed column to profiles for admin rating
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS admin_rating DECIMAL(3,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS admin_rating_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS admin_feedback_summary TEXT DEFAULT NULL;

-- Function to update user's admin rating when a new rating is added
CREATE OR REPLACE FUNCTION update_user_admin_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate average admin rating for the user
  UPDATE profiles
  SET 
    admin_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM admin_user_ratings
      WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    ),
    admin_rating_count = (
      SELECT COUNT(*)
      FROM admin_user_ratings
      WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update admin rating on insert/update/delete
DROP TRIGGER IF EXISTS update_admin_rating_trigger ON admin_user_ratings;
CREATE TRIGGER update_admin_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON admin_user_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_admin_rating();

-- RLS Policies for admin_user_ratings
ALTER TABLE admin_user_ratings ENABLE ROW LEVEL SECURITY;

-- Admins can view all ratings
CREATE POLICY admin_view_all_ratings ON admin_user_ratings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can insert ratings
CREATE POLICY admin_insert_ratings ON admin_user_ratings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
    AND admin_id = auth.uid()
  );

-- Admins can update their own ratings
CREATE POLICY admin_update_own_ratings ON admin_user_ratings
  FOR UPDATE
  USING (
    admin_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can delete their own ratings
CREATE POLICY admin_delete_own_ratings ON admin_user_ratings
  FOR DELETE
  USING (
    admin_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Users can view public ratings about themselves
CREATE POLICY users_view_own_public_ratings ON admin_user_ratings
  FOR SELECT
  USING (
    user_id = auth.uid() AND is_public = true
  );

-- Add comment
COMMENT ON TABLE admin_user_ratings IS 'Admin feedback ratings for users - helps admins track user quality and contributions';
COMMENT ON COLUMN admin_user_ratings.feedback_category IS 'Category of feedback: community_contribution, event_quality, space_sharing, behavior, overall';
COMMENT ON COLUMN admin_user_ratings.is_public IS 'Whether this rating/feedback is visible to the rated user';

-- Grant permissions
GRANT SELECT ON admin_user_ratings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON admin_user_ratings TO authenticated;
