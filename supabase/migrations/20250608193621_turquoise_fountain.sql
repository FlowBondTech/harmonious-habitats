/*
  # Enhanced User Experience Features

  1. New Tables
    - `space_categories` - Categorize spaces (meditation, yoga, healing, etc.)
    - `space_favorites` - Users can bookmark spaces they're interested in
    - `space_reviews` - User reviews and ratings for spaces they've attended
    - `user_connections` - Users can follow/connect with each other
    - `space_announcements` - Space holders can send updates to attendees
    - `space_waitlist` - Queue system when spaces are full
    - `space_resources` - Additional materials/links for spaces
    - `user_notifications` - In-app notification system

  2. Enhanced Tables
    - Add categories to spaces
    - Add profile pictures and social links to users
    - Add recurring event support to spaces
    - Add requirements and preparation info to spaces

  3. Security
    - Appropriate RLS policies for all new tables
    - Privacy controls for user connections
    - Moderation capabilities for reviews
*/

-- Space categories for better organization and discovery
CREATE TABLE IF NOT EXISTS space_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  color text DEFAULT '#688b61', -- Default sage color
  icon text, -- Lucide icon name
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- User favorites/bookmarks for spaces
CREATE TABLE IF NOT EXISTS space_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  space_id uuid REFERENCES spaces(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, space_id)
);

-- Reviews and ratings for spaces
CREATE TABLE IF NOT EXISTS space_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid REFERENCES spaces(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  is_anonymous boolean DEFAULT false,
  is_approved boolean DEFAULT true, -- For moderation
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(space_id, reviewer_id) -- One review per user per space
);

-- User connections/following system
CREATE TABLE IF NOT EXISTS user_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  following_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  status text CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'accepted',
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id) -- Can't follow yourself
);

-- Announcements from space holders to attendees
CREATE TABLE IF NOT EXISTS space_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid REFERENCES spaces(id) ON DELETE CASCADE,
  author_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  is_urgent boolean DEFAULT false,
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Waitlist for full spaces
CREATE TABLE IF NOT EXISTS space_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid REFERENCES spaces(id) ON DELETE CASCADE,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  position integer, -- Position in waitlist
  joined_waitlist_at timestamptz DEFAULT now(),
  notified_at timestamptz, -- When user was notified of spot availability
  expires_at timestamptz, -- When their waitlist spot expires if not claimed
  UNIQUE(space_id, user_id)
);

-- Additional resources and materials for spaces
CREATE TABLE IF NOT EXISTS space_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid REFERENCES spaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  resource_type text CHECK (resource_type IN ('link', 'document', 'video', 'audio', 'image')) DEFAULT 'link',
  url text,
  file_path text, -- For uploaded files
  is_required boolean DEFAULT false, -- Required reading/preparation
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Notification system
CREATE TABLE IF NOT EXISTS user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'space_update', 'new_review', 'waitlist_spot', 'connection_request', etc.
  title text NOT NULL,
  message text NOT NULL,
  related_space_id uuid REFERENCES spaces(id) ON DELETE CASCADE,
  related_user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  is_read boolean DEFAULT false,
  action_url text, -- Deep link to relevant page
  created_at timestamptz DEFAULT now()
);

-- Add categories relationship to spaces
ALTER TABLE spaces 
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES space_categories(id),
ADD COLUMN IF NOT EXISTS requirements text, -- What attendees need to bring/prepare
ADD COLUMN IF NOT EXISTS what_to_expect text, -- More detailed description of the experience
ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_pattern text, -- JSON for recurring event info
ADD COLUMN IF NOT EXISTS max_advance_booking_days integer DEFAULT 90, -- How far in advance can people book
ADD COLUMN IF NOT EXISTS min_advance_booking_hours integer DEFAULT 2; -- Minimum notice needed

-- Enhance user profiles with social features
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS profile_image_url text,
ADD COLUMN IF NOT EXISTS cover_image_url text,
ADD COLUMN IF NOT EXISTS social_links jsonb, -- Instagram, website, etc.
ADD COLUMN IF NOT EXISTS privacy_settings jsonb DEFAULT '{"profile_visibility": "public", "allow_connections": true, "show_attendance": true}'::jsonb,
ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false, -- For verified instructors/practitioners
ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now();

-- Enable RLS on all new tables
ALTER TABLE space_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for space_categories
CREATE POLICY "Anyone can view active categories"
  ON space_categories FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage categories"
  ON space_categories FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true));

-- RLS Policies for space_favorites
CREATE POLICY "Users can view their own favorites"
  ON space_favorites FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own favorites"
  ON space_favorites FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for space_reviews
CREATE POLICY "Users can view approved reviews"
  ON space_reviews FOR SELECT
  TO authenticated
  USING (is_approved = true);

CREATE POLICY "Users can create reviews for spaces they attended"
  ON space_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM space_attendees 
      WHERE user_id = auth.uid() AND space_id = space_reviews.space_id
    )
  );

CREATE POLICY "Users can update their own reviews"
  ON space_reviews FOR UPDATE
  TO authenticated
  USING (reviewer_id = auth.uid())
  WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Admins can moderate reviews"
  ON space_reviews FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true));

-- RLS Policies for user_connections
CREATE POLICY "Users can view their own connections"
  ON user_connections FOR SELECT
  TO authenticated
  USING (follower_id = auth.uid() OR following_id = auth.uid());

CREATE POLICY "Users can manage their own connections"
  ON user_connections FOR ALL
  TO authenticated
  USING (follower_id = auth.uid())
  WITH CHECK (follower_id = auth.uid());

-- RLS Policies for space_announcements
CREATE POLICY "Space attendees can view announcements"
  ON space_announcements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM space_attendees 
      WHERE user_id = auth.uid() AND space_id = space_announcements.space_id
    )
    OR author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM spaces WHERE id = space_announcements.space_id AND holder_id = auth.uid())
  );

CREATE POLICY "Space holders can create announcements"
  ON space_announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM spaces 
      WHERE id = space_id AND holder_id = auth.uid()
    )
  );

-- RLS Policies for space_waitlist
CREATE POLICY "Users can view their own waitlist entries"
  ON space_waitlist FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can join/leave waitlists"
  ON space_waitlist FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Space holders can view their space waitlists"
  ON space_waitlist FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM spaces 
      WHERE id = space_id AND holder_id = auth.uid()
    )
  );

-- RLS Policies for space_resources
CREATE POLICY "Space attendees can view resources"
  ON space_resources FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM space_attendees 
      WHERE user_id = auth.uid() AND space_id = space_resources.space_id
    )
    OR EXISTS (
      SELECT 1 FROM spaces 
      WHERE id = space_resources.space_id AND holder_id = auth.uid()
    )
  );

CREATE POLICY "Space holders can manage resources"
  ON space_resources FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM spaces 
      WHERE id = space_id AND holder_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM spaces 
      WHERE id = space_id AND holder_id = auth.uid()
    )
  );

-- RLS Policies for user_notifications
CREATE POLICY "Users can view their own notifications"
  ON user_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON user_notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- System can create notifications
CREATE POLICY "System can create notifications"
  ON user_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_space_favorites_user_id ON space_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_space_reviews_space_id ON space_reviews(space_id);
CREATE INDEX IF NOT EXISTS idx_space_reviews_rating ON space_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_user_connections_follower ON user_connections(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_following ON user_connections(following_id);
CREATE INDEX IF NOT EXISTS idx_space_announcements_space_id ON space_announcements(space_id);
CREATE INDEX IF NOT EXISTS idx_space_waitlist_space_id ON space_waitlist(space_id, position);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_unread ON user_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_spaces_category ON spaces(category_id);

-- Create triggers for updated_at
CREATE TRIGGER update_space_reviews_updated_at
  BEFORE UPDATE ON space_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO space_categories (name, description, color, icon) VALUES
  ('Meditation & Mindfulness', 'Meditation sessions, mindfulness practices, and contemplative experiences', '#6366f1', 'brain'),
  ('Yoga & Movement', 'Yoga classes, dance, tai chi, and other movement practices', '#059669', 'activity'),
  ('Sound Healing', 'Sound baths, singing bowls, and vibrational healing', '#7c3aed', 'music'),
  ('Energy Work', 'Reiki, chakra balancing, and other energy healing modalities', '#dc2626', 'zap'),
  ('Nature & Earth', 'Outdoor ceremonies, forest bathing, and earth-based practices', '#16a34a', 'leaf'),
  ('Breathwork', 'Pranayama, holotropic breathwork, and breathing techniques', '#0ea5e9', 'wind'),
  ('Sacred Ceremony', 'Rituals, ceremonies, and spiritual gatherings', '#9333ea', 'sparkles'),
  ('Healing Arts', 'Massage, bodywork, and therapeutic practices', '#f59e0b', 'heart-handshake'),
  ('Learning & Workshop', 'Educational workshops and skill-building sessions', '#3b82f6', 'book-open'),
  ('Community & Social', 'Social gatherings, potlucks, and community building', '#ec4899', 'users')
ON CONFLICT (name) DO NOTHING;

-- Function to automatically manage waitlist positions
CREATE OR REPLACE FUNCTION manage_waitlist_positions()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Set position to next available number
    NEW.position = COALESCE(
      (SELECT MAX(position) + 1 FROM space_waitlist WHERE space_id = NEW.space_id),
      1
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Reorder remaining waitlist entries
    UPDATE space_waitlist 
    SET position = position - 1 
    WHERE space_id = OLD.space_id AND position > OLD.position;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create waitlist position management triggers
CREATE TRIGGER waitlist_position_trigger
  BEFORE INSERT ON space_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION manage_waitlist_positions();

CREATE TRIGGER waitlist_cleanup_trigger
  AFTER DELETE ON space_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION manage_waitlist_positions();

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  target_user_id uuid,
  notification_type text,
  notification_title text,
  notification_message text,
  related_space_id uuid DEFAULT NULL,
  related_user_id uuid DEFAULT NULL,
  action_url text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO user_notifications (
    user_id, type, title, message, 
    related_space_id, related_user_id, action_url
  ) VALUES (
    target_user_id, notification_type, notification_title, notification_message,
    related_space_id, related_user_id, action_url
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's favorite spaces
CREATE OR REPLACE FUNCTION get_user_favorite_spaces(target_user_id uuid DEFAULT auth.uid())
RETURNS TABLE (
  space_id uuid,
  title text,
  description text,
  date date,
  start_time time,
  end_time time,
  location text,
  capacity integer,
  status text,
  pricing_type text,
  price_amount decimal,
  suggested_donation decimal,
  image_url text,
  category_name text,
  holder_name text,
  attendee_count bigint,
  average_rating decimal,
  is_attending boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.description,
    s.date,
    s.start_time,
    s.end_time,
    s.location,
    s.capacity,
    s.status,
    s.pricing_type,
    s.price_amount,
    s.suggested_donation,
    s.image_url,
    sc.name as category_name,
    up.full_name as holder_name,
    COALESCE(attendee_stats.count, 0) as attendee_count,
    COALESCE(review_stats.avg_rating, 0) as average_rating,
    CASE WHEN my_attendance.user_id IS NOT NULL THEN true ELSE false END as is_attending
  FROM space_favorites sf
  JOIN spaces s ON sf.space_id = s.id
  LEFT JOIN space_categories sc ON s.category_id = sc.id
  LEFT JOIN user_profiles up ON s.holder_id = up.id
  LEFT JOIN (
    SELECT space_id, COUNT(*) as count
    FROM space_attendees
    GROUP BY space_id
  ) attendee_stats ON s.id = attendee_stats.space_id
  LEFT JOIN (
    SELECT space_id, AVG(rating::decimal) as avg_rating
    FROM space_reviews
    WHERE is_approved = true
    GROUP BY space_id
  ) review_stats ON s.id = review_stats.space_id
  LEFT JOIN space_attendees my_attendance ON s.id = my_attendance.space_id AND my_attendance.user_id = target_user_id
  WHERE sf.user_id = target_user_id
  ORDER BY sf.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;