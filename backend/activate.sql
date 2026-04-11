-- Activate user account for testing
UPDATE content_users
SET is_active = TRUE,
    expires_at = NOW() + INTERVAL '90 days'
WHERE email = 'uzochukwubonaventure3@gmail.com';

-- Update payment status
UPDATE payments
SET status = 'success'
WHERE user_id IN (
    SELECT id FROM content_users WHERE email = 'uzochukwubonaventure3@gmail.com'
) AND status = 'pending';

-- Check the result
SELECT email, is_active, expires_at, plan
FROM content_users
WHERE email = 'uzochukwubonaventure3@gmail.com';