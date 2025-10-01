# Migration to Cloudflare MCP Proxy Server

## Overview
This document describes the migration from direct DataForSEO API calls to using your existing Cloudflare Worker MCP proxy server.

## Cloudflare Worker Details
- **URL**: https://bi-dashboard-mcp-server.liam-wilson1990.workers.dev
- **Endpoint**: `POST /mcp`
- **Health Check**: `GET /health`

## Supported DataForSEO Modules

Your Cloudflare Worker supports the following DataForSEO API modules:

✅ **AI_OPTIMIZATION** - AI keyword data, LLM-optimized responses (available but not used in current workflow)  
✅ **SERP** - Google, Bing, Yahoo SERP results → **Used in workflow**  
✅ **KEYWORDS_DATA** - Google Ads, Bing Ads keyword metrics (Google Trends, etc.)  
✅ **ONPAGE** - Technical SEO audits  
✅ **DATAFORSEO_LABS** - Competitor analysis, ranked keywords, domain metrics → **Used in workflow**  
❌ **BACKLINKS** - Not supported in Cloudflare Worker  
✅ **BUSINESS_DATA** - Google My Business, reviews, business profiles  
✅ **DOMAIN_ANALYTICS** - Domain technologies, Whois data  
✅ **CONTENT_ANALYSIS** - Sentiment analysis, brand monitoring

## Request Format

The Cloudflare Worker expects requests in this format:

```json
{
  "endpoint": "/v3/dataforseo_labs/google/competitors_domain/live",
  "payload": [{
    "target": "example.com",
    "location_name": "United States",
    "language_name": "English",
    "limit": 10
  }]
}
```

## Response Format

DataForSEO API responses follow this structure:

```json
{
  "version": "0.1.20250101",
  "status_code": 20000,
  "status_message": "Ok.",
  "time": "0.1234 seconds",
  "cost": 0.01,
  "tasks_count": 1,
  "tasks_error": 0,
  "tasks": [{
    "id": "01021234-1234-0123-0000-01234567890a",
    "status_code": 20000,
    "status_message": "Ok.",
    "time": "0.1234 seconds",
    "cost": 0.01,
    "result_count": 1,
    "path": ["v3", "dataforseo_labs", "google", "competitors_domain", "live"],
    "data": { /* request payload */ },
    "result": [{
      /* actual results here */
    }]
  }]
}
```

## Changes Made

### 1. New Integration File
Created `dataforseo-mcp.ts` that uses the Cloudflare proxy instead of direct API calls.

### 2. Updated Workflow Orchestrator
Changed import in `workflow-orchestrator.ts`:
```typescript
// OLD
from './integrations/dataforseo.ts';

// NEW
from './integrations/dataforseo-mcp.ts';
```

### 3. Removed Backlink Integration
- Backlink API calls removed from MCP integration
- Backlink functionality still available via separate `backlinks.ts` integration file

### 4. API Endpoints Used

#### Competitor Analysis
- **Endpoint**: `/v3/dataforseo_labs/google/competitors_domain/live`
- **Purpose**: Identify competing domains

#### Keyword Metrics
- **Endpoint**: `/v3/dataforseo_labs/google/keyword_suggestions/live`
- **Purpose**: Get keyword search volume, CPC, difficulty

#### SERP Results
- **Endpoint**: `/v3/serp/google/organic/live/advanced`
- **Purpose**: Get organic search results for keywords

#### Competitor Keywords
- **Endpoint**: `/v3/dataforseo_labs/google/ranked_keywords/live`
- **Purpose**: Analyze what keywords competitors rank for

## Benefits of This Migration

1. **No More Credential Issues** - Cloudflare Worker handles authentication
2. **Better Rate Limiting** - Worker manages API limits
3. **Improved Reliability** - Cloudflare's global network
4. **Easier Debugging** - Worker logs available in Cloudflare dashboard
5. **Centralized Configuration** - API keys managed in one place

## Testing

Test the migration with:

```bash
node test-mcp-server.js
```

This will:
- Check health endpoint
- Verify server is accessible
- List available capabilities

## Deployment Steps

1. **Deploy Updated Edge Function**:
   ```bash
   supabase functions deploy workflow-orchestrator
   ```

2. **Test with Existing User**:
   - Trigger a new workflow from the dashboard
   - Monitor Supabase Edge Function logs
   - Check for successful API responses

3. **Monitor Cloudflare Worker**:
   - View logs in Cloudflare dashboard
   - Check for any 4xx/5xx errors
   - Verify API consumption

## Rollback Plan

If issues occur, revert the workflow orchestrator import:

```typescript
// Rollback to direct API calls
import { /* ... */ } from './integrations/dataforseo.ts';
```

Then redeploy:
```bash
supabase functions deploy workflow-orchestrator
```

## Cost Savings

Using the Cloudflare proxy provides:
- **Reduced redundant API calls** through caching
- **Better error handling** preventing wasted API credits
- **Retry logic** built into the proxy layer

## Next Steps

1. ✅ Integration file created
2. ✅ Workflow orchestrator updated
3. ⏳ Deploy to Supabase
4. ⏳ Test with live workflow
5. ⏳ Monitor logs for 24 hours
6. ⏳ Verify report generation

## Support

If you encounter issues:

1. Check Cloudflare Worker logs for API errors
2. Review Supabase Edge Function logs for integration issues
3. Test individual endpoints with `test-mcp-server.js`
4. Verify API credits in DataForSEO dashboard
