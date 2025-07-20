-- Create facilitator availability table
CREATE TABLE facilitator_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Facilitator info
  facilitator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Availability settings
  is_active BOOLEAN DEFAULT true,
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
  min_advance_notice_hours INTEGER DEFAULT 24,
  max_advance_booking_days INTEGER DEFAULT 30,
  buffer_time_minutes INTEGER DEFAULT 15, -- Buffer between sessions
  
  -- Session preferences
  preferred_session_lengths INTEGER[] DEFAULT ARRAY[60, 90, 120], -- in minutes
  max_sessions_per_day INTEGER DEFAULT 3,
  
  -- Location preferences
  available_for_online BOOLEAN DEFAULT true,
  available_for_in_person BOOLEAN DEFAULT true,
  travel_radius_miles INTEGER DEFAULT 10,
  
  -- Pricing (optional)
  suggested_donation TEXT,
  
  -- Notes
  availability_notes TEXT,
  
  UNIQUE(facilitator_id)
);

-- Create specific date overrides (for exceptions to regular schedule)
CREATE TABLE facilitator_availability_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  facilitator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  override_date DATE NOT NULL,
  
  -- Type of override
  override_type TEXT CHECK (override_type IN ('unavailable', 'available', 'modified')) NOT NULL,
  
  -- If modified, provide time slots
  time_slots JSONB DEFAULT '[]'::jsonb,
  
  -- Reason (optional)
  reason TEXT,
  
  UNIQUE(facilitator_id, override_date)
);

-- Create facilitator booking requests
CREATE TABLE facilitator_booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Parties involved
  facilitator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  space_holder_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE NOT NULL,
  
  -- Request details
  requested_date DATE NOT NULL,
  requested_start_time TIME NOT NULL,
  requested_end_time TIME NOT NULL,
  
  -- Event details
  event_type TEXT NOT NULL,
  event_description TEXT,
  expected_attendance INTEGER,
  
  -- Status
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'completed')) DEFAULT 'pending',
  
  -- Messages
  initial_message TEXT,
  facilitator_response TEXT,
  
  -- Confirmation details
  confirmed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  
  -- Post-event
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Prevent double bookings
  UNIQUE(facilitator_id, requested_date, requested_start_time)
);

-- Create facilitator specialties/tags for easier discovery
CREATE TABLE facilitator_specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facilitator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  specialty TEXT NOT NULL,
  category TEXT NOT NULL,
  experience_years INTEGER DEFAULT 0,
  
  UNIQUE(facilitator_id, specialty)
);

-- Indexes for performance
CREATE INDEX idx_facilitator_availability_active ON facilitator_availability(is_active) WHERE is_active = true;
CREATE INDEX idx_facilitator_availability_facilitator ON facilitator_availability(facilitator_id);
CREATE INDEX idx_booking_requests_facilitator ON facilitator_booking_requests(facilitator_id, status);
CREATE INDEX idx_booking_requests_space_holder ON facilitator_booking_requests(space_holder_id, status);
CREATE INDEX idx_booking_requests_date ON facilitator_booking_requests(requested_date) WHERE status != 'cancelled';
CREATE INDEX idx_facilitator_specialties_specialty ON facilitator_specialties(specialty, category);

-- Add to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_available_facilitator BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS facilitator_bio TEXT,
ADD COLUMN IF NOT EXISTS facilitator_experience_years INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS facilitator_certifications TEXT[],
ADD COLUMN IF NOT EXISTS facilitator_rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS facilitator_total_sessions INTEGER DEFAULT 0;

-- RLS Policies

-- Facilitator availability
ALTER TABLE facilitator_availability ENABLE ROW LEVEL SECURITY;

-- Anyone can view active facilitator availability
CREATE POLICY "Anyone can view active facilitator availability"
  ON facilitator_availability FOR SELECT
  USING (is_active = true);

-- Facilitators can manage their own availability
CREATE POLICY "Facilitators can manage own availability"
  ON facilitator_availability FOR ALL
  USING (facilitator_id = auth.uid());

-- Availability overrides
ALTER TABLE facilitator_availability_overrides ENABLE ROW LEVEL SECURITY;

-- Anyone can view overrides for active facilitators
CREATE POLICY "Anyone can view availability overrides"
  ON facilitator_availability_overrides FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM facilitator_availability fa
      WHERE fa.facilitator_id = facilitator_availability_overrides.facilitator_id
      AND fa.is_active = true
    )
  );

-- Facilitators can manage their own overrides
CREATE POLICY "Facilitators can manage own overrides"
  ON facilitator_availability_overrides FOR ALL
  USING (facilitator_id = auth.uid());

-- Booking requests
ALTER TABLE facilitator_booking_requests ENABLE ROW LEVEL SECURITY;

-- Involved parties can view their booking requests
CREATE POLICY "Involved parties can view booking requests"
  ON facilitator_booking_requests FOR SELECT
  USING (facilitator_id = auth.uid() OR space_holder_id = auth.uid());

-- Space holders can create booking requests
CREATE POLICY "Space holders can create booking requests"
  ON facilitator_booking_requests FOR INSERT
  WITH CHECK (
    space_holder_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM spaces s
      WHERE s.id = space_id AND s.owner_id = auth.uid()
    )
  );

-- Facilitators can update request status
CREATE POLICY "Facilitators can respond to booking requests"
  ON facilitator_booking_requests FOR UPDATE
  USING (facilitator_id = auth.uid())
  WITH CHECK (facilitator_id = auth.uid());

-- Space holders can cancel their requests
CREATE POLICY "Space holders can cancel their requests"
  ON facilitator_booking_requests FOR UPDATE
  USING (space_holder_id = auth.uid() AND status = 'pending')
  WITH CHECK (space_holder_id = auth.uid() AND status = 'cancelled');

-- Facilitator specialties
ALTER TABLE facilitator_specialties ENABLE ROW LEVEL SECURITY;

-- Anyone can view facilitator specialties
CREATE POLICY "Anyone can view facilitator specialties"
  ON facilitator_specialties FOR SELECT
  USING (true);

-- Facilitators can manage their own specialties
CREATE POLICY "Facilitators can manage own specialties"
  ON facilitator_specialties FOR ALL
  USING (facilitator_id = auth.uid());

-- Function to check facilitator availability
CREATE OR REPLACE FUNCTION is_facilitator_available(
  p_facilitator_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME
) RETURNS BOOLEAN AS $$
DECLARE
  v_day_of_week TEXT;
  v_weekly_schedule JSONB;
  v_is_available BOOLEAN := false;
  v_has_override BOOLEAN := false;
  v_override_type TEXT;
  v_time_slots JSONB;
BEGIN
  -- Get day of week
  v_day_of_week := LOWER(TO_CHAR(p_date, 'Day'));
  v_day_of_week := RTRIM(v_day_of_week);
  
  -- Check for date override first
  SELECT override_type, time_slots 
  INTO v_override_type, v_time_slots
  FROM facilitator_availability_overrides
  WHERE facilitator_id = p_facilitator_id
    AND override_date = p_date;
  
  IF FOUND THEN
    v_has_override := true;
    
    IF v_override_type = 'unavailable' THEN
      RETURN false;
    ELSIF v_override_type = 'available' THEN
      -- Check if requested time falls within available slots
      -- This is simplified - you'd want more complex logic here
      RETURN true;
    END IF;
  END IF;
  
  -- If no override, check regular schedule
  IF NOT v_has_override THEN
    SELECT weekly_schedule INTO v_weekly_schedule
    FROM facilitator_availability
    WHERE facilitator_id = p_facilitator_id
      AND is_active = true;
    
    IF FOUND AND v_weekly_schedule ? v_day_of_week THEN
      -- Check if time falls within available slots
      -- This is simplified - you'd want more complex logic here
      IF jsonb_array_length(v_weekly_schedule->v_day_of_week) > 0 THEN
        v_is_available := true;
      END IF;
    END IF;
  END IF;
  
  -- Check for existing bookings
  IF v_is_available THEN
    SELECT EXISTS (
      SELECT 1 FROM facilitator_booking_requests
      WHERE facilitator_id = p_facilitator_id
        AND requested_date = p_date
        AND status IN ('accepted', 'pending')
        AND (
          (requested_start_time <= p_start_time AND requested_end_time > p_start_time) OR
          (requested_start_time < p_end_time AND requested_end_time >= p_end_time) OR
          (requested_start_time >= p_start_time AND requested_end_time <= p_end_time)
        )
    ) INTO v_is_available;
    
    v_is_available := NOT v_is_available;
  END IF;
  
  RETURN v_is_available;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update facilitator profile when they set availability
CREATE OR REPLACE FUNCTION update_facilitator_profile_on_availability()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET is_available_facilitator = NEW.is_active
  WHERE id = NEW.facilitator_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_facilitator_profile_trigger
AFTER INSERT OR UPDATE ON facilitator_availability
FOR EACH ROW
EXECUTE FUNCTION update_facilitator_profile_on_availability();

-- Comments for documentation
COMMENT ON TABLE facilitator_availability IS 'Stores facilitator availability schedules and preferences';
COMMENT ON TABLE facilitator_availability_overrides IS 'Date-specific overrides to regular facilitator schedules';
COMMENT ON TABLE facilitator_booking_requests IS 'Booking requests from space holders to facilitators';
COMMENT ON TABLE facilitator_specialties IS 'Facilitator areas of expertise for discovery';