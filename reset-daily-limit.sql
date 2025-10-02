-- Reset daily limits for testing
-- This will allow you to generate more reports today

DELETE FROM daily_limits WHERE user_id = 'user_33UGC9OaRUjNqrjLv6YKNb88qAg';

-- Verify the deletion
SELECT * FROM daily_limits WHERE user_id = 'user_33UGC9OaRUjNqrjLv6YKNb88qAg';

-- Show all current limits
SELECT user_id, report_count, last_reset_date FROM daily_limits;
