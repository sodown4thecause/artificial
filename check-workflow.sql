-- Check workflow status for ID: 7b39b30f-d208-450b-9461-d55d5c5c1d9d

-- 1. Check workflow run status
SELECT 
    id,
    user_id,
    website_url,
    status,
    metadata,
    captured_at
FROM workflow_runs
WHERE id = '7b39b30f-d208-450b-9461-d55d5c5c1d9d';

-- 2. Check if SERP data was collected
SELECT COUNT(*) as serp_count
FROM serp_results
WHERE workflow_id = '7b39b30f-d208-450b-9461-d55d5c5c1d9d';

-- 3. Check if keyword data was collected
SELECT COUNT(*) as keyword_count
FROM keyword_metrics
WHERE workflow_id = '7b39b30f-d208-450b-9461-d55d5c5c1d9d';

-- 4. Check if business profile data exists
SELECT COUNT(*) as business_profile_count
FROM business_profiles
WHERE workflow_id = '7b39b30f-d208-450b-9461-d55d5c5c1d9d';

-- 5. Check if intelligence report was generated
SELECT 
    report_id,
    user_id,
    industry,
    location,
    competitor_analysis,
    market_analysis,
    opportunity_score,
    captured_at
FROM intelligence_reports
WHERE user_id = (
    SELECT user_id 
    FROM workflow_runs 
    WHERE id = '7b39b30f-d208-450b-9461-d55d5c5c1d9d'
)
ORDER BY captured_at DESC
LIMIT 1;

-- 6. Check all recent workflows
SELECT 
    id,
    website_url,
    status,
    captured_at,
    EXTRACT(EPOCH FROM (NOW() - captured_at)) as seconds_ago
FROM workflow_runs
ORDER BY captured_at DESC
LIMIT 5;
