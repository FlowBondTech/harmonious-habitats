/*
  # Remove invite code limits for users

  1. Database Functions
    - Update generate_user_invite_code to remove the 5-code limit
    - Allow unlimited invite code creation

  2. Changes
    - Remove the limit check from the function
    - Users can now create as many invite codes as they want
*/

-- Update the function to remove the 5-code limit
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

  -- Generate a unique code (removed limit check)
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