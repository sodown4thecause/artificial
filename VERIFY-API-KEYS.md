# Verify API Keys - Empty Report Fix

## 🔴 Problem
Report is showing on dashboard but it's empty - no AI-generated content. This means the workflow ran but API calls failed.

## ✅ Solution: Check API Keys in Supabase

### Step 1: Access Supabase Edge Function Settings

1. Go to **Supabase Dashboard**: https://app.supabase.com
2. Select your project
3. Navigate to **Edge Functions** (in left sidebar)
4. Click on **run-intelligence-workflow**
5. Click **Settings** tab
6. Scroll to **Secrets** section

### Step 2: Verify These API Keys Exist

Check each of these environment variables. **ALL** must be present:

#### Required Core Keys:
- [ ] `SUPABASE_URL` - Your Supabase project URL
- [ ] `SERVICE_ROLE_KEY` - Supabase service role key (from Settings → API)
- [ ] `CLERK_SECRET_KEY` - From Clerk dashboard

#### Required Integration Keys:

**DataForSEO (Most Critical - Used for competitor analysis, keywords, SERP):**
- [ ] `DATAFORSEO_LOGIN` - Your DataForSEO username
- [ ] `DATAFORSEO_PASSWORD` - Your DataForSEO password

**AI/LLM (Required for report generation):**
- [ ] `OPENAI_API_KEY` - OpenAI API key
  OR
- [ ] `ANTHROPIC_API_KEY` - Anthropic API key (alternative to OpenAI)

**Other Integrations (Optional but recommended):**
- [ ] `FIRECRAWL_API_KEY` - For site crawling
- [ ] `PAGESPEED_API_KEY` - For Core Web Vitals
- [ ] `VOILANORBERT_API_KEY` - For contact enrichment
- [ ] `CUSTOM_SEARCH_API_KEY` - Google Custom Search
- [ ] `CUSTOM_SEARCH_ENGINE_ID` - Google CSE ID

### Step 3: Check Which Keys Are Missing

Run this in Supabase SQL Editor with your user ID:

```sql
-- Replace <YOUR_USER_ID> with your Clerk user ID
-- This shows which API data is missing from your reports

SELECT 
    'API CALL SUMMARY' as check_name,
    CASE WHEN (SELECT COUNT(*) FROM serp_results sr JOIN workflow_runs w ON sr.workflow_id = w.id WHERE w.user_id = '<YOUR_USER_ID>') > 0 THEN '✅ DataForSEO' ELSE '❌ DataForSEO (CRITICAL)' END as dataforseo,
    CASE WHEN (SELECT COUNT(*) FROM keyword_metrics km JOIN workflow_runs w ON km.workflow_id = w.id WHERE w.user_id = '<YOUR_USER_ID>') > 0 THEN '✅ Keywords' ELSE '❌ Keywords' END as keywords,
    CASE WHEN (SELECT COUNT(*) FROM backlink_metrics bm JOIN workflow_runs w ON bm.workflow_id = w.id WHERE w.user_id = '<YOUR_USER_ID>') > 0 THEN '✅ Backlinks' ELSE '❌ Backlinks' END as backlinks,
    CASE WHEN (SELECT COUNT(*) FROM ai_insights ai JOIN workflow_runs w ON ai.workflow_id = w.id WHERE w.user_id = '<YOUR_USER_ID>') > 0 THEN '✅ AI/LLM' ELSE '❌ AI/LLM (CRITICAL)' END as llm;
```

### Step 4: Get Missing API Keys

#### DataForSEO
1. Sign up at https://dataforseo.com/
2. Go to **Dashboard** → **API Access**
3. Copy your **Login** and **Password**
4. Add to Supabase as:
   - `DATAFORSEO_LOGIN` = your login
   - `DATAFORSEO_PASSWORD` = your password

#### OpenAI (Recommended)
1. Go to https://platform.openai.com/api-keys
2. Click **Create new secret key**
3. Copy the key (starts with `sk-`)
4. Add to Supabase as: `OPENAI_API_KEY`

#### Alternative: Anthropic
1. Go to https://console.anthropic.com/settings/keys
2. Click **Create Key**
3. Copy the key
4. Add to Supabase as: `ANTHROPIC_API_KEY`

#### Firecrawl (Optional)
1. Go to https://firecrawl.dev/
2. Sign up and get API key
3. Add to Supabase as: `FIRECRAWL_API_KEY`

#### PageSpeed (Optional but Recommended)
1. Go to https://console.cloud.google.com/apis/credentials
2. Create API key
3. Enable PageSpeed Insights API
4. Add to Supabase as: `PAGESPEED_API_KEY`

### Step 5: Add Keys to Supabase

1. In **Edge Functions** → **run-intelligence-workflow** → **Settings** → **Secrets**
2. Click **Add Secret**
3. Enter **Name** (e.g., `DATAFORSEO_LOGIN`)
4. Enter **Value** (your API key)
5. Click **Save**
6. Repeat for each missing key

### Step 6: Redeploy Edge Function (Important!)

After adding secrets, you must redeploy:

**Option A: Via Supabase Dashboard**
1. Go to Edge Functions → run-intelligence-workflow
2. Click **Deploy** button
3. Wait for deployment to complete

**Option B: Via CLI**
```bash
cd C:\Users\User\Documents\New folder\BI-Dashboard
supabase functions deploy run-intelligence-workflow
```

### Step 7: Test with New Report

1. Reset your rate limit (if needed):
   ```sql
   DELETE FROM daily_report_limits 
   WHERE user_id = '<YOUR_USER_ID>' 
   AND report_date = CURRENT_DATE;
   ```

2. Go to `/onboarding` and submit again
3. Wait 2-5 minutes for workflow to complete
4. Check dashboard - report should now have content!

---

## 🔍 Quick Diagnostic

### Check Supabase Edge Function Logs

1. Go to **Supabase Dashboard**
2. **Edge Functions** → **run-intelligence-workflow**
3. Click **Logs** tab
4. Look for recent errors

**Common error messages:**

| Error Message | Missing Key | Solution |
|--------------|-------------|----------|
| `401 Unauthorized` (DataForSEO) | DATAFORSEO_LOGIN or DATAFORSEO_PASSWORD | Add DataForSEO credentials |
| `Authentication failed` (OpenAI) | OPENAI_API_KEY | Add OpenAI API key |
| `Invalid API key` | Any integration key | Verify key is correct |
| `ECONNREFUSED` | Network issue | Check if API service is down |

### Most Likely Issue

If report is completely empty, you're probably missing:

1. **DataForSEO credentials** (LOGIN + PASSWORD) - Provides 90% of the data
2. **OpenAI or Anthropic API key** - Generates the AI insights and summary

These two integrations are CRITICAL. The others are optional enhancements.

---

## 💰 API Costs (For Reference)

- **DataForSEO**: ~$0.50-$2 per report (competitor analysis, keywords, SERP)
- **OpenAI**: ~$0.10-$0.50 per report (GPT-4o for insights)
- **Anthropic**: ~$0.15-$0.60 per report (Claude for insights)
- **Firecrawl**: ~$0.01-$0.05 per report
- **PageSpeed**: Free (Google API)

**Total per report: ~$0.60-$2.50**

---

## ✅ Verification Checklist

After adding keys and redeploying:

- [ ] Added all required API keys to Supabase Edge Function secrets
- [ ] Redeployed the edge function
- [ ] Reset rate limit (if needed)
- [ ] Triggered new workflow from /onboarding
- [ ] Waited 2-5 minutes for completion
- [ ] Checked dashboard - report has content!
- [ ] Ran `check-empty-report.sql` - shows ✅ for all API calls

---

## 🆘 Still Empty After Adding Keys?

1. **Check Edge Function logs** for specific error messages
2. **Verify keys are valid** by testing them directly:
   ```bash
   # Test DataForSEO
   curl -u "LOGIN:PASSWORD" https://api.dataforseo.com/v3/appendix/user_data
   
   # Test OpenAI
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer YOUR_KEY"
   ```

3. **Check workflow metadata** for error details:
   ```sql
   SELECT metadata 
   FROM workflow_runs 
   WHERE user_id = '<YOUR_USER_ID>' 
   ORDER BY triggered_at DESC 
   LIMIT 1;
   ```

4. **Try the enhanced workflow orchestrator** from `workflow-orchestrator-enhanced.ts` - it has better error handling
