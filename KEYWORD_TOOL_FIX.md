# Keyword Research Tool - Fix Documentation

## Problem
The Keyword Research Tool was showing "Error: Failed to fetch keyword data" when trying to search for keywords.

## Root Cause
The Edge Function `dataforseo-keywords` had **incorrect API authentication configuration**:

### Issue 1: Wrong Environment Variable
- **Before:** Expected `DATAFORSEO_API_KEY` (single variable)
- **After:** Uses `DATAFORSEO_USERNAME` and `DATAFORSEO_PASSWORD` (Basic Auth)

### Issue 2: Incorrect API Endpoint  
- **Before:** Used `.ai` suffix endpoint that may not be available
- **After:** Uses standard endpoint without `.ai` suffix

### Issue 3: Wrong API Parameters
- **Before:** Used `location_name` and `language_name` (string values)
- **After:** Uses `location_code` and `language_code` (as per DataForSEO API spec)

## Changes Made

### 1. Updated Edge Function: `supabase/functions/dataforseo-keywords/index.ts`
```typescript
// ✅ NEW: Correct authentication
const username = Deno.env.get('DATAFORSEO_USERNAME')
const password = Deno.env.get('DATAFORSEO_PASSWORD')
const auth = btoa(`${username}:${password}`)

// ✅ NEW: Standard endpoint (not .ai)
const response = await fetch(
  'https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_suggestions/live',
  {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([{
      keyword: keywords[0],
      location_code: location_code,  // ✅ Changed from location_name
      language_code: language_code,  // ✅ Changed from language_name
      limit: limit || 50
    }])
  }
)
```

### 2. Updated Environment Configuration: `supabase/.env.example`
```bash
# DataForSEO API Credentials (get from https://app.dataforseo.com/)
DATAFORSEO_USERNAME=your_dataforseo_username_here
DATAFORSEO_PASSWORD=your_dataforseo_password_here
```

### 3. Redeployed Edge Function
```bash
supabase functions deploy dataforseo-keywords
```

## Verification Steps

### Check Supabase Secrets
Your DataForSEO credentials are already configured in Supabase:
```
✅ DATAFORSEO_USERNAME - Set
✅ DATAFORSEO_PASSWORD - Set
```

### Test the Keyword Research Tool
1. **Refresh the browser** - The page should reload with the updated function
2. **Navigate to** the Keyword Research Tool section
3. **Enter a keyword** (e.g., "digital marketing")
4. **Click "Search"**
5. **Expected result:** Keyword suggestions with metrics (volume, CPC, difficulty)

## Monitoring

### Check Function Logs
To see if the API is working correctly:
```bash
supabase functions logs dataforseo-keywords --follow
```

Look for:
- ✅ `🔐 Checking DataForSEO credentials...` - Should show credentials present
- ✅ `📡 Making DataForSEO keyword suggestions request for: [keyword]`
- ✅ API response status

### Common Errors to Watch For

#### Error: "DataForSEO API not configured"
**Cause:** Missing credentials  
**Fix:** Ensure secrets are set:
```bash
supabase secrets set DATAFORSEO_USERNAME=your_username
supabase secrets set DATAFORSEO_PASSWORD=your_password
```

#### Error: HTTP 401 Unauthorized
**Cause:** Invalid credentials  
**Fix:** Verify credentials at https://app.dataforseo.com/ and update secrets

#### Error: HTTP 40101 (Insufficient funds)
**Cause:** DataForSEO account balance too low  
**Fix:** Add credits to your DataForSEO account

## API Reference

According to the DataForSEO documentation, the Keyword Suggestions endpoint:
- **URL:** `https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_suggestions/live`
- **Auth:** Basic Auth (username:password encoded in Base64)
- **Method:** POST
- **Body:** Array of task objects with:
  - `keyword` (string): Target keyword
  - `location_code` (integer): Location code (e.g., 2840 for United States)
  - `language_code` (string): Language code (e.g., "en")
  - `limit` (integer): Max results (default: 50)

## Additional Notes

- The fix aligns with the DataForSEO API specification
- Credentials are securely stored as Supabase secrets
- The function now uses proper Basic Auth as required by DataForSEO
- Improved logging for better debugging

## Next Steps

1. ✅ **Fixed code** - Completed
2. ✅ **Deployed function** - Completed  
3. 🔄 **Test in browser** - Please test and verify results
4. 📊 **Monitor logs** - Check for any errors

---

**Last Updated:** 2025-10-03  
**Function Version:** Latest deployment
