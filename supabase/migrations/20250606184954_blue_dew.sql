/*
  # Invite-Only Holistic Spaces Database Schema

  1. New Tables
    - `invite_codes`
      - `id` (uuid, primary key)
      - `code` (text, unique) - The actual invite code
      - `created_by` (uuid) - Admin who created the code
      - `used_by` (uuid) - User who used the code
      - `is_used` (boolean) - Whether code has been used
      - `expires_at` (timestamptz) - Optional expiration
      - `created_at` (timestamptz)
      - `used_at` (timestamptz)

    - `user_profiles`
      - `id` (uuid, primary key) - References auth.users
      - `email` (text, unique)
      - `full_name` (text)
      - `bio` (text)
      - `expertise` (text array)
      - `is_admin` (boolean)
      - `invite_code_used` (uuid) - Which invite code was used
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `spaces`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `holder_id` (uuid) - References user_profiles
      - `date` (date)
      - `start_time` (time)
      - `end_time` (time)
      - `location` (text)
      - `capacity` (integer)
      - `status` (text) - open, full, ongoing, completed
      - `pricing_type` (text) - free, fixed, donation
      - `price_amount` (decimal)
      - `suggested_donation` (decimal)
      - `image_url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `space_attendees`
      - `id` (uuid, primary key)
      - `space_id` (uuid) - References spaces
      - `user_id` (uuid) - References user_profiles
      - `joined_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Admins can create and view invite codes
    - Anyone can validate unused invite codes
    - Users can view profiles and manage their own
    - Users can create/manage their own spaces
    - Users can join/leave spaces

  3. Functions
    - Auto-generate unique invite codes
    - Update timestamps automatically
    - Make user admin function
*/

-- Create invite_codes table
CREATE TABLE IF NOT EXISTS invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_used boolean DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  used_at timestamptz
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  bio text,
  expertise text[],
  is_admin boolean DEFAULT false,
  invite_code_used uuid REFERENCES invite_codes(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create spaces table
CREATE TABLE IF NOT EXISTS spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  holder_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  location text NOT NULL,
  capacity integer NOT NULL CHECK (capacity > 0),
  status text NOT NULL CHECK (status IN ('open', 'full', 'ongoing', 'completed')),
  pricing_type text NOT NULL CHECK (pricing_type IN ('free', 'fixed', 'donation')),
  price_amount decimal(10,2) CHECK (price_amount >= 0),
  suggested_donation decimal(10,2) CHECK (suggested_donation >= 0),
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create space_attendees table
CREATE TABLE IF NOT EXISTS space_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid REFERENCES spaces(id) ON DELETE CASCADE,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(space_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_attendees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invite_codes
CREATE POLICY "Admins can create invite codes"
  ON invite_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can view all invite codes"
  ON invite_codes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Anyone can view unused invite codes for validation"
  ON invite_codes
  FOR SELECT
  TO anon
  USING (is_used = false);

CREATE POLICY "System can update invite codes when used"
  ON invite_codes
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for user_profiles
CREATE POLICY "Users can view all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for spaces
CREATE POLICY "Anyone can view spaces"
  ON spaces
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create spaces"
  ON spaces
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = holder_id);

CREATE POLICY "Space holders can update their own spaces"
  ON spaces
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = holder_id)
  WITH CHECK (auth.uid() = holder_id);

CREATE POLICY "Space holders can delete their own spaces"
  ON spaces
  FOR DELETE
  TO authenticated
  USING (auth.uid() = holder_id);

-- RLS Policies for space_attendees
CREATE POLICY "Users can view all attendees"
  ON space_attendees
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join spaces"
  ON space_attendees
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave spaces"
  ON space_attendees
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spaces_updated_at
  BEFORE UPDATE ON spaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS text AS $$
DECLARE
  code_length integer := 8;
  characters text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..code_length LOOP
    result := result || substr(characters, floor(random() * length(characters) + 1)::integer, 1);
  END LOOP;
  
  -- Check if code already exists, if so, generate a new one
  WHILE EXISTS (SELECT 1 FROM invite_codes WHERE code = result) LOOP
    result := '';
    FOR i IN 1..code_length LOOP
      result := result || substr(characters, floor(random() * length(characters) + 1)::integer, 1);
    END LOOP;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to validate and use invite code
CREATE OR REPLACE FUNCTION use_invite_code(invite_code text, user_id uuid)
RETURNS boolean AS $$
DECLARE
  code_record invite_codes%ROWTYPE;
BEGIN
  -- Get the invite code record
  SELECT * INTO code_record 
  FROM invite_codes 
  WHERE code = invite_code AND is_used = false;
  
  -- Check if code exists and is not expired
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if code is expired
  IF code_record.expires_at IS NOT NULL AND code_record.expires_at < now() THEN
    RETURN false;
  END IF;
  
  -- Mark code as used
  UPDATE invite_codes 
  SET is_used = true, used_by = user_id, used_at = now()
  WHERE id = code_record.id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create an admin user (to be called after first user signs up)
CREATE OR REPLACE FUNCTION make_user_admin(user_email text)
RETURNS void AS $$
BEGIN
  UPDATE user_profiles 
  SET is_admin = true 
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create invite code (for admins)
CREATE OR REPLACE FUNCTION create_invite_code(expires_in_days integer DEFAULT NULL)
RETURNS text AS $$
DECLARE
  new_code text;
  expiry_date timestamptz;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only admins can create invite codes';
  END IF;
  
  -- Generate new code
  new_code := generate_invite_code();
  
  -- Set expiry date if specified
  IF expires_in_days IS NOT NULL THEN
    expiry_date := now() + (expires_in_days || ' days')::interval;
  END IF;
  
  -- Insert the new invite code
  INSERT INTO invite_codes (code, created_by, expires_at)
  VALUES (new_code, auth.uid(), expiry_date);
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;