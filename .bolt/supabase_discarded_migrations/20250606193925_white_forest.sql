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

CREATE POLICY "Admins can delete any invite code"
  ON invite_codes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_check
      WHERE admin_check.id = auth.uid() 
      AND admin_check.is_admin = true
    )
  );

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

CREATE POLICY "Admins can update any user profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_check
      WHERE admin_check.id = auth.uid() 
      AND admin_check.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles admin_check
      WHERE admin_check.id = auth.uid() 
      AND admin_check.is_admin = true
    )
  );

CREATE POLICY "Admins can delete any user profile"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_check
      WHERE admin_check.id = auth.uid() 
      AND admin_check.is_admin = true
    )
  );

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

CREATE POLICY "Admins can update any space"
  ON spaces
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_check
      WHERE admin_check.id = auth.uid() 
      AND admin_check.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles admin_check
      WHERE admin_check.id = auth.uid() 
      AND admin_check.is_admin = true
    )
  );

CREATE POLICY "Admins can delete any space"
  ON spaces
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_check
      WHERE admin_check.id = auth.uid() 
      AND admin_check.is_admin = true
    )
  );

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

CREATE POLICY "Admins can view all space attendees"
  ON space_attendees
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_check
      WHERE admin_check.id = auth.uid() 
      AND admin_check.is_admin = true
    )
  );

CREATE POLICY "Admins can remove users from spaces"
  ON space_attendees
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_check
      WHERE admin_check.id = auth.uid() 
      AND admin_check.is_admin = true
    )
  );

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

-- Function to generate unique invite codes with beautiful word combinations
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS text AS $$
DECLARE
  words text[] := ARRAY[
    'garden', 'healing', 'mindful', 'lotus', 'peace', 'harmony', 
    'zen', 'flow', 'sacred', 'spirit', 'nature', 'wisdom',
    'light', 'earth', 'moon', 'sun', 'star', 'ocean',
    'forest', 'river', 'mountain', 'valley', 'meadow', 'bloom',
    'breath', 'heart', 'soul', 'calm', 'serene', 'gentle',
    'pure', 'divine', 'mystic', 'cosmic', 'crystal', 'sage',
    'willow', 'cedar', 'oak', 'pine', 'rose', 'lily',
    'jasmine', 'lavender', 'mint', 'basil', 'thyme', 'ginger',
    'amber', 'jade', 'pearl', 'ruby', 'emerald', 'opal',
    'dawn', 'dusk', 'aurora', 'solace', 'bliss', 'grace',
    'unity', 'balance', 'center', 'focus', 'clarity', 'insight',
    'journey', 'path', 'quest', 'dream', 'vision', 'hope',
    'trust', 'faith', 'love', 'joy', 'wonder', 'magic'
  ];
  
  selected_word text;
  random_number text;
  result text;
  attempt_count integer := 0;
  max_attempts integer := 100;
BEGIN
  -- Generate unique word + number combination
  LOOP
    -- Select random word from array
    selected_word := words[floor(random() * array_length(words, 1) + 1)];
    
    -- Generate 3-digit number
    random_number := lpad(floor(random() * 1000)::text, 3, '0');
    
    -- Combine word and number
    result := selected_word || random_number;
    
    -- Check if this combination already exists
    EXIT WHEN NOT EXISTS (SELECT 1 FROM invite_codes WHERE code = UPPER(result));
    
    -- Prevent infinite loop
    attempt_count := attempt_count + 1;
    IF attempt_count >= max_attempts THEN
      -- Fallback to completely random if we can't find unique word combo
      result := '';
      FOR i IN 1..8 LOOP
        result := result || substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random() * 36 + 1)::integer, 1);
      END LOOP;
      EXIT WHEN NOT EXISTS (SELECT 1 FROM invite_codes WHERE code = result);
    END IF;
  END LOOP;
  
  -- Convert to uppercase for consistency
  result := UPPER(result);
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to validate and use invite code
CREATE OR REPLACE FUNCTION use_invite_code(invite_code text, user_id uuid)
RETURNS boolean AS $$
DECLARE
  code_record record;
BEGIN
  -- Find the invite code
  SELECT * INTO code_record
  FROM invite_codes
  WHERE code = UPPER(invite_code)
    AND is_used = false;
  
  -- Check if code exists and is valid
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if code is expired
  IF code_record.expires_at IS NOT NULL AND code_record.expires_at < now() THEN
    RETURN false;
  END IF;
  
  -- Mark code as used
  UPDATE invite_codes
  SET 
    is_used = true,
    used_by = user_id,
    used_at = now()
  WHERE id = code_record.id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate invite codes (admin only)
CREATE OR REPLACE FUNCTION generate_invite_code_admin(
  expires_at timestamptz DEFAULT NULL,
  created_by_id uuid DEFAULT NULL
)
RETURNS text AS $$
DECLARE
  new_code text;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Generate new code
  new_code := generate_invite_code();
  
  -- Insert the new invite code
  INSERT INTO invite_codes (code, created_by, expires_at)
  VALUES (new_code, COALESCE(created_by_id, auth.uid()), expires_at);
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to make first user admin (one-time setup)
CREATE OR REPLACE FUNCTION make_first_user_admin()
RETURNS void AS $$
BEGIN
  -- Only run if no admin exists
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE is_admin = true) THEN
    UPDATE user_profiles 
    SET is_admin = true 
    WHERE id = (
      SELECT id FROM user_profiles 
      ORDER BY created_at ASC 
      LIMIT 1
    );
  END IF;
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

-- Function to promote user to admin (admin-only)
CREATE OR REPLACE FUNCTION promote_user_to_admin(target_user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Update target user to admin
  UPDATE user_profiles 
  SET is_admin = true, updated_at = now()
  WHERE id = target_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke admin privileges (admin-only)
CREATE OR REPLACE FUNCTION revoke_admin_privileges(target_user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Prevent self-demotion
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot revoke your own admin privileges';
  END IF;

  -- Update target user to remove admin
  UPDATE user_profiles 
  SET is_admin = false, updated_at = now()
  WHERE id = target_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;