# Deploy Your Updated Intelligence Workflow

Your workflow functions are ready with the corrected API integrations. Here's how to deploy them:

## 🎯 Functions to Deploy

You have updated these critical functions:

### **Main Workflow Functions:**
1. `run-intelligence-workflow` - ✅ Already exists, needs update
2. `reports-latest` - ✅ Already exists  
3. `run-weekly` - ✅ Already exists

### **New Testing & Monitoring Functions:**
4. `test-workflow` - 🆕 New comprehensive API testing
5. `monitor-workflow` - 🆕 New system health monitoring
6. `test-single-workflow` - 🆕 New individual workflow testing

## 🚀 Deployment Options

### **Option 1: Supabase Dashboard (Recommended)**

1. Go to https://supabase.com → Your Project → Edge Functions
2. Update existing functions with the corrected code:

**Update `run-intelligence-workflow`:**
- Copy the corrected integrations from `supabase/functions/lib/integrations/`
- Key updates: Perplexity model `sonar`, Firecrawl v2 API with `urls` array

**Deploy new monitoring functions:**
- Add `test-workflow` function for comprehensive testing
- Add `monitor-workflow` function for health monitoring

### **Option 2: Manual File Upload**

Since CLI installation failed, you can manually copy the function files:

1. Zip each function directory:
   - `supabase/functions/test-workflow/` → `test-workflow.zip`
   - `supabase/functions/monitor-workflow/` → `monitor-workflow.zip`
   - `supabase/functions/test-single-workflow/` → `test-single-workflow.zip`

2. Upload via Supabase Dashboard → Edge Functions → Create Function

### **Option 3: Git-based Deployment**

If you have GitHub integration:
1. Commit your updated functions
2. Enable GitHub integration in Supabase
3. Auto-deploy on push

## 🔧 Key Updates Made

### **Fixed API Integrations:**

**Perplexity AI (Fixed):**
```typescript
// OLD (broken)
model: 'llama-3.1-sonar-small-128k-online'
endpoint: '/inference'

// NEW (working) ✅
model: 'sonar'
endpoint: '/chat/completions'
```

**Firecrawl (Fixed):**
```typescript
// OLD (v1, broken)
endpoint: 'https://api.firecrawl.dev/v1/crawl'
body: { url: 'https://example.com', depth: 1 }

// NEW (v2, working) ✅  
endpoint: 'https://api.firecrawl.dev/v2/extract'
body: { 
  urls: ['https://example.com'],
  enableWebSearch: false,
  scrapeOptions: { storeInCache: true }
}
```

## 📊 Environment Variables Ready

Your `.env` file is properly configured with:
- ✅ DataForSEO credentials
- ✅ Anthropic API key  
- ✅ Perplexity API key
- ✅ Firecrawl API key
- ✅ All other API keys

## 🎯 Post-Deployment Testing

After deploying, test your functions:

```bash
# Test API health (no credits used)
curl "YOUR_SUPABASE_URL/functions/v1/monitor-workflow" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"

# Test workflow with dry run
curl -X POST "YOUR_SUPABASE_URL/functions/v1/test-single-workflow" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"websiteUrl": "https://example.com", "dryRun": true}'

# Run actual intelligence workflow
curl -X POST "YOUR_SUPABASE_URL/functions/v1/run-intelligence-workflow" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "websiteUrl": "https://example.com", 
    "industry": "technology",
    "location": "United States"
  }'
```

## ⚡ Quick Deploy Checklist

1. ✅ API integrations corrected (Perplexity, Firecrawl)
2. ✅ Environment variables configured  
3. ⏳ Deploy functions to Supabase
4. ⏳ Test deployed functions
5. ⏳ Run first intelligence report

Your workflow is ready to generate comprehensive competitive intelligence reports with 4 active APIs! 🎉
