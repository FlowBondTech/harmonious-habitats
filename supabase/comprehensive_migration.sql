-- Comprehensive Database Migration for Harmony Spaces
-- Run this in Supabase SQL Editor to create all missing tables and columns

-- ========================================
-- 1. USER LOCATIONS AND TRACKING
-- ========================================

-- Fix user_locations table (add missing columns)
ALTER TABLE user_locations
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS visit_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_time_spent INTERVAL DEFAULT '00:00:00',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create user_location_visits table
CREATE TABLE IF NOT EXISTS user_location_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES user_locations(id) ON DELETE CASCADE NOT NULL,
  arrived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  departed_at TIMESTAMPTZ,
  duration INTERVAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_location_preferences table
CREATE TABLE IF NOT EXISTS user_location_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  track_gps_enabled BOOLEAN DEFAULT false,
  tracking_frequency INTERVAL DEFAULT '5 minutes',
  auto_detect_hotspots BOOLEAN DEFAULT true,
  hotspot_threshold INTEGER DEFAULT 3,
  class_suggestion_radius NUMERIC DEFAULT 5.0,
  last_gps_update TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 2. EVENT-RELATED TABLES
-- ========================================

-- Create event_participants table
CREATE TABLE IF NOT EXISTS event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('registered', 'attending', 'attended', 'cancelled', 'no_show')) DEFAULT 'registered',
  role TEXT CHECK (role IN ('participant', 'facilitator', 'organizer', 'volunteer')) DEFAULT 'participant',
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  attended_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Create event_reviews table
CREATE TABLE IF NOT EXISTS event_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Create event_feedback table
CREATE TABLE IF NOT EXISTS event_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  content_rating INTEGER CHECK (content_rating >= 1 AND content_rating <= 5),
  facilitator_rating INTEGER CHECK (facilitator_rating >= 1 AND facilitator_rating <= 5),
  venue_rating INTEGER CHECK (venue_rating >= 1 AND venue_rating <= 5),
  what_went_well TEXT,
  what_could_improve TEXT,
  would_recommend BOOLEAN,
  would_attend_again BOOLEAN,
  additional_comments TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Create event_announcements table
CREATE TABLE IF NOT EXISTS event_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  posted_by UUID REFERENCES profiles(id) NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event_categories table
CREATE TABLE IF NOT EXISTS event_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  parent_id UUID REFERENCES event_categories(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event_materials table
CREATE TABLE IF NOT EXISTS event_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 3. NOTIFICATION SYSTEM
-- ========================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'success', 'warning', 'error', 'event_reminder', 'event_update', 'event_cancellation', 'new_event', 'new_message', 'review_request', 'application_update', 'system')) DEFAULT 'info',
  category TEXT,
  related_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  related_space_id UUID REFERENCES spaces(id) ON DELETE SET NULL,
  related_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action_url TEXT,
  action_label TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  expires_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  event_reminders BOOLEAN DEFAULT true,
  event_updates BOOLEAN DEFAULT true,
  event_cancellations BOOLEAN DEFAULT true,
  new_events_nearby BOOLEAN DEFAULT true,
  new_messages BOOLEAN DEFAULT true,
  review_requests BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  digest_frequency TEXT CHECK (digest_frequency IN ('never', 'daily', 'weekly', 'monthly')) DEFAULT 'weekly',
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 4. MESSAGING SYSTEM
-- ========================================

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  subject TEXT,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT false,
  thread_id UUID,
  attachments JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 5. FACILITATOR SYSTEM
-- ========================================

-- Create facilitator_availability table
CREATE TABLE IF NOT EXISTS facilitator_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facilitator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT DEFAULT 'America/New_York',
  is_recurring BOOLEAN DEFAULT true,
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_until DATE,
  max_events_per_day INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create facilitator_availability_overrides table
CREATE TABLE IF NOT EXISTS facilitator_availability_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facilitator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT false,
  start_time TIME,
  end_time TIME,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create facilitator_specialties table
CREATE TABLE IF NOT EXISTS facilitator_specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facilitator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  specialty TEXT NOT NULL,
  years_experience INTEGER,
  certification TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 6. APPLICATION SYSTEM
-- ========================================

-- Create space_applications table
CREATE TABLE IF NOT EXISTS space_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  space_type TEXT NOT NULL,
  space_name TEXT NOT NULL,
  space_description TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  size_sqft INTEGER,
  capacity INTEGER,
  amenities TEXT[],
  availability TEXT,
  pricing_model TEXT,
  motivation TEXT,
  experience TEXT,
  references_text TEXT,
  status TEXT CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'withdrawn')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create holder_applications table
CREATE TABLE IF NOT EXISTS holder_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('space', 'time')) NOT NULL,
  motivation TEXT,
  experience TEXT,
  offerings TEXT,
  availability TEXT,
  references_text TEXT,
  status TEXT CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'withdrawn')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 7. ADMIN TABLES
-- ========================================

-- Create audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create platform_settings table
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  reported_entity_type TEXT CHECK (reported_entity_type IN ('user', 'event', 'space', 'message', 'review')) NOT NULL,
  reported_entity_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')) DEFAULT 'pending',
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 8. INDEXES FOR PERFORMANCE
-- ========================================

-- User locations indexes
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_location_visits_user_location ON user_location_visits(user_id, location_id);

-- Event indexes
CREATE INDEX IF NOT EXISTS idx_event_participants_event ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user ON event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_event_reviews_event ON event_reviews(event_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_event ON event_feedback(event_id);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Message indexes
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);

-- Application indexes
CREATE INDEX IF NOT EXISTS idx_space_applications_user ON space_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_space_applications_status ON space_applications(status);
CREATE INDEX IF NOT EXISTS idx_holder_applications_user ON holder_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_holder_applications_status ON holder_applications(status);

-- Facilitator indexes
CREATE INDEX IF NOT EXISTS idx_facilitator_availability_facilitator ON facilitator_availability(facilitator_id);
CREATE INDEX IF NOT EXISTS idx_facilitator_overrides_date ON facilitator_availability_overrides(facilitator_id, date);

-- ========================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE user_location_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_location_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilitator_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilitator_availability_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE holder_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (users can see their own data)
CREATE POLICY "Users can view own location visits" ON user_location_visits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own location visits" ON user_location_visits FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own preferences" ON user_location_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view event participants" ON event_participants FOR SELECT USING (true);
CREATE POLICY "Users can register for events" ON event_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view event reviews" ON event_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create own reviews" ON event_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view facilitator availability" ON facilitator_availability FOR SELECT USING (true);
CREATE POLICY "Facilitators can manage own availability" ON facilitator_availability FOR ALL USING (auth.uid() = facilitator_id);

CREATE POLICY "Users can view own applications" ON holder_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own applications" ON holder_applications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ========================================
-- 10. TRIGGER FUNCTIONS
-- ========================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_user_locations_updated_at BEFORE UPDATE ON user_locations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_location_preferences_updated_at BEFORE UPDATE ON user_location_preferences
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_participants_updated_at BEFORE UPDATE ON event_participants
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notification_preferences
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facilitator_availability_updated_at BEFORE UPDATE ON facilitator_availability
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 11. SAMPLE DATA FOR CATEGORIES
-- ========================================

-- Insert default event categories if they don't exist
INSERT INTO event_categories (name, slug, description, icon, color) VALUES
  ('Wellness', 'wellness', 'Health and wellness activities', '🧘', '#10b981'),
  ('Arts & Crafts', 'arts-crafts', 'Creative and artistic activities', '🎨', '#8b5cf6'),
  ('Education', 'education', 'Learning and skill development', '📚', '#3b82f6'),
  ('Community', 'community', 'Community building events', '🤝', '#f59e0b'),
  ('Movement', 'movement', 'Physical activities and exercise', '🏃', '#ef4444'),
  ('Food', 'food', 'Cooking and food-related events', '🍳', '#f97316'),
  ('Nature', 'nature', 'Outdoor and nature activities', '🌱', '#22c55e')
ON CONFLICT (slug) DO NOTHING;

-- ========================================
-- COMPLETION MESSAGE
-- ========================================
-- All tables and columns have been created successfully!
-- Your database is now fully synchronized with the application requirements.