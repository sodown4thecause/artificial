# Testing Guide: Keyword Research Tool

## 🔍 Debugging Steps

### Step 1: Open Browser Console
1. In your browser, press **F12** (or **Ctrl+Shift+I** / **Cmd+Option+I**)
2. Go to the **Console** tab
3. Clear any existing logs

### Step 2: Try a Search
1. Navigate to the Keyword Research Tool
2. Enter "digital marketing" in the search box
3. Click "Search"
4. **Watch the console** for log messages

### Step 3: Check What Logs Appear

#### ✅ Expected Logs (Success):
```
📊 DataForSEO API response: {...}
📈 Parsed results: X keywords
```

#### ❌ Error Logs (Problem):
```
❌ API Error: {...}
```

### Step 4: Check Network Tab
1. In Dev Tools, go to the **Network** tab
2. Filter by **Fetch/XHR**
3. Try the search again
4. Look for the request to `dataforseo-keywords`
5. Click on it to see:
   - **Status Code** (should be 200)
   - **Response** tab (to see the actual API response)
   - **Headers** tab (to verify authorization)

## 🧪 Manual API Test

You can test the API directly using curl:

### Windows PowerShell:
```powershell
# Get your Clerk token from browser console:
# localStorage.getItem('__clerk_db_jwt')

$token = "your-clerk-token-here"
$url = "YOUR_SUPABASE_URL/functions/v1/dataforseo-keywords"

$body = @{
    keywords = @("digital marketing")
    location_code = 2840
    language_code = "en"
    limit = 10
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri $url -Method Post -Body $body -Headers $headers
```

## 📋 Common Issues & Solutions

### Issue 1: "Failed to fetch keyword data"
**Check:**
- Is the Edge Function deployed? Run: `supabase functions deploy dataforseo-keywords`
- Are credentials set? Run: `supabase secrets list | Select-String DATAFORSEO`

### Issue 2: HTTP 401 Unauthorized
**Cause:** Invalid DataForSEO credentials
**Solution:**
```bash
supabase secrets set DATAFORSEO_USERNAME=your_username
supabase secrets set DATAFORSEO_PASSWORD=your_password
```

### Issue 3: HTTP 500 Internal Server Error
**Check Supabase Logs:**
1. Go to: https://supabase.com/dashboard/project/efynkraanhjwfjetnccp/functions
2. Click on `dataforseo-keywords`
3. View the logs tab
4. Look for error messages

### Issue 4: No results returned (empty array)
**Possible causes:**
- DataForSEO account has insufficient credits
- Location/language combination not supported
- API rate limiting

## 🔧 Quick Fixes

### Fix 1: Hard Refresh Browser
```
Windows: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

### Fix 2: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Fix 3: Redeploy Edge Function
```bash
cd "C:\Users\User\Documents\New folder\BI-Dashboard"
supabase functions deploy dataforseo-keywords
```

## 📊 Expected Response Structure

A successful DataForSEO response looks like:
```json
{
  "status_code": 20000,
  "tasks": [{
    "status_code": 20000,
    "status_message": "Ok.",
    "result": [{
      "keyword": "digital marketing",
      "location_code": 2840,
      "language_code": "en",
      "items": [
        {
          "keyword": "digital marketing",
          "keyword_info": {
            "search_volume": 201000,
            "cpc": 6.29
          },
          "keyword_properties": {
            "keyword_difficulty": 82
          },
          "search_intent": "informational"
        }
        // ... more keywords
      ]
    }]
  }]
}
```

## 🆘 Still Not Working?

1. **Check the function logs:**
   - View at: https://supabase.com/dashboard/project/efynkraanhjwfjetnccp/functions
   - Look for error messages in the logs

2. **Verify credentials:**
   ```bash
   supabase secrets list
   ```
   - Ensure `DATAFORSEO_USERNAME` and `DATAFORSEO_PASSWORD` are present

3. **Test DataForSEO credentials directly:**
   - Go to: https://app.dataforseo.com/
   - Login with your credentials
   - Check account balance

4. **Contact me with:**
   - Screenshot of browser console
   - Screenshot of Network tab (dataforseo-keywords request)
   - Any error messages from Supabase logs
