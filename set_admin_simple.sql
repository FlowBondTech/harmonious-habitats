-- Simple one-line admin update
-- Copy and paste this EXACT line into Supabase SQL Editor:

UPDATE profiles SET is_admin = true WHERE id IN (SELECT id FROM auth.users WHERE email = 'cryptokoh@gmail.com');
