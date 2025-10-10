-- Run this SQL to add missing columns to the events table
-- This is a safer migration that only adds columns that don't exist

-- ============================================
-- ADD MISSING COLUMNS TO EVENTS TABLE ONLY
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

-- Add template_id column to link events to templates (if used)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = 'template_id'
    ) THEN
        ALTER TABLE events ADD COLUMN template_id UUID REFERENCES event_templates(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================
-- DONE! Your events table now has all the necessary columns
-- ============================================