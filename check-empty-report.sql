-- ============================================
-- DIAGNOSE EMPTY REPORT ISSUE
-- ============================================
-- Report is showing but has no content
-- This means workflow ran but API calls failed
-- ============================================

-- Replace <YOUR_USER_ID> with your Clerk user ID

-- 1. Check your latest workflow run details
SELECT 
    'WORKFLOW STATUS' as check_name,
    id as workflow_id,
    status,
    triggered_at,
    completed_at,
    EXTRACT(EPOCH FROM (COALESCE(completed_at, NOW()) - triggered_at)) as duration_seconds,
    metadata,
    website_url
FROM workflow_runs
WHERE user_id = '<YOUR_USER_ID>'
ORDER BY triggered_at DESC
LIMIT 1;

-- 2. Check if report payload has any data
SELECT 
    'REPORT PAYLOAD CHECK' as check_name,
    r.id as report_id,
    r.captured_at,
    -- Check each section of the payload
    CASE WHEN r.payload->'summary' IS NOT NULL THEN '✅' ELSE '❌' END as has_summary,
    CASE WHEN r.payload->'serpTimeline' IS NOT NULL AND jsonb_array_length(r.payload->'serpTimeline') > 0 THEN '✅' ELSE '❌' END as has_serp_data,
    CASE WHEN r.payload->'keywordOpportunities' IS NOT NULL AND jsonb_array_length(r.payload->'keywordOpportunities') > 0 THEN '✅' ELSE '❌' END as has_keywords,
    CASE WHEN r.payload->'sentiment' IS NOT NULL AND jsonb_array_length(r.payload->'sentiment') > 0 THEN '✅' ELSE '❌' END as has_sentiment,
    CASE WHEN r.payload->'backlinks' IS NOT NULL AND jsonb_array_length(r.payload->'backlinks') > 0 THEN '✅' ELSE '❌' END as has_backlinks,
    CASE WHEN r.payload->'coreWebVitals' IS NOT NULL AND jsonb_array_length(r.payload->'coreWebVitals') > 0 THEN '✅' ELSE '❌' END as has_web_vitals,
    CASE WHEN r.payload->'techStack' IS NOT NULL THEN '✅' ELSE '❌' END as has_tech_stack
FROM reports r
JOIN workflow_runs w ON r.workflow_id = w.id
WHERE w.user_id = '<YOUR_USER_ID>'
ORDER BY r.captured_at DESC
LIMIT 1;

-- 3. Check AI insights table
SELECT 
    'AI INSIGHTS' as check_name,
    COUNT(*) as total_insights,
    MAX(ai.captured_at) as latest_insight
FROM ai_insights ai
JOIN workflow_runs w ON ai.workflow_id = w.id
WHERE w.user_id = '<YOUR_USER_ID>';

-- 4. Check SERP results
SELECT 
    'SERP RESULTS' as check_name,
    COUNT(*) as total_serp_results,
    COUNT(DISTINCT keyword) as unique_keywords,
    MAX(sr.captured_at) as latest_serp
FROM serp_results sr
JOIN workflow_runs w ON sr.workflow_id = w.id
WHERE w.user_id = '<YOUR_USER_ID>';

-- 5. Check keyword metrics
SELECT 
    'KEYWORD METRICS' as check_name,
    COUNT(*) as total_keywords,
    AVG(volume) as avg_volume,
    MAX(km.captured_at) as latest_keyword
FROM keyword_metrics km
JOIN workflow_runs w ON km.workflow_id = w.id
WHERE w.user_id = '<YOUR_USER_ID>';

-- 6. Check backlink metrics
SELECT 
    'BACKLINK METRICS' as check_name,
    COUNT(*) as total_backlinks,
    AVG(authority) as avg_authority,
    MAX(bm.captured_at) as latest_backlink
FROM backlink_metrics bm
JOIN workflow_runs w ON bm.workflow_id = w.id
WHERE w.user_id = '<YOUR_USER_ID>';

-- 7. Check content sentiment
SELECT 
    'CONTENT SENTIMENT' as check_name,
    COUNT(*) as total_sentiment_records,
    MAX(cs.captured_at) as latest_sentiment
FROM content_sentiment cs
JOIN workflow_runs w ON cs.workflow_id = w.id
WHERE w.user_id = '<YOUR_USER_ID>';

-- 8. Check technical audits
SELECT 
    'TECHNICAL AUDITS' as check_name,
    COUNT(*) as total_audits,
    array_agg(DISTINCT audit_type) as audit_types,
    MAX(ta.captured_at) as latest_audit
FROM technical_audits ta
JOIN workflow_runs w ON ta.workflow_id = w.id
WHERE w.user_id = '<YOUR_USER_ID>';

-- 9. Check business profiles
SELECT 
    'BUSINESS PROFILES' as check_name,
    COUNT(*) as total_profiles,
    array_agg(DISTINCT domain) as domains,
    MAX(bp.captured_at) as latest_profile
FROM business_profiles bp
JOIN workflow_runs w ON bp.workflow_id = w.id
WHERE w.user_id = '<YOUR_USER_ID>';

-- 10. SUMMARY: Which API calls succeeded vs failed
SELECT 
    'API CALL SUMMARY' as check_name,
    CASE WHEN (SELECT COUNT(*) FROM serp_results sr JOIN workflow_runs w ON sr.workflow_id = w.id WHERE w.user_id = '<YOUR_USER_ID>') > 0 THEN '✅ DataForSEO SERP' ELSE '❌ DataForSEO SERP' END as dataforseo_serp,
    CASE WHEN (SELECT COUNT(*) FROM keyword_metrics km JOIN workflow_runs w ON km.workflow_id = w.id WHERE w.user_id = '<YOUR_USER_ID>') > 0 THEN '✅ Keywords' ELSE '❌ Keywords' END as keywords,
    CASE WHEN (SELECT COUNT(*) FROM backlink_metrics bm JOIN workflow_runs w ON bm.workflow_id = w.id WHERE w.user_id = '<YOUR_USER_ID>') > 0 THEN '✅ Backlinks' ELSE '❌ Backlinks' END as backlinks,
    CASE WHEN (SELECT COUNT(*) FROM content_sentiment cs JOIN workflow_runs w ON cs.workflow_id = w.id WHERE w.user_id = '<YOUR_USER_ID>') > 0 THEN '✅ Content Analysis' ELSE '❌ Content Analysis' END as content_analysis,
    CASE WHEN (SELECT COUNT(*) FROM technical_audits ta JOIN workflow_runs w ON ta.workflow_id = w.id WHERE w.user_id = '<YOUR_USER_ID>') > 0 THEN '✅ Technical Audits' ELSE '❌ Technical Audits' END as tech_audits,
    CASE WHEN (SELECT COUNT(*) FROM business_profiles bp JOIN workflow_runs w ON bp.workflow_id = w.id WHERE w.user_id = '<YOUR_USER_ID>') > 0 THEN '✅ Business Data' ELSE '❌ Business Data' END as business_data,
    CASE WHEN (SELECT COUNT(*) FROM ai_insights ai JOIN workflow_runs w ON ai.workflow_id = w.id WHERE w.user_id = '<YOUR_USER_ID>') > 0 THEN '✅ AI Insights' ELSE '❌ AI Insights' END as ai_insights;

-- ============================================
-- NEXT STEPS BASED ON RESULTS
-- ============================================

-- If ALL APIs show ❌:
--   → All API calls are failing
--   → Check Supabase Edge Function environment variables
--   → Verify API keys are set correctly

-- If SOME APIs show ✅ and some show ❌:
--   → Specific API keys are missing or invalid
--   → Check which APIs failed and verify those specific keys

-- If ALL APIs show ✅ but report is still empty:
--   → Data is in database but not in report payload
--   → LLM API (generateInsights) might be failing
--   → Check ai_insights table for errors

-- To check Edge Function logs:
--   1. Go to Supabase Dashboard
--   2. Edge Functions → run-intelligence-workflow
--   3. Click "Logs" tab
--   4. Look for errors around the workflow run time
