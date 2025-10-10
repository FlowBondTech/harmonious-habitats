-- Run this SQL in your Supabase SQL Editor to enable the template feature
-- Go to: https://app.supabase.com/project/YOUR_PROJECT/sql/new

-- ============================================
-- 1. CREATE EVENT TEMPLATES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS event_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL, -- Stores all the event configuration
  category TEXT,
  is_favorite BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_templates_user_id ON event_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_event_templates_category ON event_templates(category);
CREATE INDEX IF NOT EXISTS idx_event_templates_is_favorite ON event_templates(is_favorite);
CREATE INDEX IF NOT EXISTS idx_event_templates_created_at ON event_templates(created_at DESC);

-- Enable RLS
ALTER TABLE event_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (with IF NOT EXISTS handling)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'event_templates'
        AND policyname = 'Users can view their own templates'
    ) THEN
        CREATE POLICY "Users can view their own templates"
          ON event_templates FOR SELECT
          USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'event_templates'
        AND policyname = 'Users can create their own templates'
    ) THEN
        CREATE POLICY "Users can create their own templates"
          ON event_templates FOR INSERT
          WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'event_templates'
        AND policyname = 'Users can update their own templates'
    ) THEN
        CREATE POLICY "Users can update their own templates"
          ON event_templates FOR UPDATE
          USING (auth.uid() = user_id)
          WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'event_templates'
        AND policyname = 'Users can delete their own templates'
    ) THEN
        CREATE POLICY "Users can delete their own templates"
          ON event_templates FOR DELETE
          USING (auth.uid() = user_id);
    END IF;
END $$;

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_event_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_event_templates_updated_at_trigger'
    ) THEN
        CREATE TRIGGER update_event_templates_updated_at_trigger
          BEFORE UPDATE ON event_templates
          FOR EACH ROW
          EXECUTE FUNCTION update_event_templates_updated_at();
    END IF;
END $$;

-- Add column to events table to track which template was used (if any)
ALTER TABLE events ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES event_templates(id) ON DELETE SET NULL;

-- ============================================
-- 2. ADD MISSING COLUMNS TO EVENTS TABLE
-- ============================================

-- Add location_name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = 'location_name'
    ) THEN
        ALTER TABLE events ADD COLUMN location_name TEXT;
    END IF;
END $$;

-- Add address column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = 'address'
    ) THEN
        ALTER TABLE events ADD COLUMN address TEXT;
    END IF;
END $$;

-- Add capacity column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = 'capacity'
    ) THEN
        ALTER TABLE events ADD COLUMN capacity INTEGER CHECK (capacity > 0);
    END IF;
END $$;

-- Add skill_level column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = 'skill_level'
    ) THEN
        ALTER TABLE events ADD COLUMN skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'all'));
    END IF;
END $$;

-- Add is_free column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = 'is_free'
    ) THEN
        ALTER TABLE events ADD COLUMN is_free BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add exchange_type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = 'exchange_type'
    ) THEN
        ALTER TABLE events ADD COLUMN exchange_type TEXT CHECK (exchange_type IN ('donation', 'fixed', 'sliding_scale', 'barter', 'free'));
    END IF;
END $$;

-- Add prerequisite columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = 'prerequisites'
    ) THEN
        ALTER TABLE events ADD COLUMN prerequisites TEXT;
    END IF;
END $$;

-- Add registration columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = 'registration_required'
    ) THEN
        ALTER TABLE events ADD COLUMN registration_required BOOLEAN DEFAULT false;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = 'registration_deadline'
    ) THEN
        ALTER TABLE events ADD COLUMN registration_deadline TIMESTAMPTZ;
    END IF;
END $$;

-- Add virtual event columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = 'virtual_meeting_url'
    ) THEN
        ALTER TABLE events ADD COLUMN virtual_meeting_url TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = 'virtual_platform'
    ) THEN
        ALTER TABLE events ADD COLUMN virtual_platform TEXT;
    END IF;
END $$;

-- ============================================
-- DONE! Your template feature is ready to use
-- ============================================