/*
  # Update invite code generation for fun word-based codes

  1. Functions
    - Update `generate_invite_code_admin()` to create word-based codes
    - Add word lists for holistic/wellness themes
    - Combine words with numbers for uniqueness

  2. Examples
    - garden123, healing425, mindful789
    - lotus456, peace321, harmony654
    - zen987, flow234, sacred567
*/

-- Function to generate fun word-based invite codes
CREATE OR REPLACE FUNCTION generate_invite_code_admin(
  expires_at timestamptz DEFAULT NULL,
  created_by_id uuid DEFAULT NULL
)
RETURNS text AS $$
DECLARE
  -- Word lists for holistic/wellness themes
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
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

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
  
  -- Insert the new invite code
  INSERT INTO invite_codes (code, created_by, expires_at)
  VALUES (result, COALESCE(created_by_id, auth.uid()), expires_at);
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the standalone generate function as well
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