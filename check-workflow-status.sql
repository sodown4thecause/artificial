-- ============================================
-- WORKFLOW STATUS DIAGNOSTIC SCRIPT
-- ============================================
-- Replace <USER_ID> with the actual Clerk user ID
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Check if user has completed onboarding
SELECT 
    '1. ONBOARDING STATUS' as check_name,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ User has onboarding profile'
        ELSE '❌ No onboarding profile found'
    END as status,
    full_name,
    website_url,
    industry,
    location,
    created_at
FROM onboarding_profiles
WHERE user_id = '<USER_ID>'
GROUP BY full_name, website_url, industry, location, created_at;

-- 2. Check workflow runs
SELECT 
    '2. WORKFLOW RUNS' as check_name,
    id as workflow_id,
    status,
    triggered_at,
    completed_at,
    EXTRACT(EPOCH FROM (COALESCE(completed_at, NOW()) - triggered_at))/60 as duration_minutes,
    website_url,
    metadata->>'error' as error_message
FROM workflow_runs
WHERE user_id = '<USER_ID>'
ORDER BY triggered_at DESC
LIMIT 5;

-- 3. Check if report was created
SELECT 
    '3. REPORT STATUS' as check_name,
    r.id as report_id,
    r.captured_at,
    wr.status as workflow_status,
    CASE 
        WHEN r.payload->>'summary' IS NOT NULL THEN '✅ Has summary'
        WHEN r.payload->>'overview' IS NOT NULL THEN '⚠️ Old format (needs migration)'
        ELSE '❌ Missing summary'
    END as payload_status,
    CASE 
        WHEN r.payload->'serpTimeline' IS NOT NULL THEN '✅'
        ELSE '❌'
    END as has_serp_data,
    CASE 
        WHEN r.payload->'keywordOpportunities' IS NOT NULL THEN '✅'
        ELSE '❌'
    END as has_keywords,
    CASE 
        WHEN r.payload->'backlinks' IS NOT NULL THEN '✅'
        ELSE '❌'
    END as has_backlinks,
    CASE 
        WHEN r.payload->'coreWebVitals' IS NOT NULL THEN '✅'
        ELSE '❌'
    END as has_web_vitals
FROM reports r
JOIN workflow_runs wr ON r.workflow_id = wr.id
WHERE wr.user_id = '<USER_ID>'
ORDER BY r.captured_at DESC
LIMIT 1;

-- 4. Check rate limits
SELECT 
    '4. RATE LIMITS' as check_name,
    user_id,
    reports_generated as generation_count,
    10 as daily_limit,
    CASE 
        WHEN reports_generated < 10 THEN '✅ Under limit'
        ELSE '❌ Limit reached'
    END as limit_status,
    last_report_at,
    report_date,
    CASE 
        WHEN report_date < CURRENT_DATE THEN '⚠️ Old data - needs new entry'
        ELSE '✅ Today'
    END as date_status
FROM daily_report_limits
WHERE user_id = '<USER_ID>'
  AND report_date = CURRENT_DATE;

-- 5. Check for stuck workflows
SELECT 
    '5. STUCK WORKFLOWS' as check_name,
    id,
    status,
    triggered_at,
    EXTRACT(EPOCH FROM (NOW() - triggered_at))/60 as minutes_ago,
    CASE 
        WHEN status IN ('queued', 'running') 
         AND triggered_at < NOW() - INTERVAL '30 minutes' 
        THEN '❌ STUCK - Older than 30 minutes'
        WHEN status IN ('queued', 'running') 
        THEN '⏳ Still processing'
        ELSE '✅ Completed or failed'
    END as workflow_health
FROM workflow_runs
WHERE user_id = '<USER_ID>'
  AND status IN ('queued', 'running')
ORDER BY triggered_at DESC;

-- 6. Summary
SELECT 
    '6. SUMMARY' as check_name,
    (SELECT COUNT(*) FROM onboarding_profiles WHERE user_id = '<USER_ID>') as onboarding_complete,
    (SELECT COUNT(*) FROM workflow_runs WHERE user_id = '<USER_ID>') as total_workflows,
    (SELECT COUNT(*) FROM workflow_runs WHERE user_id = '<USER_ID>' AND status = 'completed') as completed_workflows,
    (SELECT COUNT(*) FROM workflow_runs WHERE user_id = '<USER_ID>' AND status = 'failed') as failed_workflows,
    (SELECT COUNT(*) FROM workflow_runs WHERE user_id = '<USER_ID>' AND status IN ('queued', 'running')) as in_progress,
    (SELECT COUNT(*) FROM reports r JOIN workflow_runs w ON r.workflow_id = w.id WHERE w.user_id = '<USER_ID>') as total_reports,
    (SELECT reports_generated FROM daily_report_limits WHERE user_id = '<USER_ID>' AND report_date = CURRENT_DATE) as reports_generated_today;

-- ============================================
-- QUICK FIXES
-- ============================================

-- If workflow is stuck (run only if needed):
-- UPDATE workflow_runs 
-- SET status = 'failed', 
--     metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{error}', '"Manually failed - stuck"')
-- WHERE user_id = '<USER_ID>' 
--   AND status IN ('queued', 'running')
--   AND triggered_at < NOW() - INTERVAL '30 minutes';

-- Reset rate limit (run only for testing):
-- DELETE FROM daily_report_limits WHERE user_id = '<USER_ID>' AND report_date = CURRENT_DATE;

-- ============================================
-- EXPECTED RESULTS FOR HEALTHY STATE
-- ============================================
-- 1. ONBOARDING STATUS: ✅ User has onboarding profile
-- 2. WORKFLOW RUNS: Latest status = 'completed'
-- 3. REPORT STATUS: ✅ Has summary, ✅ Has all data
-- 4. RATE LIMITS: ✅ Under limit (0-9 of 10)
-- 5. STUCK WORKFLOWS: Empty result set (no stuck workflows)
-- 6. SUMMARY: total_workflows > 0, completed_workflows > 0, total_reports > 0
-- ============================================
