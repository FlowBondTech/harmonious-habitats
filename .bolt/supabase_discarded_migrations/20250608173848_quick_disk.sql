/*
  # Enable users to create invite codes

  1. New Functions
    - `generate_user_invite_code` - Allows regular users to create invite codes
    - `get_user_invite_codes` - Allows users to view their created invite codes

  2. Updated Policies
    - Allow authenticated users to create invite codes
    - Allow users to view invite codes they created

  3. Limitations
    - Users can create up to 5 unused invite codes at a time
    - User-created codes expire after 30 days by default
*/

-- Function for regular users to generate invite codes
CREATE OR REPLACE FUNCTION generate_user_invite_code(
  expires_at timestamptz DEFAULT NULL,
  created_by_id uuid DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code TEXT;
  user_unused_count INTEGER;
  word_parts TEXT[] := ARRAY[
    'garden', 'healing', 'mindful', 'peaceful', 'wisdom', 'harmony', 'balance', 
    'growth', 'bloom', 'serenity', 'tranquil', 'sacred', 'nature', 'spirit',
    'calm', 'gentle', 'pure', 'light', 'heart', 'soul', 'zen', 'flow',
    'grace', 'joy', 'hope', 'love', 'unity', 'clarity', 'inner', 'divine'
  ];
  number_suffix TEXT;
  max_attempts INTEGER := 10;
  attempt_count INTEGER := 0;
BEGIN
  -- Get current user ID if not provided
  IF created_by_id IS NULL THEN
    created_by_id := auth.uid();
  END IF;

  -- Check if user is authenticated
  IF created_by_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to create invite codes';
  END IF;

  -- Check how many unused invite codes the user has
  SELECT COUNT(*) INTO user_unused_count
  FROM invite_codes
  WHERE created_by = created_by_id 
    AND is_used = false
    AND (expires_at IS NULL OR expires_at > now());

  -- Limit users to 5 unused invite codes
  IF user_unused_count >= 5 THEN
    RAISE EXCEPTION 'You can only have up to 5 unused invite codes at a time';
  END IF;

  -- Default expiry to 30 days for user-created codes
  IF expires_at IS NULL THEN
    expires_at := now() + interval '30 days';
  END IF;

  -- Generate a unique code with retry logic
  WHILE attempt_count < max_attempts LOOP
    -- Generate random word + 3-digit number
    number_suffix := LPAD((RANDOM() * 999)::INTEGER::TEXT, 3, '0');
    new_code := UPPER(word_parts[1 + (RANDOM() * array_length(word_parts, 1))::INTEGER] || number_suffix);
    
    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM invite_codes WHERE code = new_code) THEN
      EXIT; -- Code is unique, exit loop
    END IF;
    
    attempt_count := attempt_count + 1;
  END LOOP;

  -- If we couldn't generate a unique code, raise an error
  IF attempt_count >= max_attempts THEN
    RAISE EXCEPTION 'Unable to generate unique invite code after % attempts', max_attempts;
  END IF;

  -- Insert the new invite code
  INSERT INTO invite_codes (code, created_by, expires_at)
  VALUES (new_code, created_by_id, expires_at);

  RETURN new_code;
END;
$$;

-- Function to get user's invite codes
CREATE OR REPLACE FUNCTION get_user_invite_codes()
RETURNS TABLE (
  id uuid,
  code text,
  is_used boolean,
  expires_at timestamptz,
  created_at timestamptz,
  used_at timestamptz,
  used_by_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

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
$$;

-- Update policies to allow users to create and view their own invite codes
CREATE POLICY "Users can create invite codes"
  ON invite_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can view their own invite codes"
  ON invite_codes
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can update their own unused invite codes"
  ON invite_codes
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() AND is_used = false)
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own unused invite codes"
  ON invite_codes
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() AND is_used = false);