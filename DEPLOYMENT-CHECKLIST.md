# 🚀 Deployment Checklist

## Pre-Deployment (Already Done ✅)
- [x] Created MCP integration file
- [x] Updated workflow orchestrator
- [x] Verified Cloudflare Worker is running
- [x] Created documentation

## Deployment Steps (Your Turn)

### Step 1: Test Cloudflare Worker
```bash
node test-mcp-server.js
```
**Expected**: Health check passes, shows "healthy" status
- [ ] Health check successful

### Step 2: Commit Changes (if using Git)
```bash
git add .
git commit -m "Migrate to Cloudflare MCP proxy for DataForSEO"
git push origin main
```
- [ ] Changes committed and pushed

### Step 3: Deploy to Supabase

**Option A - Via GitHub Auto-Deploy:**
- [ ] Wait 1-2 minutes for Supabase to auto-deploy
- [ ] Check deployment status in Supabase dashboard

**Option B - Via Supabase Dashboard:**
- [ ] Go to https://supabase.com/dashboard/project/niwvvqczjimfnggbussr
- [ ] Click "Edge Functions" → "workflow-orchestrator"
- [ ] Click "Deploy new version"
- [ ] Verify deployment succeeded

**Option C - Via CLI:**
```bash
supabase functions deploy workflow-orchestrator --project-ref niwvvqczjimfnggbussr
```
- [ ] Deployment successful

### Step 4: Verify Deployment
- [ ] Go to Supabase Edge Function logs
- [ ] Look for recent deployment timestamp
- [ ] No errors in deployment logs

### Step 5: Test with Real Workflow
1. Go to https://bi-dashboard-report.pages.dev
2. Clear any existing data (or use new test account)
3. Complete onboarding form with test data:
   - Name: Test User
   - Website: https://example.com
   - Industry: SEO Tools
   - Location: United States
4. Submit and wait for report generation

- [ ] Onboarding completed
- [ ] Workflow triggered
- [ ] Report generated successfully

### Step 6: Verify Report Data
Check the dashboard shows:
- [ ] Competitor domains (not X)
- [ ] Keyword metrics with search volumes
- [ ] SERP rankings
- [ ] Share of voice data
- [ ] AI-generated insights (if LLM key is set)

### Step 7: Check Logs

**Supabase Logs:**
- [ ] Go to https://supabase.com/dashboard/project/niwvvqczjimfnggbussr/logs/edge-functions
- [ ] See messages like "📡 Calling DataForSEO"
- [ ] See "✅ Found X competitors"
- [ ] No error messages

**Cloudflare Worker Logs:**
- [ ] Go to Cloudflare Dashboard → Workers & Pages
- [ ] Select your MCP worker
- [ ] See incoming requests from Supabase
- [ ] See successful DataForSEO API responses (200 status)

### Step 8: Verify Costs
- [ ] Check DataForSEO account balance
- [ ] Verify API usage is reasonable
- [ ] Confirm costs are within expected range

## Post-Deployment (Next 24 Hours)

### Monitor
- [ ] Check logs periodically for errors
- [ ] Trigger 2-3 more test workflows
- [ ] Verify consistent success rate

### Optimize (Optional)
- [ ] Review API call counts in logs
- [ ] Consider adding caching if needed
- [ ] Adjust rate limits if necessary

## Success Criteria

✅ Workflow completes without errors
✅ Report shows real data (no X marks)
✅ Competitors identified correctly
✅ Keywords have search volume data
✅ SERP rankings visible
✅ AI insights generated (if configured)
✅ No authentication errors in logs
✅ DataForSEO API calls succeed

## If Something Goes Wrong

### Rollback Steps:
1. Edit `supabase/functions/lib/workflow-orchestrator.ts`
2. Change line 15 from:
   ```typescript
   } from './integrations/dataforseo-mcp.ts';
   ```
   to:
   ```typescript
   } from './integrations/dataforseo.ts';
   ```
3. Redeploy the function
4. Investigate the issue

### Common Issues:

**"Invalid request format" error:**
- Check Cloudflare Worker logs
- Verify request payload structure
- See `DEPLOY-MCP-INTEGRATION.md` for details

**"Unauthorized" error:**
- Check DataForSEO credentials in Cloudflare Worker
- Verify secrets are properly set
- Test credentials directly with DataForSEO API

**No data in report:**
- Check Supabase Edge Function logs for errors
- Verify Cloudflare Worker is accessible
- Run `node test-mcp-server.js` to verify

**Timeout errors:**
- API calls may be taking too long
- Consider reducing limits in integration file
- Check DataForSEO API status

## Completion

Once all checkboxes are complete and success criteria met:
- [ ] Migration successful ✅
- [ ] System stable and working
- [ ] Documentation updated with any notes
- [ ] Ready for production use

---

**Need Help?** Check:
- `MCP-INTEGRATION-SUMMARY.md` for overview
- `DEPLOY-MCP-INTEGRATION.md` for detailed instructions
- `CLOUDFLARE-MCP-MIGRATION.md` for technical details
