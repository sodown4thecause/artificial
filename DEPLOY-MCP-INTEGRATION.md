# Deployment Instructions for MCP Integration

## What Changed

We've migrated from direct DataForSEO API calls to using your Cloudflare Worker MCP proxy. This solves the credential issues you were experiencing.

### Files Modified:
1. ✅ **Created**: `supabase/functions/lib/integrations/dataforseo-mcp.ts`
2. ✅ **Updated**: `supabase/functions/lib/workflow-orchestrator.ts` (changed import)
3. ✅ **Documentation**: Created migration guide and this deployment doc

## Deployment Options

### Option 1: Deploy via Supabase CLI (Recommended)

If you have proper Supabase CLI permissions:

```bash
# Make sure you're logged in
supabase login

# Link to your project
supabase link --project-ref niwvvqczjimfnggbussr

# Deploy the function
supabase functions deploy workflow-orchestrator --project-ref niwvvqczjimfnggbussr
```

### Option 2: Deploy via Supabase Dashboard

If CLI has permission issues:

1. **Go to Supabase Dashboard**
   - Navigate to https://supabase.com/dashboard/project/niwvvqczjimfnggbussr
   - Click on "Edge Functions" in the left sidebar

2. **Deploy the updated function**
   - Click on the `workflow-orchestrator` function
   - Click "Deploy new version" or "Edit"
   - The dashboard should sync with your GitHub repo automatically
   - If not, you can manually upload the function files

3. **Verify deployment**
   - Check the function logs to ensure it's running
   - Look for the new log messages mentioning "proxy server" and "MCP"

### Option 3: Deploy via GitHub (If connected)

If your Supabase project is connected to GitHub:

1. **Commit and push your changes**:
   ```bash
   git add .
   git commit -m "Migrate to Cloudflare MCP proxy for DataForSEO API"
   git push origin main
   ```

2. **Supabase will auto-deploy**
   - Check your Supabase dashboard for the deployment status
   - Usually takes 1-2 minutes

## What to Expect After Deployment

### Successful Deployment Signs:

1. **In Supabase Edge Function Logs**, you should see:
   ```
   📡 Calling DataForSEO: /v3/dataforseo_labs/google/competitors_domain/live
   🔍 Identifying competitors via proxy server...
   ✅ Found X competitors: [domains]
   ```

2. **In Cloudflare Worker Logs**, you should see:
   - Incoming requests from Supabase edge functions
   - Successful DataForSEO API responses
   - No 401/403 authentication errors

### If You See Errors:

#### "Invalid request format" (400)
- The request to Cloudflare Worker isn't formatted correctly
- Check the payload structure in dataforseo-mcp.ts

#### "Unauthorized" (401)
- DataForSEO credentials not set in Cloudflare Worker
- Verify secrets in Cloudflare Worker environment variables

#### "Rate limit exceeded" (429)
- Too many requests to DataForSEO
- Check your DataForSEO account limits

## Testing the Deployment

### 1. Test the Cloudflare Worker directly:

```bash
node test-mcp-server.js
```

Expected output:
```
🚀 Testing DataForSEO MCP Server
✅ Health check: { status: 'healthy', ... }
```

### 2. Trigger a Test Workflow:

1. Go to your dashboard: https://bi-dashboard-report.pages.dev
2. Complete the onboarding form with test data
3. Monitor the logs in Supabase Dashboard > Edge Functions
4. Check for new report in the dashboard

### 3. Check the Report Data:

```sql
-- Run this in Supabase SQL Editor
SELECT 
  id,
  created_at,
  status,
  metadata
FROM workflow_runs
ORDER BY created_at DESC
LIMIT 5;
```

Look for:
- `status = 'completed'` 
- Recent timestamps
- No error messages in metadata

## Rollback Instructions

If something goes wrong, you can quickly rollback:

1. **Revert the import in workflow-orchestrator.ts**:
   ```typescript
   // Change this line back to:
   import { /* ... */ } from './integrations/dataforseo.ts';
   ```

2. **Redeploy**:
   ```bash
   supabase functions deploy workflow-orchestrator
   ```

## Environment Variables

Make sure these are set in your Supabase project:

### Required for LLM (AI insights):
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`

### NOT Required (handled by Cloudflare Worker):
- ~~`DATAFORSEO_LOGIN`~~
- ~~`DATAFORSEO_PASSWORD`~~
- ~~`DATAFORSEO_BASE64`~~

## Monitoring

### Supabase Edge Function Logs
```
# View logs in terminal
supabase functions logs workflow-orchestrator --project-ref niwvvqczjimfnggbussr
```

Or view in dashboard: https://supabase.com/dashboard/project/niwvvqczjimfnggbussr/logs/edge-functions

### Cloudflare Worker Logs
1. Go to Cloudflare Dashboard
2. Navigate to Workers & Pages
3. Click on your MCP worker
4. View logs in real-time

## Success Checklist

- [ ] Code changes committed
- [ ] Edge function deployed
- [ ] Test workflow triggered
- [ ] Report generated successfully
- [ ] AI insights visible in report
- [ ] No API errors in logs
- [ ] DataForSEO costs reasonable

## Need Help?

If you encounter issues:

1. **Check logs first**: Most issues are visible in logs
2. **Verify Cloudflare Worker**: Test with `test-mcp-server.js`
3. **Test credentials**: Ensure DataForSEO keys work in Cloudflare
4. **Rollback if needed**: Use the rollback instructions above

## Next Steps After Successful Deployment

1. Monitor for 24 hours to ensure stability
2. Check DataForSEO usage/costs
3. Optimize API calls if needed (reduce limits, add caching)
4. Consider adding more endpoints if needed
5. Update documentation with any learnings
