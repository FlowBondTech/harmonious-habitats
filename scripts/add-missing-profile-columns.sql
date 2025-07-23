-- Migration: Add missing profile columns for UI data elements
-- This adds all fields used in Settings page and Profile page

-- Personal Information fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- Email Preferences (structured as JSONB for flexibility)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_preferences JSONB DEFAULT '{
  "weekly_digest": true,
  "event_reminders": true,
  "new_member_spotlights": false,
  "space_availability": true,
  "tips_resources": false,
  "email_frequency": "realtime"
}'::jsonb;

-- Social Media (structured storage)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '{
  "instagram": null,
  "facebook": null,
  "linkedin": null,
  "twitter": null,
  "sharing_preferences": {
    "auto_share_events": false,
    "share_achievements": false,
    "allow_friend_discovery": true
  }
}'::jsonb;

-- Additional Interests
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS additional_interests TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS involvement_level TEXT CHECK (involvement_level IN ('curious', 'active', 'dedicated'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS other_interests TEXT;

-- Mobile Notifications (structured)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mobile_notifications JSONB DEFAULT '{
  "push_notifications": {
    "event_reminders": true,
    "new_messages": true,
    "event_updates": true,
    "community_announcements": false
  },
  "quiet_hours": {
    "enabled": false,
    "start_time": "22:00",
    "end_time": "08:00"
  },
  "notification_sound": "default"
}'::jsonb;

-- Profile Statistics (computed fields - consider using views instead)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS events_attended_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hours_contributed NUMERIC(10,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS neighbors_met_count INTEGER DEFAULT 0;

-- Activity & Achievements
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS recent_activities JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '{
  "first_event": false,
  "host_event": false,
  "share_space": false,
  "connector": false,
  "regular": false,
  "verified": false
}'::jsonb;

-- Privacy Settings
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'community', 'private'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS share_activity_data BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS analytics_enabled BOOLEAN DEFAULT true;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_zip_code ON profiles(zip_code);
CREATE INDEX IF NOT EXISTS idx_profiles_involvement_level ON profiles(involvement_level);
CREATE INDEX IF NOT EXISTS idx_profiles_profile_visibility ON profiles(profile_visibility);

-- Add comments for documentation
COMMENT ON COLUMN profiles.email_preferences IS 'User email notification preferences';
COMMENT ON COLUMN profiles.social_media IS 'Social media accounts and sharing preferences';
COMMENT ON COLUMN profiles.mobile_notifications IS 'Mobile app push notification settings';
COMMENT ON COLUMN profiles.achievements IS 'User achievements and badges earned';
COMMENT ON COLUMN profiles.profile_visibility IS 'Profile visibility setting: public, community, or private';

-- Create a view for user statistics (better than storing computed values)
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
  p.id,
  p.full_name,
  p.rating,
  p.total_reviews,
  COUNT(DISTINCT ep.event_id) FILTER (WHERE ep.status = 'attended') as events_attended,
  COALESCE(SUM(EXTRACT(EPOCH FROM (e.end_time - e.start_time))/3600), 0) as hours_contributed,
  COUNT(DISTINCT m.sender_id) + COUNT(DISTINCT m.recipient_id) as connections_made
FROM profiles p
LEFT JOIN event_participants ep ON p.id = ep.user_id
LEFT JOIN events e ON ep.event_id = e.id AND ep.status = 'attended'
LEFT JOIN messages m ON p.id = m.sender_id OR p.id = m.recipient_id
GROUP BY p.id, p.full_name, p.rating, p.total_reviews;

-- Grant permissions
GRANT SELECT ON user_statistics TO authenticated;

-- Update RLS policies for new columns
CREATE POLICY "Users can update their own profile extended fields" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Success message
SELECT 'Profile columns migration completed successfully!' as result;