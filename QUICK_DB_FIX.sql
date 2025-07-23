-- QUICK DATABASE FIX - Copy this into Supabase SQL Editor

-- Create facilitator_availability table
CREATE TABLE IF NOT EXISTS public.facilitator_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    facilitator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    is_active BOOLEAN DEFAULT false NOT NULL,
    timezone TEXT DEFAULT 'America/New_York',
    weekly_schedule JSONB DEFAULT '{"monday":[],"tuesday":[],"wednesday":[],"thursday":[],"friday":[],"saturday":[],"sunday":[]}'::jsonb,
    minimum_notice_hours INTEGER DEFAULT 24,
    maximum_advance_days INTEGER DEFAULT 90,
    default_event_duration INTEGER DEFAULT 60,
    pricing JSONB DEFAULT '{}'::jsonb,
    location_preferences JSONB DEFAULT '{}'::jsonb,
    UNIQUE(facilitator_id)
);

-- Create facilitator_specialties table
CREATE TABLE IF NOT EXISTS public.facilitator_specialties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    facilitator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    specialty TEXT NOT NULL,
    category TEXT NOT NULL,
    experience_years INTEGER DEFAULT 0,
    UNIQUE(facilitator_id, specialty)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_facilitator_availability_facilitator_id ON public.facilitator_availability(facilitator_id);
CREATE INDEX IF NOT EXISTS idx_facilitator_availability_is_active ON public.facilitator_availability(is_active);
CREATE INDEX IF NOT EXISTS idx_facilitator_specialties_facilitator_id ON public.facilitator_specialties(facilitator_id);
CREATE INDEX IF NOT EXISTS idx_facilitator_specialties_category ON public.facilitator_specialties(category);

-- Enable Row Level Security
ALTER TABLE public.facilitator_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilitator_specialties ENABLE ROW LEVEL SECURITY;

-- Create security policies
DROP POLICY IF EXISTS "Users can manage their own facilitator availability" ON public.facilitator_availability;
CREATE POLICY "Users can manage their own facilitator availability" ON public.facilitator_availability
    FOR ALL USING (auth.uid() = facilitator_id);

DROP POLICY IF EXISTS "Public can view active facilitator availability" ON public.facilitator_availability;
CREATE POLICY "Public can view active facilitator availability" ON public.facilitator_availability
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Users can manage their own facilitator specialties" ON public.facilitator_specialties;
CREATE POLICY "Users can manage their own facilitator specialties" ON public.facilitator_specialties
    FOR ALL USING (auth.uid() = facilitator_id);

DROP POLICY IF EXISTS "Public can view facilitator specialties" ON public.facilitator_specialties;
CREATE POLICY "Public can view facilitator specialties" ON public.facilitator_specialties
    FOR SELECT USING (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.facilitator_availability TO authenticated;
GRANT ALL ON public.facilitator_specialties TO authenticated;
GRANT SELECT ON public.facilitator_availability TO anon;
GRANT SELECT ON public.facilitator_specialties TO anon;

SELECT 'Facilitator tables created successfully!' as result;