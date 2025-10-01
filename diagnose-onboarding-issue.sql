-- ============================================
-- DIAGNOSE: Why Onboarding Isn't Completing
-- ============================================
-- Results show:
-- - onboarding_complete: 0
-- - total_workflows: 0
-- This means onboarding was never submitted or failed
-- ============================================

-- 1. Check if onboarding_profiles table exists and has any records
SELECT 
    '1. ONBOARDING TABLE CHECK' as check_name,
    COUNT(*) as total_records,
    CASE 
        WHEN COUNT(*) > 0 THEN '⚠️ Has records but not for your user'
        ELSE '❌ No records at all - onboarding never submitted'
    END as status
FROM onboarding_profiles;

-- 2. List ALL onboarding profiles to see what users exist
SELECT 
    '2. ALL ONBOARDING PROFILES' as check_name,
    user_id,
    full_name,
    website_url,
    industry,
    location,
    created_at
FROM onboarding_profiles
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check if workflow_runs table has ANY records
SELECT 
    '3. WORKFLOW RUNS CHECK' as check_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users,
    CASE 
        WHEN COUNT(*) > 0 THEN '⚠️ Has workflows but not for your user'
        ELSE '❌ No workflows at all'
    END as status
FROM workflow_runs;

-- 4. List ALL workflow runs to see what users exist
SELECT 
    '4. ALL WORKFLOW RUNS' as check_name,
    user_id,
    website_url,
    status,
    triggered_at
FROM workflow_runs
ORDER BY triggered_at DESC
LIMIT 10;

-- 5. Check signup_fingerprints (might block multiple signups)
SELECT 
    '5. SIGNUP FINGERPRINTS' as check_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT ip_address) as unique_ips
FROM signup_fingerprints;

-- 6. List signup fingerprints
SELECT 
    '6. ALL SIGNUP FINGERPRINTS' as check_name,
    user_id,
    ip_address,
    created_at
FROM signup_fingerprints
ORDER BY created_at DESC
LIMIT 10;

-- 7. Check daily_report_limits
SELECT 
    '7. RATE LIMIT RECORDS' as check_name,
    COUNT(*) as total_records,
    SUM(reports_generated) as total_reports_generated
FROM daily_report_limits;

-- 8. List rate limit records
SELECT 
    '8. ALL RATE LIMIT RECORDS' as check_name,
    user_id,
    ip_address,
    report_date,
    reports_generated,
    last_report_at
FROM daily_report_limits
ORDER BY last_report_at DESC
LIMIT 10;

-- ============================================
-- ANALYSIS GUIDE
-- ============================================

-- If ALL tables are empty (0 records):
--   → Onboarding form is not submitting to the API
--   → Check browser console for JavaScript errors
--   → Check Network tab for failed API calls
--   → Verify VITE_SUPABASE_URL is correct in .env

-- If tables have records but not YOUR user_id:
--   → You might be using a different Clerk user ID
--   → Check if you're signed in with the correct account
--   → Get your current user ID from Clerk

-- To get your CURRENT Clerk user ID:
--   1. Open browser DevTools (F12)
--   2. Go to Console tab
--   3. Paste this code:
--      fetch('https://api.clerk.dev/v1/me', {
--        headers: { 'Authorization': 'Bearer ' + document.cookie.split('__session=')[1]?.split(';')[0] }
--      }).then(r => r.json()).then(d => console.log('User ID:', d.id))

-- ============================================
-- QUICK FIXES
-- ============================================

-- If you want to test with a dummy record:
/*
-- Create test onboarding profile
INSERT INTO onboarding_profiles (user_id, full_name, website_url, industry, location)
VALUES ('<YOUR_CLERK_USER_ID>', 'Test User', 'example.com', 'Technology', 'United States');

-- Create test workflow run
INSERT INTO workflow_runs (user_id, website_url, status)
VALUES ('<YOUR_CLERK_USER_ID>', 'example.com', 'queued')
RETURNING id;

-- Use the returned ID to create a test report (replace <WORKFLOW_ID>)
INSERT INTO reports (workflow_id, payload)
VALUES ('<WORKFLOW_ID>', '{
  "summary": {
    "id": "test-report",
    "captured_at": "2025-10-01T00:00:00Z",
    "executive_summary": "This is a test report to verify the dashboard display.",
    "recommendations": [
      {
        "title": "Test Recommendation",
        "description": "This is a test recommendation to verify the dashboard works.",
        "confidence": 0.95
      }
    ]
  },
  "serpTimeline": [
    {"captured_at": "2025-10-01T00:00:00Z", "share_of_voice": 25}
  ],
  "keywordOpportunities": [
    {"keyword": "test", "volume": 1000, "difficulty": 30, "ctrPotential": 0.5}
  ],
  "sentiment": [
    {"label": "Brand", "score": 80}
  ],
  "backlinks": [
    {"source": "example.com", "authority": 50, "anchorText": "Test"}
  ],
  "coreWebVitals": [
    {"metric": "LCP", "desktop": 2.5, "mobile": 3.5},
    {"metric": "FID", "desktop": 100, "mobile": 150},
    {"metric": "CLS", "desktop": 0.1, "mobile": 0.15}
  ],
  "techStack": []
}'::jsonb);
*/
