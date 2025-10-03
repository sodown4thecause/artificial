# Intelligent Keyword & Competitor Discovery

## 🎯 **Overview**

The workflow now intelligently discovers keywords and competitors when users don't provide them during onboarding. This ensures **every report has valuable data** even if the user skips those optional form fields.

## 🔄 **Discovery Flow**

### **For Keywords:**
```
1. Check if user provided keywords
   ↓ YES → Use user keywords
   ↓ NO  → Discover keywords

2. DataForSEO Keywords For Site API
   - Analyzes the target website
   - Returns up to 20 relevant keywords
   - Filters by search volume > 100
   ↓ Found keywords → Use discovered keywords
   ↓ No keywords → Fallback

3. Fallback: Industry-based keywords
   - Uses context.industry as seed
   - Generates variations (e.g., "SaaS services", "SaaS USA")
```

### **For Competitors:**
```
1. Check if user provided competitors
   ↓ YES → Use user competitors
   ↓ NO  → Discover competitors

2. DataForSEO Competitors Domain API
   - Analyzes domain similarity
   - Returns top 10 similar domains
   - Filters out own domain
   ↓ Found 1+ competitors → Use DataForSEO competitors
   ↓ No competitors → Try AI

3. Perplexity AI Fallback
   - Prompts Perplexity for competitor suggestions
   - Uses industry + location context
   - Validates domain format
   ↓ Found competitors → Use AI suggestions
   ↓ No competitors → Continue without
```

## 📊 **API Endpoints Used**

### 1. DataForSEO Keywords For Site
**Endpoint:** `/v3/dataforseo_labs/google/keywords_for_site/live`

**Purpose:** Discovers keywords a website ranks for

**Request:**
```typescript
{
  target: 'example.com',
  location_code: 2840,  // United States
  language_code: 'en',
  limit: 20,
  filters: [["keyword_data.keyword_info.search_volume", ">", 100]]
}
```

**Response:**
```json
{
  "tasks": [{
    "result": [{
      "items": [
        {
          "keyword": "enterprise software",
          "keyword_data": {
            "keyword_info": {
              "search_volume": 12000,
              "cpc": 5.50
            }
          }
        }
      ]
    }]
  }]
}
```

### 2. DataForSEO Competitors Domain
**Endpoint:** `/v3/dataforseo_labs/google/competitors_domain/live`

**Purpose:** Finds competitor domains

**Request:**
```typescript
{
  target: 'example.com',
  location_code: 2840,
  language_code: 'en',
  limit: 10
}
```

**Response:**
```json
{
  "tasks": [{
    "result": [{
      "items": [
        {
          "domain": "competitor1.com",
          "avg_position": 5.2,
          "sum_position": 1500
        }
      ]
    }]
  }]
}
```

### 3. Perplexity AI Competitor Suggestion
**Endpoint:** `https://api.perplexity.ai/chat/completions`

**Purpose:** AI-powered competitor suggestions

**Request:**
```typescript
{
  model: 'llama-3.1-sonar-small-128k-online',
  messages: [{
    role: 'user',
    content: `List the top 5 competitor websites for example.com in the SaaS industry located in USA.
    
Provide ONLY the domain names (e.g., example.com), one per line, without any explanations.`
  }],
  temperature: 0.2,
  max_tokens: 200
}
```

**Response:**
```json
{
  "choices": [{
    "message": {
      "content": "competitor1.com\ncompetitor2.com\ncompetitor3.com\ncompetitor4.com\ncompetitor5.com"
    }
  }]
}
```

## 🛠️ **Implementation Details**

### Function: `discoverKeywordsForSite()`
**Location:** `supabase/functions/lib/integrations/dataforseo-mcp.ts`

```typescript
export async function discoverKeywordsForSite(context: WorkflowContext): Promise<string[]> {
  // 1. Extract clean domain
  const domain = extractCleanDomain(context.websiteUrl);
  
  // 2. Call DataForSEO Keywords For Site API
  const result = await callDataForSEO(
    '/v3/dataforseo_labs/google/keywords_for_site/live',
    [{ target: domain, location_code, language_code, limit: 20, filters }]
  );
  
  // 3. Extract and filter keywords
  const keywords = result?.items
    ?.map(item => item.keyword)
    ?.filter(k => k && k.length > 2)
    ?.slice(0, 10) || [];
  
  return keywords;
}
```

**Usage in workflow:**
```typescript
// In fetchKeywordMetrics()
if (!context.targetKeywords || context.targetKeywords.length === 0) {
  const discoveredKeywords = await discoverKeywordsForSite(context);
  keywordsToAnalyze = discoveredKeywords.length > 0 
    ? discoveredKeywords 
    : [context.industry]; // Fallback
}
```

### Function: `suggestCompetitorsViaPerplexity()`
**Location:** `supabase/functions/lib/integrations/dataforseo-mcp.ts`

```typescript
async function suggestCompetitorsViaPerplexity(context: WorkflowContext): Promise<string[]> {
  // 1. Check for Perplexity API key
  const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
  
  // 2. Create prompt
  const prompt = `List the top 5 competitor websites for ${context.websiteUrl} 
                  in the ${context.industry} industry located in ${context.location}.
                  Provide ONLY domain names, one per line.`;
  
  // 3. Call Perplexity API
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${perplexityApiKey}` },
    body: JSON.stringify({ model, messages, temperature, max_tokens })
  });
  
  // 4. Parse and validate domains
  const competitors = parseDomains(response)
    .filter(domain => isValidDomain(domain))
    .filter(domain => domain !== ownDomain);
  
  return competitors;
}
```

**Usage in workflow:**
```typescript
// In identifyCompetitors()
// 1. Try user-provided
if (context.competitorDomains?.length > 0) {
  return context.competitorDomains;
}

// 2. Try DataForSEO
const dataForSeoCompetitors = await callDataForSEO(...);
if (dataForSeoCompetitors.length > 0) {
  return dataForSeoCompetitors;
}

// 3. Fallback to Perplexity
const aiSuggestedCompetitors = await suggestCompetitorsViaPerplexity(context);
return aiSuggestedCompetitors;
```

## 📝 **Logging & Debugging**

### Keyword Discovery Logs:
```
🔍 Discovering keywords for website...
   - Target domain: example.com
✅ Discovered 10 keywords: ["enterprise software", "cloud platform", ...]
```

Or if none found:
```
🔍 Discovering keywords for website...
❌ Failed to discover keywords: [error details]
   - Falling back to industry keyword
```

### Competitor Discovery Logs:
```
🔍 Identifying competitors...
   - Target domain: example.com
   - Attempting DataForSEO competitor discovery...
   - Raw API items count: 8
   - First 3 items: ["competitor1.com", "competitor2.com", "competitor3.com"]
✅ DataForSEO found 5 competitors: [...]
```

Or with Perplexity fallback:
```
🔍 Identifying competitors...
   - Target domain: example.com
   - Attempting DataForSEO competitor discovery...
   - Raw API items count: 0
⚠️ DataForSEO found no competitors, trying Perplexity AI...
🤖 Using Perplexity AI to suggest competitors...
✅ Perplexity suggested 5 competitors: [...]
```

## 🧪 **Testing Scenarios**

### Scenario 1: User Provides Everything
**Input:**
- Keywords: ["enterprise software", "cloud platform"]
- Competitors: ["competitor1.com", "competitor2.com"]

**Expected:**
- ✅ Uses provided keywords
- ✅ Uses provided competitors
- ✅ No discovery attempted

### Scenario 2: User Provides Nothing
**Input:**
- Keywords: [] (empty)
- Competitors: [] (empty)

**Expected:**
- ✅ Discovers keywords via DataForSEO Keywords For Site
- ✅ Discovers competitors via DataForSEO Competitors Domain
- ✅ Uses Perplexity if DataForSEO fails

### Scenario 3: Partial Input
**Input:**
- Keywords: ["cloud software"]
- Competitors: [] (empty)

**Expected:**
- ✅ Uses provided keywords
- ✅ Discovers competitors automatically

### Scenario 4: New/Small Website
**Input:**
- Website: brand-new-startup.com (no online presence)
- Keywords: []
- Competitors: []

**Expected:**
- ⚠️ DataForSEO returns no keywords → Fallback to industry keywords
- ⚠️ DataForSEO returns no competitors → Try Perplexity AI
- ✅ Perplexity suggests competitors based on industry

## ⚙️ **Configuration**

### Required Environment Variables:
```bash
# DataForSEO (Required for all discovery)
DATAFORSEO_USERNAME=your_username
DATAFORSEO_PASSWORD=your_password

# Perplexity AI (Optional, for competitor fallback)
PERPLEXITY_API_KEY=pplx-your_api_key_here
```

### Cost Considerations:

#### DataForSEO Costs:
- **Keywords For Site:** ~$0.04 per request
- **Competitors Domain:** ~$0.04 per request
- **Total per workflow:** ~$0.08 (if keywords + competitors needed)

#### Perplexity Costs:
- **Chat Completion:** ~$0.001 per request (only if DataForSEO fails)
- **Model:** `llama-3.1-sonar-small-128k-online` (cheapest online model)

#### When Discovery is NOT Triggered:
- User provides keywords → $0 keyword discovery cost
- User provides competitors → $0 competitor discovery cost
- DataForSEO succeeds → $0 Perplexity cost

## 📋 **Best Practices**

### For Developers:
1. **Always check user input first** - Don't waste API calls
2. **Log extensively** - Makes debugging much easier
3. **Handle failures gracefully** - Always have fallbacks
4. **Normalize domains** - Remove www, lowercase, trim

### For Users:
1. **Provide keywords when possible** - More accurate results
2. **Provide competitors when possible** - Saves discovery time
3. **Use specific industries** - Better AI suggestions
4. **Accurate location** - Improves DataForSEO results

## 🐛 **Common Issues & Solutions**

### Issue 1: "No keywords discovered"
**Cause:** Website is too new or has very low traffic

**Solution:**
- Workflow automatically falls back to industry-based keywords
- Suggest user provides keywords manually

### Issue 2: "DataForSEO returns own domain as competitor"
**Cause:** Domain filtering bug (FIXED in current version)

**Solution:**
- Enhanced domain normalization
- Exact match comparison instead of substring

### Issue 3: "Perplexity returns invalid domains"
**Cause:** AI sometimes includes explanations or URLs

**Solution:**
- Strict parsing: only lines without spaces
- Domain validation: must contain `.`
- Filter out own domain

### Issue 4: "Discovery is slow"
**Cause:** Multiple API calls in sequence

**Solution:**
- Discovery only happens if needed
- Results are cached for the workflow
- Consider async/parallel calls (future improvement)

## 🔮 **Future Enhancements**

### Potential Improvements:
1. **Cache discovered keywords** - Store in database for faster repeat reports
2. **Parallel API calls** - Discover keywords & competitors simultaneously
3. **User feedback loop** - Let users confirm/reject discovered items
4. **More AI providers** - Add Claude/OpenAI as Perplexity alternatives
5. **Historical tracking** - Show how keywords/competitors change over time

### Code Locations:
```
supabase/functions/lib/integrations/
├── dataforseo-mcp.ts         # Main discovery logic
├── llm.ts                    # Could add Claude competitor suggestions
└── workflow-orchestrator.ts  # Orchestrates discovery calls
```

---

**Last Updated:** 2025-10-03  
**Status:** ✅ Deployed and Ready for Testing  
**API Credits Used:** ~$0.08-0.09 per full discovery workflow
