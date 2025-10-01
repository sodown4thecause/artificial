# API Failure Analysis & Report Display Issues

## 🔍 Summary of Investigation

After reviewing your workflow orchestrator, edge functions, and frontend code, I've identified several potential failure points that could prevent your intelligence report from displaying on the dashboard.

---

## 📊 Complete API Integration Chain

### Workflow APIs (12 Total Integrations)

Your `run-intelligence-workflow` edge function orchestrates these API calls:

1. **DataForSEO APIs** (Multiple endpoints)
   - Competitor identification
   - Enhanced SERP results
   - Competitor keywords analysis
   - Competitor backlinks
   - Keyword metrics
   - SERP history
   - Competitor insights

2. **Content Analysis API** - Content sentiment

3. **Firecrawl API** - Site crawling and content extraction

4. **Domain Analytics API** - Domain authority, traffic estimates

5. **Backlinks API** - Backlink profile

6. **On-Page SEO API** - Technical SEO audit

7. **PageSpeed Insights API** - Core web vitals

8. **Business Data API** - Firmographics

9. **Custom Search API** - News and mentions

10. **VoilaNorbert API** - Contact enrichment

11. **LLM API** - AI-generated insights

12. **Make.com Webhook** - Backlink monitoring (frontend only)

---

## 🚨 Common Failure Points

### 1. **API Keys Missing or Invalid**

**Location:** Supabase Edge Function Environment Variables

**Critical Keys Required:**
```bash
# DataForSEO
DATAFORSEO_LOGIN=your_login
DATAFORSEO_PASSWORD=your_password

# Firecrawl
FIRECRAWL_API_KEY=your_key

# PageSpeed
PAGESPEED_API_KEY=your_key

# VoilaNorbert
VOILANORBERT_API_KEY=your_key

# Custom Search
CUSTOM_SEARCH_API_KEY=your_key
CUSTOM_SEARCH_ENGINE_ID=your_id

# LLM (OpenAI/Anthropic)
OPENAI_API_KEY=your_key
# OR
ANTHROPIC_API_KEY=your_key

# Clerk
CLERK_SECRET_KEY=your_secret
CLERK_PUBLISHABLE_KEY=your_key

# Supabase
SUPABASE_URL=your_url
SERVICE_ROLE_KEY=your_service_role_key
```

**Check:** Navigate to Supabase Dashboard → Edge Functions → Secrets

---

### 2. **Rate Limits & API Quotas**

**DataForSEO Rate Limits:**
- Most free tiers: 20 requests/hour
- Can easily exceed during workflow execution

**Solution:** Check DataForSEO API credits:
```bash
curl -u "login:password" https://api.dataforseo.com/v3/appendix/user_data
```

---

### 3. **Workflow Execution Timeout**

**Problem:** Edge functions have a maximum execution time (default: 150 seconds)

**Current Workflow:** Makes 12+ API calls sequentially, which can easily exceed timeout

**Evidence in Code:**
```typescript
// workflow-orchestrator.ts line 109
queueMicrotask(() => runWorkflow(supabase, context).catch((err) => {
  console.error('Workflow failure', err);
}));
```

**Issue:** Errors are logged but NOT persisted to database

**Fix:** Add error persistence:
```typescript
queueMicrotask(() => runWorkflow(supabase, context).catch(async (err) => {
  console.error('Workflow failure', err);
  await supabase
    .from('workflow_runs')
    .update({ 
      status: 'failed', 
      metadata: { 
        error: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      } 
    })
    .eq('id', context.workflowId);
}));
```

---

### 4. **Database Insert Failures**

**Potential Issues:**

a) **Missing or incorrect data structure:**
```typescript
// Line 195-204 in workflow-orchestrator.ts
await supabase.from('business_profiles').insert({
  workflow_id: context.workflowId,
  domain: 'competitive_analysis',
  firmographics: {
    competitors,
    competitor_keywords: competitorKeywordAnalysis,
    competitor_backlinks: competitorBacklinks,
    competitive_insights: competitiveInsights
  }
});
```

**Problem:** If `competitorBacklinks` is undefined, insert may fail silently

b) **JSONB validation errors** - Check database constraints

---

### 5. **Authentication Issues**

**Frontend → Edge Function Authentication Flow:**

```typescript
// OnboardingPage.tsx line 35-51
const token = await getToken();
const apiUrl = `${supabaseUrl}/functions/v1/run-intelligence-workflow`;
const response = await fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  // ...
});
```

**reports-latest Edge Function:**
```typescript
// Line 49: Uses getClerkUser() helper
const clerkResult = await getClerkUser(request);
```

**Potential Issue:** Clerk session token might be expired or invalid

---

### 6. **Report Payload Format Mismatch**

**Frontend expects:**
```typescript
{
  summary: {
    captured_at: string;
    executive_summary: string;
    recommendations: Array<{
      title: string;
      description: string;
      confidence: number;
    }>;
  },
  serpTimeline: Array<SerpTimelinePoint>,
  keywordOpportunities: Array<KeywordOpportunity>,
  sentiment: Array<SentimentMetric>,
  backlinks: Array<BacklinkMetric>,
  coreWebVitals: Array<CoreWebVitalMetric>,
  techStack: Array<TechStackEntry>
}
```

**LLM API generates:**
```typescript
// Line 206-225 in workflow-orchestrator.ts
const insights = await generateInsights({
  context,
  serpResults,
  // ... many fields
});

// Line 233-236
await supabase.from('reports').insert({
  workflow_id: context.workflowId,
  payload: insights.reportPayload  // <- Must match expected format
});
```

**Check:** The `generateInsights()` function in `lib/integrations/llm.ts`

---

## 🛠️ Debugging Steps

### Step 1: Check Supabase Edge Function Logs

```bash
# SSH into your Supabase project or use Dashboard
# Navigate to: Edge Functions → run-intelligence-workflow → Logs

# Look for:
# - "Workflow failure" messages
# - API timeout errors
# - "Failed to fetch" errors
# - Authentication errors
# - Database insert errors
```

### Step 2: Run SQL Diagnostics

Use the `check-workflow-status.sql` script I created earlier:

1. Open Supabase SQL Editor
2. Replace `<USER_ID>` with your Clerk user ID
3. Run all queries
4. Check results for:
   - Workflow status = 'failed' or 'running' for > 30 minutes
   - Missing reports
   - Rate limit exceeded

### Step 3: Test Individual API Endpoints

Create test files in `supabase/functions/test-workflow/tests/`:

**Test DataForSEO:**
```typescript
// test-dataforseo-single.ts
import { identifyCompetitors } from '../../lib/integrations/dataforseo.ts';

const context = {
  websiteUrl: 'example.com',
  industry: 'Technology',
  location: 'United States'
};

const competitors = await identifyCompetitors(context);
console.log('Competitors found:', competitors);
```

Run:
```bash
deno run --allow-net --allow-env test-dataforseo-single.ts
```

### Step 4: Check Frontend Network Tab

1. Open browser DevTools → Network tab
2. Navigate to `/dashboard`
3. Look for request to `reports-latest`
4. Check:
   - Status code (200, 202, 404, 401, 500?)
   - Response body
   - Request headers (Authorization present?)

### Step 5: Test Workflow Trigger Manually

```bash
# Get your Clerk token from browser
# DevTools → Application → Cookies → __session

# Test workflow endpoint
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/run-intelligence-workflow \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "websiteUrl": "example.com",
    "industry": "Technology",
    "location": "United States"
  }'
```

---

## ✅ Recommended Fixes

### Fix 1: Add Comprehensive Error Logging

**File:** `supabase/functions/lib/workflow-orchestrator.ts`

```typescript
// Replace line 109-111
queueMicrotask(() => runWorkflow(supabase, context).catch(async (err) => {
  console.error('=== WORKFLOW EXECUTION FAILED ===');
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  console.error('Workflow ID:', context.workflowId);
  console.error('User ID:', context.userId);
  console.error('Website:', context.websiteUrl);
  
  // Persist error to database
  try {
    await supabase
      .from('workflow_runs')
      .update({ 
        status: 'failed', 
        metadata: { 
          error: err.message,
          error_stack: err.stack,
          error_name: err.name,
          failed_at: new Date().toISOString(),
          context: {
            websiteUrl: context.websiteUrl,
            industry: context.industry,
            location: context.location
          }
        } 
      })
      .eq('id', context.workflowId);
  } catch (updateError) {
    console.error('Failed to update workflow status:', updateError);
  }
}));
```

### Fix 2: Add API Call Retry Logic

**File:** `supabase/functions/lib/integrations/dataforseo.ts` (and others)

```typescript
async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  maxRetries = 3
): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.ok) return response;
      
      // Retry on rate limit or server errors
      if (response.status === 429 || response.status >= 500) {
        const delay = Math.min(1000 * Math.pow(2, i), 10000);
        console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Don't retry on client errors
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = Math.min(1000 * Math.pow(2, i), 10000);
      console.log(`Network error, retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

### Fix 3: Add Timeout Protection

**File:** `supabase/functions/lib/workflow-orchestrator.ts`

```typescript
async function runWorkflow(supabase: SupabaseClient, context: WorkflowContext) {
  const WORKFLOW_TIMEOUT = 120000; // 2 minutes
  
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Workflow timeout exceeded')), WORKFLOW_TIMEOUT);
  });
  
  try {
    await Promise.race([
      executeWorkflowSteps(supabase, context),
      timeoutPromise
    ]);
  } catch (error) {
    console.error('Workflow execution error', error);
    await supabase
      .from('workflow_runs')
      .update({ 
        status: 'failed', 
        metadata: { 
          error: String(error),
          is_timeout: error.message?.includes('timeout')
        } 
      })
      .eq('id', context.workflowId);
  }
}

async function executeWorkflowSteps(supabase: SupabaseClient, context: WorkflowContext) {
  await supabase
    .from('workflow_runs')
    .update({ status: 'running', metadata: { started_at: new Date().toISOString() } })
    .eq('id', context.workflowId);

  // All existing workflow steps...
  // (rest of current runWorkflow implementation)
}
```

### Fix 4: Add Frontend Loading States

**File:** `frontend/src/pages/dashboard/Report.tsx`

Already implemented well! Just ensure error messages are clear:

```typescript
// Line 337-339 - Improve error message
{error?.includes('<!doctype') || error?.includes('Unexpected token') 
  ? "You haven't completed the onboarding workflow yet. The report generation may have failed or is still in progress."
  : `Unable to load report: ${error}`}
```

### Fix 5: Create Monitoring Dashboard Query

**New File:** `check-api-health.sql`

```sql
-- Check recent workflow failures
SELECT 
  wr.id,
  wr.user_id,
  wr.website_url,
  wr.status,
  wr.triggered_at,
  wr.completed_at,
  EXTRACT(EPOCH FROM (COALESCE(completed_at, NOW()) - triggered_at))/60 as duration_minutes,
  wr.metadata->>'error' as error_message,
  wr.metadata->>'error_stack' as error_stack
FROM workflow_runs wr
WHERE wr.status = 'failed'
  OR (wr.status IN ('queued', 'running') AND wr.triggered_at < NOW() - INTERVAL '30 minutes')
ORDER BY wr.triggered_at DESC
LIMIT 20;

-- Check which API steps are failing most
SELECT 
  wr.metadata->>'error' as error_type,
  COUNT(*) as occurrence_count,
  MAX(wr.triggered_at) as last_occurred
FROM workflow_runs wr
WHERE wr.status = 'failed'
  AND wr.triggered_at > NOW() - INTERVAL '7 days'
GROUP BY wr.metadata->>'error'
ORDER BY occurrence_count DESC;
```

---

## 🎯 Next Steps

### Immediate Actions:

1. **Check Supabase Edge Function Logs** for the `run-intelligence-workflow` function
   - Look for red error messages
   - Check for "Workflow failure" logs
   - Note which API is failing

2. **Run the SQL diagnostic script** (`check-workflow-status.sql`)
   - Replace `<USER_ID>` with your actual Clerk user ID
   - Identify stuck or failed workflows

3. **Verify API Keys** in Supabase Edge Function environment variables
   - Especially DataForSEO credentials
   - OpenAI/Anthropic API key for LLM

4. **Check API credits/quotas**
   - DataForSEO free tier limits
   - OpenAI/Anthropic usage

5. **Test the workflow endpoint** manually with curl (see Step 5 above)

### If Workflow is Stuck:

```sql
-- Mark stuck workflows as failed
UPDATE workflow_runs 
SET status = 'failed', 
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb), 
      '{error}', 
      '"Manually failed - stuck for > 30 minutes"'
    )
WHERE user_id = '<YOUR_USER_ID>' 
  AND status IN ('queued', 'running')
  AND triggered_at < NOW() - INTERVAL '30 minutes';

-- Then trigger a new workflow from the frontend
```

### Long-term Improvements:

1. **Implement the retry logic** (Fix 2)
2. **Add comprehensive error logging** (Fix 1)
3. **Set up workflow timeout protection** (Fix 3)
4. **Create a monitoring dashboard** showing workflow success rates
5. **Add health check endpoint** for each API integration
6. **Implement graceful degradation** - If one API fails, continue with others

---

## 📞 Getting Help

If you need specific help:

1. **Share Supabase logs** - Copy error messages from Edge Function logs
2. **Share SQL diagnostic results** - Run the diagnostic script and share output
3. **Check browser console** - Any errors when loading `/dashboard`?
4. **Check Network tab** - What's the response from `reports-latest`?

Would you like me to:
- Create automated test scripts for each API integration?
- Build a monitoring dashboard component?
- Add Sentry/LogRocket integration for error tracking?
- Create a "manual report generation" admin tool?
