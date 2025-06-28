/*
  # Sample Data and Reference Tables

  1. Reference Tables
    - Create reference tables for amenities and accessibility features
    - These help with consistent data entry and UI dropdowns

  2. Platform Settings
    - Set up default platform configuration
    - Welcome messages and system defaults

  3. Sample Data
    - Sample data will be created when users actually sign up and create content
    - This avoids foreign key constraint issues

  Note: Events, spaces, and user-specific data will be created naturally as users interact with the platform.
  The first user to sign up will automatically become an admin via the trigger function.
*/

-- Create reference tables for amenities and accessibility features
CREATE TABLE IF NOT EXISTS reference_amenities (
  name TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reference_accessibility (
  name TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert reference amenities
INSERT INTO reference_amenities (name, category, description) VALUES 
  ('Kitchen access', 'facilities', 'Full kitchen available for cooking events'),
  ('Bathroom access', 'facilities', 'Clean bathroom facilities available'),
  ('Parking available', 'accessibility', 'On-site parking spaces'),
  ('Public transit nearby', 'accessibility', 'Within walking distance of public transit'),
  ('Sound system', 'equipment', 'Audio equipment for music and presentations'),
  ('Projector/screen', 'equipment', 'Visual presentation equipment'),
  ('Tables and chairs', 'furniture', 'Seating and table arrangements'),
  ('Yoga mats available', 'equipment', 'Yoga mats provided for participants'),
  ('Garden tools', 'equipment', 'Gardening tools and equipment'),
  ('Art supplies', 'equipment', 'Basic art and craft supplies'),
  ('Cooking equipment', 'equipment', 'Pots, pans, and cooking utensils'),
  ('Musical instruments', 'equipment', 'Various musical instruments available'),
  ('Meditation cushions', 'equipment', 'Comfortable cushions for meditation'),
  ('Whiteboard/flipchart', 'equipment', 'Writing surfaces for workshops'),
  ('WiFi available', 'facilities', 'Reliable internet connection'),
  ('Climate controlled', 'facilities', 'Heating and air conditioning'),
  ('Natural lighting', 'facilities', 'Good natural light from windows'),
  ('Outdoor space', 'facilities', 'Access to outdoor area or garden'),
  ('Storage space', 'facilities', 'Space to store materials and equipment'),
  ('Cleaning supplies', 'facilities', 'Basic cleaning materials available')
ON CONFLICT (name) DO NOTHING;

-- Insert reference accessibility features
INSERT INTO reference_accessibility (name, category, description) VALUES 
  ('Wheelchair accessible', 'mobility', 'Fully wheelchair accessible entrance and space'),
  ('Ground floor access', 'mobility', 'No stairs required to access space'),
  ('Accessible parking', 'mobility', 'Designated accessible parking spaces'),
  ('Accessible bathroom', 'mobility', 'ADA compliant bathroom facilities'),
  ('Well-lit pathways', 'safety', 'Good lighting for evening events'),
  ('Minimal steps', 'mobility', 'Few or no steps to navigate'),
  ('Wide doorways', 'mobility', 'Doorways accommodate wheelchairs and mobility aids'),
  ('Elevator access', 'mobility', 'Elevator available for upper floors'),
  ('Accessible seating', 'mobility', 'Seating options for people with mobility needs'),
  ('Visual aids friendly', 'sensory', 'Good for people with hearing impairments'),
  ('Audio aids friendly', 'sensory', 'Good for people with visual impairments'),
  ('Quiet environment', 'sensory', 'Low noise environment suitable for sensitive individuals'),
  ('Service animal friendly', 'general', 'Welcomes service animals'),
  ('Scent-free environment', 'sensory', 'Fragrance-free space for chemical sensitivities')
ON CONFLICT (name) DO NOTHING;

-- Set up default platform settings
INSERT INTO platform_settings (key, value, description) VALUES 
  ('welcome_message', '"Welcome to Harmony Spaces! Connect with your neighbors through holistic community events and shared spaces."'::jsonb, 'Welcome message displayed to new users'),
  ('featured_categories', '["Gardening & Sustainability", "Yoga & Meditation", "Cooking & Nutrition", "Art & Creativity", "Healing & Wellness", "Music & Movement"]'::jsonb, 'Featured event categories shown on homepage'),
  ('max_event_capacity', '100'::jsonb, 'Default maximum capacity for events'),
  ('default_discovery_radius', '1'::jsonb, 'Default discovery radius in miles for new users'),
  ('auto_approve_events', 'false'::jsonb, 'Whether events are automatically approved'),
  ('auto_approve_spaces', 'false'::jsonb, 'Whether shared spaces are automatically approved'),
  ('require_verification', 'true'::jsonb, 'Whether users need verification for hosting'),
  ('max_images_per_event', '5'::jsonb, 'Maximum number of images per event'),
  ('max_images_per_space', '10'::jsonb, 'Maximum number of images per space'),
  ('community_guidelines_url', '"/guidelines"'::jsonb, 'URL to community guidelines page'),
  ('support_email', '"support@harmonyspaces.com"'::jsonb, 'Support contact email'),
  ('platform_fee_percentage', '0'::jsonb, 'Platform fee percentage (0 = free)'),
  ('enable_donations', 'true'::jsonb, 'Whether donation features are enabled'),
  ('enable_global_events', 'true'::jsonb, 'Whether global events are enabled'),
  ('enable_virtual_events', 'true'::jsonb, 'Whether virtual events are enabled'),
  ('max_booking_advance_days', '90'::jsonb, 'Maximum days in advance for bookings'),
  ('min_booking_notice_hours', '24'::jsonb, 'Minimum hours notice required for bookings'),
  ('default_event_duration_hours', '2'::jsonb, 'Default event duration in hours'),
  ('enable_reviews', 'true'::jsonb, 'Whether review system is enabled'),
  ('enable_messaging', 'true'::jsonb, 'Whether messaging system is enabled'),
  ('enable_notifications', 'true'::jsonb, 'Whether notification system is enabled')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();

-- Create a function to generate sample events for testing (can be called manually)
CREATE OR REPLACE FUNCTION generate_sample_events(user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Only insert if no events exist yet
  IF NOT EXISTS (SELECT 1 FROM events LIMIT 1) THEN
    INSERT INTO events (
      organizer_id,
      title,
      description,
      category,
      event_type,
      date,
      start_time,
      end_time,
      location_name,
      address,
      capacity,
      skill_level,
      donation_suggested,
      image_url,
      verified,
      materials_needed,
      status
    ) VALUES 
      (
        user_id,
        'Community Garden Workday',
        'Join us for a morning of tending to our community garden. We''ll be planting winter vegetables and preparing beds for spring.',
        'Gardening',
        'local',
        CURRENT_DATE + INTERVAL '1 day',
        '09:00:00',
        '12:00:00',
        'Maple Street Community Garden',
        '123 Maple Street',
        12,
        'beginner',
        'Free',
        'https://images.pexels.com/photos/4503273/pexels-photo-4503273.jpeg?auto=compress&cs=tinysrgb&w=400',
        true,
        ARRAY['Garden gloves', 'Water bottle', 'Sun hat'],
        'active'
      ),
      (
        user_id,
        'Virtual Sound Healing Circle',
        'A global virtual sound healing session using crystal bowls, gongs, and nature sounds. Join from anywhere in the world.',
        'Healing',
        'virtual',
        CURRENT_DATE + INTERVAL '2 days',
        '19:00:00',
        '20:30:00',
        'Online Global Session',
        NULL,
        200,
        'all',
        'Pay what you can',
        'https://images.pexels.com/photos/3822647/pexels-photo-3822647.jpeg?auto=compress&cs=tinysrgb&w=400',
        true,
        ARRAY['Comfortable space to lie down', 'Headphones (optional)', 'Blanket'],
        'active'
      ),
      (
        user_id,
        'International Fermentation Exchange',
        'A global physical event happening simultaneously in multiple cities. Learn traditional fermentation techniques from around the world.',
        'Cooking',
        'global_physical',
        CURRENT_DATE + INTERVAL '5 days',
        '10:00:00',
        '14:00:00',
        'Multiple Cities Worldwide',
        'Various locations - check local coordinator',
        150,
        'intermediate',
        '$15-25',
        'https://images.pexels.com/photos/4057663/pexels-photo-4057663.jpeg?auto=compress&cs=tinysrgb&w=400',
        true,
        ARRAY['Glass jars', 'Vegetables for fermenting', 'Salt'],
        'active'
      );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a function to generate sample spaces for testing (can be called manually)
CREATE OR REPLACE FUNCTION generate_sample_spaces(user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Only insert if no spaces exist yet
  IF NOT EXISTS (SELECT 1 FROM spaces LIMIT 1) THEN
    INSERT INTO spaces (
      owner_id,
      name,
      type,
      description,
      address,
      capacity,
      max_radius,
      list_publicly,
      guidelines,
      donation_suggested,
      image_urls,
      verified,
      status
    ) VALUES 
      (
        user_id,
        'Riverside Garden Studio',
        'backyard',
        'A peaceful backyard space with mature fruit trees, herb garden, and covered pavilion. Perfect for yoga, meditation, and small workshops.',
        '456 River Road',
        15,
        2.0,
        false,
        'Please remove shoes before entering covered areas. Respect the plants and wildlife. Clean up after use.',
        '$10 per event',
        ARRAY['https://images.pexels.com/photos/8633077/pexels-photo-8633077.jpeg?auto=compress&cs=tinysrgb&w=400'],
        true,
        'available'
      ),
      (
        user_id,
        'Community Art Space',
        'garage',
        'Converted garage studio with natural lighting, art supplies, and flexible workspace. Great for creative workshops and art circles.',
        '789 Creative Lane',
        20,
        1.5,
        true,
        'Art supplies available for use. Please clean brushes and tools after use. No food or drinks near artwork.',
        'Utilities contribution appreciated',
        ARRAY['https://images.pexels.com/photos/3778876/pexels-photo-3778876.jpeg?auto=compress&cs=tinysrgb&w=400'],
        false,
        'pending_approval'
      );

    -- Add sample amenities for the spaces
    INSERT INTO space_amenities (space_id, amenity)
    SELECT s.id, amenity
    FROM spaces s, unnest(ARRAY['Kitchen access', 'Bathroom access', 'Parking available', 'Garden tools']) AS amenity
    WHERE s.owner_id = user_id;

    -- Add sample accessibility features
    INSERT INTO space_accessibility_features (space_id, feature)
    SELECT s.id, feature
    FROM spaces s, unnest(ARRAY['Ground floor access', 'Well-lit pathways']) AS feature
    WHERE s.owner_id = user_id;

    -- Add sample holistic categories
    INSERT INTO space_holistic_categories (space_id, category)
    SELECT s.id, category
    FROM spaces s, unnest(ARRAY['Gardening', 'Yoga', 'Art']) AS category
    WHERE s.owner_id = user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance on reference tables
CREATE INDEX IF NOT EXISTS idx_reference_amenities_category ON reference_amenities(category);
CREATE INDEX IF NOT EXISTS idx_reference_accessibility_category ON reference_accessibility(category);

-- Add helpful comments
COMMENT ON TABLE reference_amenities IS 'Reference list of available amenities for spaces';
COMMENT ON TABLE reference_accessibility IS 'Reference list of accessibility features for spaces';
COMMENT ON FUNCTION generate_sample_events(UUID) IS 'Generate sample events for testing - call manually with a valid user ID';
COMMENT ON FUNCTION generate_sample_spaces(UUID) IS 'Generate sample spaces for testing - call manually with a valid user ID';