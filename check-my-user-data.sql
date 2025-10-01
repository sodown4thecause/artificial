-- ============================================
-- CHECK YOUR USER'S DATA
-- ============================================
-- We found 2 users in the system:
-- 1. user_33MUiyUPoo7oi7O4aoR0WOWs103 (10 reports - RATE LIMITED)
-- 2. user_33OYNx0A1WU3wRrxNmxpTvA8Bec (7 reports total)
--
-- Replace <YOUR_USER_ID> below with YOUR Clerk user ID
-- Get it from browser console:
--   const token = document.cookie.split('__session=')[1]?.split(';')[0];
--   console.log(JSON.parse(atob(token.split('.')[1])).sub);
-- ============================================

-- Check User 1's data (RATE LIMITED)
SELECT 
    '🔴 USER 1 (RATE LIMITED)' as status,
    'user_33MUiyUPoo7oi7O4aoR0WOWs103' as user_id,
    (SELECT COUNT(*) FROM onboarding_profiles WHERE user_id = 'user_33MUiyUPoo7oi7O4aoR0WOWs103') as has_onboarding,
    (SELECT COUNT(*) FROM workflow_runs WHERE user_id = 'user_33MUiyUPoo7oi7O4aoR0WOWs103') as total_workflows,
    (SELECT COUNT(*) FROM workflow_runs WHERE user_id = 'user_33MUiyUPoo7oi7O4aoR0WOWs103' AND status = 'completed') as completed_workflows,
    (SELECT COUNT(*) FROM reports r JOIN workflow_runs w ON r.workflow_id = w.id WHERE w.user_id = 'user_33MUiyUPoo7oi7O4aoR0WOWs103') as total_reports,
    (SELECT reports_generated FROM daily_report_limits WHERE user_id = 'user_33MUiyUPoo7oi7O4aoR0WOWs103' AND report_date = CURRENT_DATE) as reports_today;

-- Check User 2's data
SELECT 
    '✅ USER 2 (HAS CAPACITY)' as status,
    'user_33OYNx0A1WU3wRrxNmxpTvA8Bec' as user_id,
    (SELECT COUNT(*) FROM onboarding_profiles WHERE user_id = 'user_33OYNx0A1WU3wRrxNmxpTvA8Bec') as has_onboarding,
    (SELECT COUNT(*) FROM workflow_runs WHERE user_id = 'user_33OYNx0A1WU3wRrxNmxpTvA8Bec') as total_workflows,
    (SELECT COUNT(*) FROM workflow_runs WHERE user_id = 'user_33OYNx0A1WU3wRrxNmxpTvA8Bec' AND status = 'completed') as completed_workflows,
    (SELECT COUNT(*) FROM reports r JOIN workflow_runs w ON r.workflow_id = w.id WHERE w.user_id = 'user_33OYNx0A1WU3wRrxNmxpTvA8Bec') as total_reports,
    (SELECT reports_generated FROM daily_report_limits WHERE user_id = 'user_33OYNx0A1WU3wRrxNmxpTvA8Bec' AND report_date = CURRENT_DATE) as reports_today;

-- ============================================
-- NOW CHECK YOUR USER
-- Replace <YOUR_USER_ID> with your actual ID
-- ============================================

SELECT 
    'YOUR USER DATA' as status,
    '<YOUR_USER_ID>' as user_id,
    (SELECT COUNT(*) FROM onboarding_profiles WHERE user_id = '<YOUR_USER_ID>') as has_onboarding,
    (SELECT COUNT(*) FROM workflow_runs WHERE user_id = '<YOUR_USER_ID>') as total_workflows,
    (SELECT COUNT(*) FROM workflow_runs WHERE user_id = '<YOUR_USER_ID>' AND status = 'completed') as completed_workflows,
    (SELECT COUNT(*) FROM workflow_runs WHERE user_id = '<YOUR_USER_ID>' AND status = 'failed') as failed_workflows,
    (SELECT COUNT(*) FROM workflow_runs WHERE user_id = '<YOUR_USER_ID>' AND status IN ('queued', 'running')) as in_progress,
    (SELECT COUNT(*) FROM reports r JOIN workflow_runs w ON r.workflow_id = w.id WHERE w.user_id = '<YOUR_USER_ID>') as total_reports,
    COALESCE((SELECT reports_generated FROM daily_report_limits WHERE user_id = '<YOUR_USER_ID>' AND report_date = CURRENT_DATE), 0) as reports_today;

-- Show latest report for YOUR user
SELECT 
    'YOUR LATEST REPORT' as info,
    r.id as report_id,
    r.captured_at,
    w.status as workflow_status,
    w.triggered_at,
    w.completed_at,
    CASE 
        WHEN r.payload->>'summary' IS NOT NULL THEN '✅ Has summary'
        ELSE '❌ Missing summary'
    END as has_summary
FROM reports r
JOIN workflow_runs w ON r.workflow_id = w.id
WHERE w.user_id = '<YOUR_USER_ID>'
ORDER BY r.captured_at DESC
LIMIT 1;

-- ============================================
-- SOLUTIONS BASED ON YOUR USER
-- ============================================

-- If YOU are user_33MUiyUPoo7oi7O4aoR0WOWs103:
--   → You've hit the rate limit (10/10 reports today)
--   → Solution 1: Reset rate limit for testing:
--      DELETE FROM daily_report_limits WHERE user_id = 'user_33MUiyUPoo7oi7O4aoR0WOWs103' AND report_date = CURRENT_DATE;
--   → Solution 2: Wait until tomorrow (resets automatically)
--   → Solution 3: Check your existing reports:
--      SELECT * FROM reports r JOIN workflow_runs w ON r.workflow_id = w.id WHERE w.user_id = 'user_33MUiyUPoo7oi7O4aoR0WOWs103' ORDER BY r.captured_at DESC LIMIT 1;

-- If YOU are user_33OYNx0A1WU3wRrxNmxpTvA8Bec:
--   → You have capacity (1/10 reports today, 7 total)
--   → Check if your latest report exists:
--      SELECT * FROM reports r JOIN workflow_runs w ON r.workflow_id = w.id WHERE w.user_id = 'user_33OYNx0A1WU3wRrxNmxpTvA8Bec' ORDER BY r.captured_at DESC LIMIT 1;

-- If YOU are a DIFFERENT user (3rd user):
--   → You haven't completed onboarding yet
--   → Solution: Complete onboarding at /onboarding
--   → Or use the test data script from ACTION-PLAN-NO-WORKFLOWS.md

-- ============================================
-- QUICK FIX: View report for User 2
-- ============================================
-- If you want to see User 2's report as a test:
SELECT 
    'USER 2 LATEST REPORT' as info,
    r.payload
FROM reports r
JOIN workflow_runs w ON r.workflow_id = w.id
WHERE w.user_id = 'user_33OYNx0A1WU3wRrxNmxpTvA8Bec'
ORDER BY r.captured_at DESC
LIMIT 1;
