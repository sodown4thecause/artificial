# 🔍 Monitor Your Intelligence Report Workflow

Your workflow has started! Here's how to track its progress.

## Current Workflow

**Workflow ID**: `7b39b30f-d208-450b-9461-d55d5c5c1d9d`  
**Status**: Queued → Running  
**Expected Time**: 2-3 minutes

## 📊 What's Happening Now

Your AI-powered intelligence gathering is:

1. **📡 Calling DataForSEO via Cloudflare Worker**
   - Identifying competitor domains
   - Collecting keyword data
   - Analyzing SERP rankings

2. **🔍 Scraping with Jina AI**
   - Extracting competitor content
   - Analyzing page structures

3. **⚡ Running PageSpeed Insights**
   - Core Web Vitals
   - Performance metrics

4. **🔮 Generating Market Intelligence with Perplexity**
   - Industry trends
   - Competitive landscape
   - Market opportunities

5. **🤖 Creating Structured Report with Anthropic Claude**
   - Synthesizing all data
   - Generating insights
   - Formatting recommendations

## 🔍 Monitor Progress

### Option 1: Via Supabase Dashboard (Recommended)

**View Logs**:
https://supabase.com/dashboard/project/efynkraanhjwfjetnccp/logs/edge-functions

Look for logs from `run-intelligence-workflow`

**What to Look For**:
```
✅ 📡 Calling DataForSEO via Cloudflare Worker...
✅ Found X competitors
✅ Fetched X keyword metrics
✅ Fetched X SERP results
✅ 🤖 Generating insights with Anthropic Claude...
✅ Report generated successfully
```

### Option 2: Via Database

Run the SQL queries in `check-workflow.sql` in the Supabase SQL Editor:
https://supabase.com/dashboard/project/efynkraanhjwfjetnccp/editor

### Option 3: Watch Your Dashboard

Refresh your dashboard every 30 seconds:
https://bi-dashboard-report.pages.dev

The report should appear automatically when complete!

## ⏱️ Timeline

| Time | What's Happening |
|------|------------------|
| 0:00 | Workflow queued |
| 0:10 | Identifying competitors (DataForSEO) |
| 0:30 | Fetching SERP data |
| 0:45 | Analyzing keywords |
| 1:00 | Scraping competitor sites (Jina AI) |
| 1:15 | Running PageSpeed analysis |
| 1:30 | Generating market intelligence (Perplexity) |
| 2:00 | Creating final report (Claude) |
| 2:30 | ✅ Complete! Report appears in dashboard |

## 🎯 Success Indicators

When the workflow completes, you should see:

### In the Dashboard
- ✅ Report appears automatically
- ✅ Competitor domains listed (not "X")
- ✅ Keyword data with search volumes
- ✅ SERP rankings with positions
- ✅ AI-generated insights section
- ✅ Market analysis from Perplexity
- ✅ Technical scores from PageSpeed
- ✅ Actionable recommendations

### In the Logs
```
✅ Workflow completed successfully
✅ DataForSEO API calls: All successful
✅ LLM API calls: Claude and Perplexity working
✅ Report saved to database
```

### In the Database
```sql
-- Workflow status = 'completed'
-- SERP results > 0
-- Keyword metrics > 0
-- Business profiles > 0
-- Intelligence report created
```

## ⚠️ Troubleshooting

### If Workflow Takes >5 Minutes

**Check for errors in logs**:
1. Go to Supabase Dashboard → Functions → Logs
2. Look for red error messages
3. Common issues:
   - API timeout
   - Rate limit exceeded
   - Invalid credentials

**Check workflow status**:
```sql
SELECT status, metadata 
FROM workflow_runs 
WHERE id = '7b39b30f-d208-450b-9461-d55d5c5c1d9d';
```

### If Report Shows Empty Data

**Verify API calls succeeded**:
```sql
-- Check if data was collected
SELECT 
    (SELECT COUNT(*) FROM serp_results WHERE workflow_id = '7b39b30f-d208-450b-9461-d55d5c5c1d9d') as serp,
    (SELECT COUNT(*) FROM keyword_metrics WHERE workflow_id = '7b39b30f-d208-450b-9461-d55d5c5c1d9d') as keywords,
    (SELECT COUNT(*) FROM business_profiles WHERE workflow_id = '7b39b30f-d208-450b-9461-d55d5c5c1d9d') as profiles;
```

### If No AI Insights Appear

**Check LLM API logs**:
- Look for "Anthropic Claude" or "Perplexity" in logs
- Verify no 401/403 errors
- Check API keys are set in Supabase Secrets

## 📈 What You'll Get

Your complete intelligence report will include:

### 1. Executive Summary
- Industry overview
- Key findings
- Opportunity score

### 2. Competitive Analysis
- 5 identified competitors
- Their keyword strategies
- SERP positioning
- Market share insights

### 3. Keyword Intelligence
- 20+ keywords with metrics
- Search volumes
- CPC data
- Keyword difficulty
- Opportunity keywords

### 4. Market Analysis (Perplexity AI)
- Current industry trends
- Market dynamics
- Competitive landscape
- Growth opportunities

### 5. Technical Analysis (PageSpeed)
- Core Web Vitals
- Performance scores
- Technical recommendations

### 6. Strategic Recommendations (Claude)
- 5-10 actionable items
- Prioritized by impact
- Implementation guidance

## 🎊 Success!

When you see your complete report with all sections filled out and AI-generated insights, your system is working perfectly!

---

**Current Status**: Workflow Running ⏳  
**Next Check**: Refresh dashboard in 2-3 minutes ✅
