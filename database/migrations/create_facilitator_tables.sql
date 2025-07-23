-- Create Facilitator Availability Table
CREATE TABLE IF NOT EXISTS public.facilitator_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    facilitator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT false NOT NULL,
    timezone TEXT DEFAULT 'UTC' NOT NULL,
    weekly_schedule JSONB DEFAULT '{}'::jsonb NOT NULL,
    minimum_notice_hours INTEGER DEFAULT 24 NOT NULL,
    maximum_advance_days INTEGER DEFAULT 90 NOT NULL,
    default_event_duration INTEGER DEFAULT 60 NOT NULL,
    pricing JSONB DEFAULT '{}'::jsonb NOT NULL,
    location_preferences JSONB DEFAULT '{}'::jsonb NOT NULL,
    
    UNIQUE(facilitator_id)
);

-- Create Facilitator Specialties Table
CREATE TABLE IF NOT EXISTS public.facilitator_specialties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    facilitator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    specialty TEXT NOT NULL,
    category TEXT NOT NULL,
    experience_years INTEGER DEFAULT 0 NOT NULL,
    
    UNIQUE(facilitator_id, specialty)
);

-- Create Facilitator Availability Overrides Table (for specific date exceptions)
CREATE TABLE IF NOT EXISTS public.facilitator_availability_overrides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    facilitator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    override_date DATE NOT NULL,
    override_type TEXT NOT NULL CHECK (override_type IN ('unavailable', 'available', 'modified')),
    time_slots JSONB DEFAULT '[]'::jsonb NOT NULL,
    reason TEXT,
    
    UNIQUE(facilitator_id, override_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_facilitator_availability_facilitator_id ON public.facilitator_availability(facilitator_id);
CREATE INDEX IF NOT EXISTS idx_facilitator_availability_is_active ON public.facilitator_availability(is_active);

CREATE INDEX IF NOT EXISTS idx_facilitator_specialties_facilitator_id ON public.facilitator_specialties(facilitator_id);
CREATE INDEX IF NOT EXISTS idx_facilitator_specialties_category ON public.facilitator_specialties(category);
CREATE INDEX IF NOT EXISTS idx_facilitator_specialties_specialty ON public.facilitator_specialties(specialty);

CREATE INDEX IF NOT EXISTS idx_facilitator_overrides_facilitator_id ON public.facilitator_availability_overrides(facilitator_id);
CREATE INDEX IF NOT EXISTS idx_facilitator_overrides_date ON public.facilitator_availability_overrides(override_date);

-- Enable Row Level Security (RLS)
ALTER TABLE public.facilitator_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilitator_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilitator_availability_overrides ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for facilitator_availability
CREATE POLICY "Users can view their own facilitator availability" ON public.facilitator_availability
    FOR SELECT USING (auth.uid() = facilitator_id);

CREATE POLICY "Users can insert their own facilitator availability" ON public.facilitator_availability
    FOR INSERT WITH CHECK (auth.uid() = facilitator_id);

CREATE POLICY "Users can update their own facilitator availability" ON public.facilitator_availability
    FOR UPDATE USING (auth.uid() = facilitator_id);

CREATE POLICY "Users can delete their own facilitator availability" ON public.facilitator_availability
    FOR DELETE USING (auth.uid() = facilitator_id);

-- Public can view active facilitator availability for discovery
CREATE POLICY "Public can view active facilitator availability" ON public.facilitator_availability
    FOR SELECT USING (is_active = true);

-- Create RLS policies for facilitator_specialties
CREATE POLICY "Users can view their own facilitator specialties" ON public.facilitator_specialties
    FOR SELECT USING (auth.uid() = facilitator_id);

CREATE POLICY "Users can insert their own facilitator specialties" ON public.facilitator_specialties
    FOR INSERT WITH CHECK (auth.uid() = facilitator_id);

CREATE POLICY "Users can update their own facilitator specialties" ON public.facilitator_specialties
    FOR UPDATE USING (auth.uid() = facilitator_id);

CREATE POLICY "Users can delete their own facilitator specialties" ON public.facilitator_specialties
    FOR DELETE USING (auth.uid() = facilitator_id);

-- Public can view all facilitator specialties for discovery
CREATE POLICY "Public can view facilitator specialties" ON public.facilitator_specialties
    FOR SELECT USING (true);

-- Create RLS policies for facilitator_availability_overrides
CREATE POLICY "Users can manage their own availability overrides" ON public.facilitator_availability_overrides
    FOR ALL USING (auth.uid() = facilitator_id);

-- Public can view availability overrides for active facilitators
CREATE POLICY "Public can view availability overrides" ON public.facilitator_availability_overrides
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.facilitator_availability 
            WHERE facilitator_id = facilitator_availability_overrides.facilitator_id 
            AND is_active = true
        )
    );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for facilitator_availability
CREATE TRIGGER update_facilitator_availability_updated_at 
    BEFORE UPDATE ON public.facilitator_availability 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.facilitator_availability IS 'Stores facilitator availability schedules and preferences';
COMMENT ON TABLE public.facilitator_specialties IS 'Stores facilitator specialties and experience levels';
COMMENT ON TABLE public.facilitator_availability_overrides IS 'Stores specific date overrides for facilitator availability';

COMMENT ON COLUMN public.facilitator_availability.weekly_schedule IS 'JSON object containing weekly availability schedule by day';
COMMENT ON COLUMN public.facilitator_availability.pricing IS 'JSON object containing pricing structure and rates';
COMMENT ON COLUMN public.facilitator_availability.location_preferences IS 'JSON object containing location and travel preferences';