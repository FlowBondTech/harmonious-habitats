-- Update cryptokoh user rating to 4.7
UPDATE profiles
SET rating = 4.7
WHERE email = 'cryptokoh@gmail.com' OR full_name ILIKE '%cryptokoh%';

-- Verify the update
SELECT id, email, full_name, rating, total_reviews
FROM profiles
WHERE email = 'cryptokoh@gmail.com' OR full_name ILIKE '%cryptokoh%';
