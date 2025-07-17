-- Add booking system tables to support space reservations

-- Create space_bookings table
CREATE TABLE space_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'rejected')) DEFAULT 'pending',
  notes JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure no overlapping bookings for the same space
  CONSTRAINT no_overlapping_bookings EXCLUDE USING gist (
    space_id WITH =,
    tsrange(start_time, end_time) WITH &&
  ) WHERE (status IN ('confirmed', 'pending'))
);

-- Create space_availability table
CREATE TABLE space_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  day_of_week TEXT CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')) NOT NULL,
  is_available BOOLEAN DEFAULT true,
  available_times JSONB DEFAULT '[]', -- Array of time slots: [{"start": "09:00", "end": "17:00"}]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- One availability record per space per day
  UNIQUE(space_id, day_of_week)
);

-- Create indexes for better performance
CREATE INDEX idx_space_bookings_space_id ON space_bookings(space_id);
CREATE INDEX idx_space_bookings_user_id ON space_bookings(user_id);
CREATE INDEX idx_space_bookings_status ON space_bookings(status);
CREATE INDEX idx_space_bookings_start_time ON space_bookings(start_time);
CREATE INDEX idx_space_bookings_end_time ON space_bookings(end_time);
CREATE INDEX idx_space_bookings_created_at ON space_bookings(created_at);

CREATE INDEX idx_space_availability_space_id ON space_availability(space_id);
CREATE INDEX idx_space_availability_day_of_week ON space_availability(day_of_week);

-- Create updated_at triggers
CREATE TRIGGER update_space_bookings_updated_at BEFORE UPDATE
    ON space_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_space_availability_updated_at BEFORE UPDATE
    ON space_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE space_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_availability ENABLE ROW LEVEL SECURITY;

-- Space Bookings Policies

-- Policy: Users can create their own bookings
CREATE POLICY "Users can create bookings" ON space_bookings
  FOR INSERT TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can view their own bookings and space owners can view bookings for their spaces
CREATE POLICY "View own bookings and space owner bookings" ON space_bookings
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM spaces 
      WHERE spaces.id = space_bookings.space_id 
      AND spaces.owner_id = auth.uid()
    )
  );

-- Policy: Users can update their own bookings (to cancel), space owners can update status
CREATE POLICY "Update own bookings and space owner can manage" ON space_bookings
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM spaces 
      WHERE spaces.id = space_bookings.space_id 
      AND spaces.owner_id = auth.uid()
    )
  );

-- Policy: Users can delete their own bookings, space owners can delete bookings for their spaces
CREATE POLICY "Delete own bookings and space owner can delete" ON space_bookings
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM spaces 
      WHERE spaces.id = space_bookings.space_id 
      AND spaces.owner_id = auth.uid()
    )
  );

-- Space Availability Policies

-- Policy: Space owners can manage availability for their spaces
CREATE POLICY "Space owners can manage availability" ON space_availability
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM spaces 
      WHERE spaces.id = space_availability.space_id 
      AND spaces.owner_id = auth.uid()
    )
  );

-- Policy: Anyone can view space availability (for booking purposes)
CREATE POLICY "Anyone can view space availability" ON space_availability
  FOR SELECT TO authenticated
  USING (true);

-- Function to create booking notifications
CREATE OR REPLACE FUNCTION create_booking_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify space owner of new booking
  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (user_id, type, title, content, data)
    SELECT 
      spaces.owner_id,
      'booking_request',
      'New Booking Request',
      profiles.full_name || ' has requested to book ' || spaces.name,
      jsonb_build_object(
        'booking_id', NEW.id,
        'space_id', NEW.space_id,
        'user_id', NEW.user_id,
        'start_time', NEW.start_time,
        'end_time', NEW.end_time,
        'status', NEW.status
      )
    FROM spaces
    JOIN profiles ON profiles.id = NEW.user_id
    WHERE spaces.id = NEW.space_id;
    
    RETURN NEW;
  END IF;
  
  -- Notify user of booking status change
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO notifications (user_id, type, title, content, data)
    SELECT 
      NEW.user_id,
      'booking_status',
      'Booking Status Update',
      CASE 
        WHEN NEW.status = 'confirmed' THEN 'Your booking for ' || spaces.name || ' has been confirmed!'
        WHEN NEW.status = 'rejected' THEN 'Your booking for ' || spaces.name || ' has been declined.'
        WHEN NEW.status = 'cancelled' THEN 'Your booking for ' || spaces.name || ' has been cancelled.'
        ELSE 'Your booking status has been updated.'
      END,
      jsonb_build_object(
        'booking_id', NEW.id,
        'space_id', NEW.space_id,
        'status', NEW.status,
        'start_time', NEW.start_time,
        'end_time', NEW.end_time
      )
    FROM spaces
    WHERE spaces.id = NEW.space_id;
    
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for booking notifications
CREATE TRIGGER booking_notification_trigger
  AFTER INSERT OR UPDATE ON space_bookings
  FOR EACH ROW EXECUTE FUNCTION create_booking_notification();

-- Function to check booking conflicts
CREATE OR REPLACE FUNCTION check_booking_conflicts(
  p_space_id UUID,
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_end_time TIMESTAMP WITH TIME ZONE,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO conflict_count
  FROM space_bookings
  WHERE space_id = p_space_id
    AND status IN ('confirmed', 'pending')
    AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
    AND (
      (start_time < p_end_time AND end_time > p_start_time)
    );
  
  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Default availability for spaces (9 AM to 5 PM, all days)
INSERT INTO space_availability (space_id, day_of_week, is_available, available_times)
SELECT 
  s.id as space_id,
  d.day_name as day_of_week,
  true as is_available,
  '[{"start": "09:00", "end": "17:00"}]'::jsonb as available_times
FROM spaces s
CROSS JOIN (
  VALUES 
    ('monday'), ('tuesday'), ('wednesday'), ('thursday'), 
    ('friday'), ('saturday'), ('sunday')
) AS d(day_name)
ON CONFLICT (space_id, day_of_week) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE space_bookings IS 'Booking requests and confirmations for spaces';
COMMENT ON TABLE space_availability IS 'Available time slots for each space by day of week';

COMMENT ON COLUMN space_bookings.notes IS 'JSON object containing booking details (event title, description, contact info, etc.)';
COMMENT ON COLUMN space_availability.available_times IS 'JSON array of time slots: [{"start": "09:00", "end": "17:00"}]';

COMMENT ON FUNCTION check_booking_conflicts IS 'Check if a booking conflicts with existing confirmed/pending bookings';