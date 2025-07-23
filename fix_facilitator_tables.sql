-- Fix Facilitator Tables (Run this in Supabase SQL Editor)
-- This script ensures the facilitator tables exist and are properly configured

-- First, let's check if the tables exist and create them if they don't
DO $$
BEGIN
    -- Create facilitator_availability table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'facilitator_availability') THEN
        CREATE TABLE facilitator_availability (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            
            -- Facilitator info (reference auth.users instead of profiles)
            facilitator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            
            -- Availability settings
            is_active BOOLEAN DEFAULT false,
            timezone TEXT DEFAULT 'America/New_York',
            
            -- Weekly recurring availability (JSON array of time slots per day)
            weekly_schedule JSONB DEFAULT '{
                "monday": [],
                "tuesday": [],
                "wednesday": [],
                "thursday": [],
                "friday": [],
                "saturday": [],
                "sunday": []
            }'::jsonb,
            
            -- Booking preferences
            minimum_notice_hours INTEGER DEFAULT 24,
            maximum_advance_days INTEGER DEFAULT 30,
            default_event_duration INTEGER DEFAULT 60,
            
            -- Pricing and location preferences
            pricing JSONB DEFAULT '{}'::jsonb,
            location_preferences JSONB DEFAULT '{}'::jsonb,
            
            UNIQUE(facilitator_id)
        );
        
        RAISE NOTICE 'Created facilitator_availability table';
    ELSE
        RAISE NOTICE 'facilitator_availability table already exists';
    END IF;

    -- Create facilitator_specialties table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'facilitator_specialties') THEN
        CREATE TABLE facilitator_specialties (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            facilitator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            specialty TEXT NOT NULL,
            category TEXT NOT NULL,
            experience_years INTEGER DEFAULT 0,
            
            UNIQUE(facilitator_id, specialty)
        );
        
        RAISE NOTICE 'Created facilitator_specialties table';
    ELSE
        RAISE NOTICE 'facilitator_specialties table already exists';
    END IF;

    -- Create facilitator_availability_overrides table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'facilitator_availability_overrides') THEN
        CREATE TABLE facilitator_availability_overrides (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            facilitator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            override_date DATE NOT NULL,
            override_type TEXT CHECK (override_type IN ('unavailable', 'available', 'modified')) NOT NULL,
            time_slots JSONB DEFAULT '[]'::jsonb,
            reason TEXT,
            
            UNIQUE(facilitator_id, override_date)
        );
        
        RAISE NOTICE 'Created facilitator_availability_overrides table';
    ELSE
        RAISE NOTICE 'facilitator_availability_overrides table already exists';
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_facilitator_availability_facilitator_id ON facilitator_availability(facilitator_id);
CREATE INDEX IF NOT EXISTS idx_facilitator_availability_is_active ON facilitator_availability(is_active);
CREATE INDEX IF NOT EXISTS idx_facilitator_specialties_facilitator_id ON facilitator_specialties(facilitator_id);
CREATE INDEX IF NOT EXISTS idx_facilitator_specialties_category ON facilitator_specialties(category);
CREATE INDEX IF NOT EXISTS idx_facilitator_overrides_facilitator_id ON facilitator_availability_overrides(facilitator_id);
CREATE INDEX IF NOT EXISTS idx_facilitator_overrides_date ON facilitator_availability_overrides(override_date);

-- Enable Row Level Security
ALTER TABLE facilitator_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilitator_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilitator_availability_overrides ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
    -- Facilitator Availability Policies
    DROP POLICY IF EXISTS "Users can view their own facilitator availability" ON facilitator_availability;
    DROP POLICY IF EXISTS "Users can insert their own facilitator availability" ON facilitator_availability;
    DROP POLICY IF EXISTS "Users can update their own facilitator availability" ON facilitator_availability;
    DROP POLICY IF EXISTS "Users can delete their own facilitator availability" ON facilitator_availability;
    DROP POLICY IF EXISTS "Public can view active facilitator availability" ON facilitator_availability;
    DROP POLICY IF EXISTS "Facilitators can manage own availability" ON facilitator_availability;
    DROP POLICY IF EXISTS "Anyone can view active facilitator availability" ON facilitator_availability;

    CREATE POLICY "Users can manage their own facilitator availability" ON facilitator_availability
        FOR ALL USING (auth.uid() = facilitator_id);

    CREATE POLICY "Public can view active facilitator availability" ON facilitator_availability
        FOR SELECT USING (is_active = true);

    -- Facilitator Specialties Policies
    DROP POLICY IF EXISTS "Users can view their own facilitator specialties" ON facilitator_specialties;
    DROP POLICY IF EXISTS "Users can insert their own facilitator specialties" ON facilitator_specialties;
    DROP POLICY IF EXISTS "Users can update their own facilitator specialties" ON facilitator_specialties;
    DROP POLICY IF EXISTS "Users can delete their own facilitator specialties" ON facilitator_specialties;
    DROP POLICY IF EXISTS "Public can view facilitator specialties" ON facilitator_specialties;
    DROP POLICY IF EXISTS "Facilitators can manage own specialties" ON facilitator_specialties;
    DROP POLICY IF EXISTS "Anyone can view facilitator specialties" ON facilitator_specialties;

    CREATE POLICY "Users can manage their own facilitator specialties" ON facilitator_specialties
        FOR ALL USING (auth.uid() = facilitator_id);

    CREATE POLICY "Public can view facilitator specialties" ON facilitator_specialties
        FOR SELECT USING (true);

    -- Facilitator Availability Overrides Policies
    DROP POLICY IF EXISTS "Users can manage their own availability overrides" ON facilitator_availability_overrides;
    DROP POLICY IF EXISTS "Public can view availability overrides" ON facilitator_availability_overrides;
    DROP POLICY IF EXISTS "Facilitators can manage own overrides" ON facilitator_availability_overrides;
    DROP POLICY IF EXISTS "Anyone can view availability overrides" ON facilitator_availability_overrides;

    CREATE POLICY "Users can manage their own availability overrides" ON facilitator_availability_overrides
        FOR ALL USING (auth.uid() = facilitator_id);

    CREATE POLICY "Public can view availability overrides" ON facilitator_availability_overrides
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM facilitator_availability 
                WHERE facilitator_id = facilitator_availability_overrides.facilitator_id 
                AND is_active = true
            )
        );

    RAISE NOTICE 'RLS policies created successfully';
END $$;

-- Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for facilitator_availability
DROP TRIGGER IF EXISTS update_facilitator_availability_updated_at ON facilitator_availability;
CREATE TRIGGER update_facilitator_availability_updated_at 
    BEFORE UPDATE ON facilitator_availability 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON facilitator_availability TO authenticated;
GRANT ALL ON facilitator_specialties TO authenticated;
GRANT ALL ON facilitator_availability_overrides TO authenticated;
GRANT SELECT ON facilitator_availability TO anon;
GRANT SELECT ON facilitator_specialties TO anon;
GRANT SELECT ON facilitator_availability_overrides TO anon;

-- Add comments
COMMENT ON TABLE facilitator_availability IS 'Stores facilitator availability schedules and preferences';
COMMENT ON TABLE facilitator_specialties IS 'Stores facilitator specialties and experience levels';
COMMENT ON TABLE facilitator_availability_overrides IS 'Stores date-specific overrides for facilitator availability';

SELECT 'Facilitator tables setup completed successfully!' as result;