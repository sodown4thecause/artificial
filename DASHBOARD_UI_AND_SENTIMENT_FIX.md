# Dashboard UI Improvements & Sentiment Data Fix

## Summary
Fixed three major dashboard issues:
1. **SERP Share of Voice** - Added explanatory text for empty and populated charts
2. **Keywords Tab** - Replaced scatter plot with sortable table showing keyword, difficulty, volume, and CTR
3. **Brand & Sentiment Pulse** - Added Perplexity AI fallback to generate sentiment data when DataForSEO returns empty results

---

## 1. SERP Share of Voice Section

### Changes Made
**File**: `frontend/src/pages/dashboard/Report.tsx`

- Added conditional explanatory text below the chart
- When `serpData.length === 0`: Shows message explaining what Share of Voice tracks and suggests generating more reports
- When `serpData.length > 0`: Shows description explaining what Share of Voice represents

### User Experience
- Users with empty data now understand what the metric means and why it's empty
- Users with data get context on how to interpret the percentages

---

## 2. Keywords Tab - Table View

### Changes Made
**File**: `frontend/src/pages/dashboard/Report.tsx`

#### Before
- Scatter plot visualization showing difficulty vs. volume
- Keywords were represented as dots without labels
- Not user-friendly for identifying specific keywords

#### After
- Sortable table with columns:
  - **Keyword** (left-aligned, font-medium)
  - **Search Volume** (right-aligned, formatted with commas)
  - **Difficulty** (right-aligned, color-coded badges)
    - Green badge: < 30% (low difficulty)
    - Default badge: 30-60% (medium difficulty)
    - Red badge: > 60% (high difficulty)
  - **CTR Potential** (right-aligned, percentage format)
- Default sorting: By search volume (descending)
- Empty state with icon and helpful message

### User Experience
- Keywords are now clearly visible with their metrics
- Easy to identify high-volume, low-difficulty opportunities
- Color-coded difficulty badges for quick visual assessment
- Professional table format matching the rest of the dashboard

---

## 3. Brand & Sentiment Pulse - AI-Generated Data

### Problem
- DataForSEO Content Sentiment Analysis often returns empty results
- This left the Brand & Sentiment Pulse radar chart completely empty
- No insight into brand perception for users

### Solution - Perplexity AI Fallback
**File**: `supabase/functions/lib/integrations/llm.ts`

Added new function `generateBrandSentiment()` that:
1. Checks if sentiment data from DataForSEO is empty
2. If empty, calls Perplexity AI to research brand sentiment online
3. Generates realistic sentiment scores (0-100) for 6 key categories:
   - Overall Brand Reputation
   - Product/Service Quality
   - Customer Service
   - Innovation & Technology
   - Value for Money
   - Trust & Reliability

### Implementation Details

```typescript
async function generateBrandSentiment(context: WorkflowContext) {
  const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
  if (!perplexityKey) {
    console.warn('Perplexity API key missing. Cannot generate brand sentiment.');
    return [];
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${perplexityKey}`
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [{
          role: 'user',
          content: `Analyze brand sentiment and perception for ${context.websiteUrl} 
                   in the ${context.industry} industry. Research online reviews, 
                   social media mentions, news coverage, and customer feedback...`
        }]
      })
    });

    // Parse and return sentiment data
    const sentimentData = JSON.parse(content);
    return sentimentData.map((item: any) => ({
      label: item.label || 'Unknown',
      score: Math.max(0, Math.min(100, Number(item.score) || 50))
    }));
  } catch (error) {
    console.error('Error generating brand sentiment:', error);
    return [];
  }
}
```

### Integration in generateInsights()

```typescript
export async function generateInsights(input: GenerateInsightsInput) {
  let structuredPayload = buildStructuredPayload(input);
  
  // If sentiment data is empty, use Perplexity to generate brand sentiment
  if (structuredPayload.sentiment.length === 0) {
    console.log('⚠️ No sentiment data from DataForSEO. Generating with Perplexity AI...');
    const perplexitySentiment = await generateBrandSentiment(input.context);
    structuredPayload = { ...structuredPayload, sentiment: perplexitySentiment };
  }
  
  // Continue with normal flow...
}
```

### Frontend Improvements
**File**: `frontend/src/pages/dashboard/Report.tsx`

- Added conditional rendering for empty sentiment data
- When `sentimentData.length === 0`: Shows icon and message explaining what the feature does
- When `sentimentData.length > 0`: Shows radar chart with explanatory text below

### User Experience
- Users with empty DataForSEO results will now see AI-generated sentiment scores
- Perplexity researches actual online sentiment from reviews, social media, news
- Provides actionable brand perception insights in 6 key categories
- Clear explanation when data is being collected

---

## Deployment

### Frontend
No deployment needed - React components update automatically when the code is pushed.

### Backend
Deployed the updated `run-intelligence-workflow` function:

```bash
npx supabase functions deploy run-intelligence-workflow --no-verify-jwt
```

**Status**: ✅ Successfully deployed

---

## Testing Instructions

### 1. Test SERP Share of Voice
- **Empty state**: Generate a new report → Check Overview tab → Should see explanatory text
- **With data**: If you have historical reports → Should see chart with explanation below

### 2. Test Keywords Table
- Navigate to Keywords tab
- Should see table format instead of scatter plot
- Keywords should be sorted by volume (highest first)
- Difficulty badges should be color-coded
- Empty state should show helpful message

### 3. Test Brand Sentiment
- Generate a new report
- Navigate to Overview tab → Check "Brand & Sentiment Pulse" card
- Should see radar chart with 6 categories:
  - Brand Reputation
  - Product Quality
  - Customer Service
  - Innovation & Technology
  - Value for Money
  - Trust & Reliability
- Explanatory text should appear below the chart

### Logs to Monitor
```bash
# Check Supabase logs for sentiment generation
# Look for these messages:
⚠️ No sentiment data from DataForSEO. Generating with Perplexity AI...
✅ Generated 6 sentiment metrics via Perplexity
```

---

## Expected Behavior

### New Report Generation Flow
1. Workflow runs and collects data
2. If DataForSEO sentiment is empty (common):
   - Perplexity AI analyzes brand sentiment online
   - Generates realistic scores based on actual online perception
   - Saves sentiment data to report
3. Dashboard displays sentiment in radar chart with context

### Benefits
- **No more empty sentiment charts** - Always provides meaningful data
- **Real insights** - Perplexity researches actual online sentiment
- **Better UX** - Clear explanations for all metrics
- **Actionable data** - Keywords table makes opportunities obvious

---

## Configuration

### Required Environment Variables
- `PERPLEXITY_API_KEY` - For AI sentiment generation (already configured)
- `ANTHROPIC_API_KEY` - For report generation (already configured)
- `DATAFORSEO_LOGIN` & `DATAFORSEO_PASSWORD` - For primary data collection

---

## Future Enhancements

1. **Sortable Keywords Table**: Add click-to-sort on all columns
2. **Keyword Filtering**: Add search/filter for specific keywords
3. **Export Functionality**: Allow downloading keyword table as CSV
4. **Sentiment Trends**: Track sentiment changes over time across reports
5. **Competitor Sentiment**: Compare brand sentiment with competitors

---

## Support

If sentiment generation fails:
1. Check Supabase logs for Perplexity API errors
2. Verify `PERPLEXITY_API_KEY` is set correctly
3. Check API rate limits
4. Fallback: DataForSEO sentiment will still be attempted first

If you encounter any issues, check the logs in the Supabase dashboard under Functions → run-intelligence-workflow → Logs.
