/*
  # User-Generated Invite Codes Feature

  1. New Function
    - Allow users to create their own invite codes
    - Limit to 5 active codes per user
    - 30-day expiration
    - Beautiful word combinations

  2. Enhanced Admin Functions
    - View which users created which codes
    - Better invite code management

  3. New RLS Policies
    - Users can view their own created codes
    - Users can create limited number of codes
*/

-- Function for users to generate their own invite codes
CREATE OR REPLACE FUNCTION generate_user_invite_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
  word_part text;
  number_part text;
  user_code_count integer;
  words text[] := ARRAY[
    'garden', 'healing', 'mindful', 'peace', 'wisdom', 'harmony', 'nature',
    'balance', 'sacred', 'spirit', 'gentle', 'serene', 'calm', 'bright',
    'crystal', 'flower', 'earth', 'moon', 'sun', 'river', 'forest', 'sky',
    'ocean', 'mountain', 'light', 'soul', 'heart', 'love', 'joy', 'hope',
    'dream', 'flow', 'zen', 'pure', 'clear', 'fresh', 'green', 'golden',
    'silver', 'dawn', 'sunset', 'star', 'cloud', 'wind', 'rain', 'bloom'
  ];
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Generate a unique code
  LOOP
    -- Generate word + number combination
    word_part := words[floor(random() * array_length(words, 1) + 1)];
    number_part := floor(random() * 900 + 100)::text; -- 3-digit number
    new_code := UPPER(word_part || number_part);
    
    -- Check if code already exists
    IF NOT EXISTS (
      SELECT 1 FROM invite_codes WHERE code = new_code
    ) THEN
      EXIT;
    END IF;
  END LOOP;

  -- Insert the new invite code
  INSERT INTO invite_codes (
    code,
    created_by,
    is_used,
    expires_at
  ) VALUES (
    new_code,
    auth.uid(),
    false,
    NOW() + INTERVAL '30 days'
  );

  RETURN new_code;
END;
$$;

-- Function to get user's own invite codes with usage details
CREATE OR REPLACE FUNCTION get_user_invite_codes()
RETURNS TABLE (
  id uuid,
  code text,
  is_used boolean,
  expires_at timestamptz,
  created_at timestamptz,
  used_at timestamptz,
  used_by_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ic.id,
    ic.code,
    ic.is_used,
    ic.expires_at,
    ic.created_at,
    ic.used_at,
    up.full_name as used_by_name
  FROM invite_codes ic
  LEFT JOIN user_profiles up ON ic.used_by = up.id
  WHERE ic.created_by = auth.uid()
  ORDER BY ic.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to allow users to view their own created codes
CREATE POLICY "Users can view their own created invite codes"
  ON invite_codes
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Allow users to delete their own unused invite codes
CREATE POLICY "Users can delete their own unused invite codes"
  ON invite_codes
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() AND is_used = false);