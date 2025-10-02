-- Delete reports for your user
-- The reports are linked to workflow_runs table

-- Option 1: View all your workflow runs and reports first
SELECT 
  wr.id as workflow_id,
  wr.triggered_at,
  wr.status,
  wr.website_url,
  r.id as report_id,
  r.captured_at
FROM workflow_runs wr
LEFT JOIN reports r ON r.workflow_id = wr.id
WHERE wr.user_id = 'user_33UGC9OaRUjNqrjLv6YKNb88qAg'
ORDER BY wr.triggered_at DESC;

-- Option 2: Delete the most recent workflow run (and its report)
-- DELETE FROM workflow_runs
-- WHERE id = (
--   SELECT id FROM workflow_runs
--   WHERE user_id = 'user_33UGC9OaRUjNqrjLv6YKNb88qAg'
--   ORDER BY triggered_at DESC
--   LIMIT 1
-- );

-- Option 3: Delete ALL workflow runs and reports for your user
-- DELETE FROM workflow_runs
-- WHERE user_id = 'user_33UGC9OaRUjNqrjLv6YKNb88qAg';
