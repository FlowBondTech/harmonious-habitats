/*
  # Complete Harmony Spaces Database Schema

  1. Core Tables
    - profiles (user management)
    - roles and user_roles (admin system)
    - events (all event types including global)
    - spaces (with public listing support)
    - messaging system
    - reviews and ratings
    - notifications
    - reports and moderation
    - audit logs

  2. Security
    - Enable RLS on all tables
    - Admin-specific policies
    - User data protection policies

  3. Admin Setup
    - Automatic admin role assignment for first user
    - Admin dashboard access controls
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USER MANAGEMENT
-- =============================================

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES 
  ('admin', 'Platform administrator with full access'),
  ('moderator', 'Community moderator with limited admin access'),
  ('user', 'Regular community member')
ON CONFLICT (name) DO NOTHING;

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  neighborhood TEXT,
  rating NUMERIC(3,2) DEFAULT 0.0,
  total_reviews INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  discovery_radius NUMERIC DEFAULT 1.0,
  holistic_interests TEXT[] DEFAULT '{}',
  notification_preferences JSONB DEFAULT '{"newEvents": true, "messages": true, "reminders": true, "community": false}'::jsonb
);

-- User roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id),
  PRIMARY KEY (user_id, role_id)
);

-- =============================================
-- 2. EVENT MANAGEMENT
-- =============================================

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  event_type TEXT DEFAULT 'local' CHECK (event_type IN ('local', 'virtual', 'global_physical')),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location_name TEXT,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  capacity INTEGER NOT NULL DEFAULT 1,
  skill_level TEXT DEFAULT 'beginner' CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'all')),
  donation_suggested TEXT,
  image_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT,
  materials_needed TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed', 'pending_approval')),
  distance_description TEXT,
  admin_notes TEXT
);

CREATE TABLE IF NOT EXISTS event_participants (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'waitlist', 'cancelled')),
  PRIMARY KEY (event_id, user_id)
);

CREATE TABLE IF NOT EXISTS event_favorites (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  favorited_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

CREATE TABLE IF NOT EXISTS event_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating NUMERIC(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS event_waitlist (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'promoted', 'expired')),
  PRIMARY KEY (event_id, user_id)
);

-- =============================================
-- 3. SPACE MANAGEMENT
-- =============================================

CREATE TABLE IF NOT EXISTS spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  capacity INTEGER NOT NULL DEFAULT 1,
  max_radius NUMERIC DEFAULT 2.0,
  list_publicly BOOLEAN DEFAULT FALSE,
  guidelines TEXT,
  donation_suggested TEXT,
  image_urls TEXT[] DEFAULT '{}',
  verified BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'unavailable', 'pending_approval', 'suspended')),
  admin_notes TEXT
);

CREATE TABLE IF NOT EXISTS space_amenities (
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  amenity TEXT NOT NULL,
  PRIMARY KEY (space_id, amenity)
);

CREATE TABLE IF NOT EXISTS space_accessibility_features (
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  PRIMARY KEY (space_id, feature)
);

CREATE TABLE IF NOT EXISTS space_holistic_categories (
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  PRIMARY KEY (space_id, category)
);

CREATE TABLE IF NOT EXISTS space_availability (
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  is_available BOOLEAN DEFAULT FALSE,
  available_times JSONB DEFAULT '[]'::jsonb,
  PRIMARY KEY (space_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS space_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS space_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating NUMERIC(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(space_id, user_id)
);

-- =============================================
-- 4. MESSAGING SYSTEM
-- =============================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group', 'event', 'space')),
  name TEXT,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  space_id UUID REFERENCES spaces(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_message_id UUID,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'system')),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- =============================================
-- 5. NOTIFICATIONS & REPORTS
-- =============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('event', 'space', 'user', 'message')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  admin_notes TEXT
);

-- =============================================
-- 6. AUDIT & SYSTEM
-- =============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_id UUID,
  old_value JSONB,
  new_value JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

-- Insert default platform settings
INSERT INTO platform_settings (key, value, description) VALUES 
  ('auto_approve_events', 'false', 'Automatically approve new events'),
  ('auto_approve_spaces', 'false', 'Automatically approve new spaces'),
  ('max_discovery_radius', '5', 'Maximum discovery radius in miles'),
  ('require_verification', 'true', 'Require email verification for new users'),
  ('enable_public_registration', 'true', 'Allow public user registration')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- 7. ENABLE ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_accessibility_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_holistic_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 8. SECURITY POLICIES
-- =============================================

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_id AND r.name = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON profiles FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

-- User roles policies
CREATE POLICY "Users can view their own roles" ON user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all roles" ON user_roles FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage roles" ON user_roles FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Events policies
CREATE POLICY "Anyone can view active events" ON events FOR SELECT TO authenticated USING (status = 'active' OR organizer_id = auth.uid() OR is_admin(auth.uid()));
CREATE POLICY "Users can create events" ON events FOR INSERT TO authenticated WITH CHECK (organizer_id = auth.uid());
CREATE POLICY "Users can update own events" ON events FOR UPDATE TO authenticated USING (organizer_id = auth.uid());
CREATE POLICY "Admins can update any event" ON events FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

-- Event participants policies
CREATE POLICY "Users can view event participants" ON event_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join events" ON event_participants FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can leave events" ON event_participants FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Event favorites policies
CREATE POLICY "Users can view own favorites" ON event_favorites FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can manage own favorites" ON event_favorites FOR ALL TO authenticated USING (user_id = auth.uid());

-- Spaces policies
CREATE POLICY "Users can view available spaces" ON spaces FOR SELECT TO authenticated USING (status = 'available' OR owner_id = auth.uid() OR is_admin(auth.uid()));
CREATE POLICY "Users can create spaces" ON spaces FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Users can update own spaces" ON spaces FOR UPDATE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Admins can update any space" ON spaces FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

-- Space amenities policies
CREATE POLICY "Users can view space amenities" ON space_amenities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Space owners can manage amenities" ON space_amenities FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM spaces WHERE id = space_id AND owner_id = auth.uid())
);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Reports policies
CREATE POLICY "Users can create reports" ON reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Users can view own reports" ON reports FOR SELECT TO authenticated USING (reporter_id = auth.uid());
CREATE POLICY "Admins can view all reports" ON reports FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can update reports" ON reports FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

-- Audit logs policies
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- Platform settings policies
CREATE POLICY "Anyone can view settings" ON platform_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can update settings" ON platform_settings FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- =============================================
-- 9. FUNCTIONS & TRIGGERS
-- =============================================

-- Function to automatically assign admin role to first user
CREATE OR REPLACE FUNCTION assign_admin_to_first_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the first user
  IF (SELECT COUNT(*) FROM profiles) = 1 THEN
    -- Assign admin role
    INSERT INTO user_roles (user_id, role_id)
    SELECT NEW.id, r.id
    FROM roles r
    WHERE r.name = 'admin';
  ELSE
    -- Assign regular user role
    INSERT INTO user_roles (user_id, role_id)
    SELECT NEW.id, r.id
    FROM roles r
    WHERE r.name = 'user';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to assign roles on profile creation
CREATE OR REPLACE TRIGGER assign_user_role_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_admin_to_first_user();

-- Function to update profile rating
CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating NUMERIC;
  review_count INTEGER;
BEGIN
  -- Calculate average rating from event and space reviews
  SELECT 
    COALESCE(AVG(rating), 0),
    COUNT(*)
  INTO avg_rating, review_count
  FROM (
    SELECT rating FROM event_reviews er
    JOIN events e ON er.event_id = e.id
    WHERE e.organizer_id = COALESCE(NEW.user_id, OLD.user_id)
    
    UNION ALL
    
    SELECT rating FROM space_reviews sr
    JOIN spaces s ON sr.space_id = s.id
    WHERE s.owner_id = COALESCE(NEW.user_id, OLD.user_id)
  ) combined_reviews;
  
  -- Update profile
  UPDATE profiles 
  SET 
    rating = avg_rating,
    total_reviews = review_count
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for rating updates
CREATE OR REPLACE TRIGGER update_rating_on_event_review
  AFTER INSERT OR UPDATE OR DELETE ON event_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_rating();

CREATE OR REPLACE TRIGGER update_rating_on_space_review
  AFTER INSERT OR UPDATE OR DELETE ON space_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_rating();

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, target_table, target_id, old_value, new_value)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to important tables
CREATE OR REPLACE TRIGGER audit_events_trigger
  AFTER INSERT OR UPDATE OR DELETE ON events
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log();

CREATE OR REPLACE TRIGGER audit_spaces_trigger
  AFTER INSERT OR UPDATE OR DELETE ON spaces
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log();

CREATE OR REPLACE TRIGGER audit_user_roles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log();

-- =============================================
-- 10. INDEXES FOR PERFORMANCE
-- =============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_neighborhood ON profiles(neighborhood);
CREATE INDEX IF NOT EXISTS idx_profiles_rating ON profiles(rating DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON profiles(verified);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_location ON events(latitude, longitude);

-- Spaces indexes
CREATE INDEX IF NOT EXISTS idx_spaces_owner ON spaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_spaces_type ON spaces(type);
CREATE INDEX IF NOT EXISTS idx_spaces_status ON spaces(status);
CREATE INDEX IF NOT EXISTS idx_spaces_public ON spaces(list_publicly);
CREATE INDEX IF NOT EXISTS idx_spaces_location ON spaces(latitude, longitude);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Reports indexes
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(target_table);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);