# Action Plan: No Onboarding/Workflows Found

## 🔴 Current Situation

Your diagnostic results show:
```json
{
  "onboarding_complete": 0,
  "total_workflows": 0,
  "completed_workflows": 0,
  "failed_workflows": 0,
  "in_progress": 0,
  "total_reports": 0,
  "reports_generated_today": null
}
```

**This means:** The onboarding form was never successfully submitted to the backend, so no workflow was ever triggered, and therefore no report exists.

---

## 🎯 Step-by-Step Action Plan

### Phase 1: Verify Database Tables (5 minutes)

**Run:** `diagnose-onboarding-issue.sql` in Supabase SQL Editor

This will show if:
- Tables exist but are empty (onboarding never submitted)
- Tables have records for OTHER users (wrong user ID)
- Tables don't exist (migration issue)

### Phase 2: Frontend Diagnostic (10 minutes)

#### Option A: Browser Console Method

1. **Open your app** in browser (http://localhost:5173 or your URL)
2. **Press F12** to open DevTools
3. **Go to Console tab**
4. **Copy and paste** entire contents of `browser-diagnostic.js`
5. **Press Enter** to run

**Expected Output:**
```
🔍 Starting Diagnostic...
1️⃣ ENVIRONMENT VARIABLES: ...
2️⃣ CLERK AUTHENTICATION:
   ✅ Session token found
   User ID: user_2xxxxxxxxxxxxxxxxxxxxx
3️⃣ CURRENT PAGE: ...
4️⃣ TESTING API ENDPOINTS: ...
```

**Save the User ID!** You'll need it for database queries.

#### Option B: Manual Check

If the script doesn't work, manually check:

1. **Check if signed in:**
   - Look for user avatar/name in app
   - Check DevTools → Application → Cookies → `__session` cookie exists

2. **Check Supabase URL:**
   ```bash
   cd C:\Users\User\Documents\New folder\BI-Dashboard\frontend
   cat .env | grep VITE_SUPABASE_URL
   # Or on Windows:
   type .env | findstr VITE_SUPABASE_URL
   ```

3. **Check if app is running:**
   - Should be on http://localhost:5173
   - Vite dev server should be running

### Phase 3: Test Onboarding Form (10 minutes)

1. **Navigate to onboarding page:**
   - URL should be: http://localhost:5173/onboarding
   - Or click any "Start Onboarding" button in your app

2. **Open DevTools BEFORE submitting:**
   - Press F12
   - Go to **Network** tab
   - Check "Preserve log" option
   - Go to **Console** tab (keep it open in split view)

3. **Fill out the form:**
   - Full Name: Test User
   - Website URL: example.com
   - Industry: Technology
   - Location: United States

4. **Click Submit** and watch for:
   
   **In Network Tab:**
   - Look for request to `run-intelligence-workflow`
   - Click on it to see details
   - Check Status Code (should be 202 or 200)
   - Check Response (should have `workflowId`)
   
   **In Console Tab:**
   - Any red error messages?
   - Any failed requests?
   - Any CORS errors?

### Phase 4: Analyze Results

#### Scenario A: No Network Request Appears

**Problem:** Form isn't submitting to API

**Possible Causes:**
1. JavaScript error preventing form submission
2. Form validation blocking submission
3. `VITE_SUPABASE_URL` not set in `.env`

**Solution:**
```bash
# Check .env file
cd C:\Users\User\Documents\New folder\BI-Dashboard\frontend
cat .env
```

Expected content:
```bash
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

If missing, create `.env` file with proper values, then:
```bash
# Restart dev server
npm run dev
```

#### Scenario B: Network Request Fails (4xx/5xx)

**Check Response Details:**

**401 Unauthorized:**
```json
{
  "error": "AUTHENTICATION_FAILED",
  "message": "Unable to authenticate..."
}
```
→ **Solution:** Clerk token issue. Sign out and sign back in.

**500 Internal Server Error:**
```json
{
  "error": "WORKFLOW_TRIGGER_FAILED",
  "message": "..."
}
```
→ **Solution:** Check Supabase Edge Function logs

**403 Forbidden:**
```json
{
  "error": "IP_LIMIT_EXCEEDED",
  "message": "..."
}
```
→ **Solution:** IP limit reached. Clear with SQL:
```sql
DELETE FROM signup_fingerprints WHERE ip_address = 'YOUR_IP';
```

#### Scenario C: Request Succeeds but No Workflow

**Network Tab Shows:**
- Status: 202 Accepted
- Response: `{ "workflowId": "xxx-xxx-xxx", "status": "queued" }`

**But database has no records?**

→ **Solution:** Database transaction might have failed. Check:

1. **Supabase Edge Function Logs:**
   - Go to Supabase Dashboard
   - Edge Functions → run-intelligence-workflow → Logs
   - Look for errors after timestamp of your submission

2. **Database permissions:**
   ```sql
   -- Check if service role can insert
   SELECT current_user, current_setting('role');
   ```

### Phase 5: Quick Test with Manual Data

If onboarding keeps failing, test the dashboard with dummy data:

1. **Get your Clerk User ID** from browser console:
   ```javascript
   const token = document.cookie.split('__session=')[1]?.split(';')[0];
   const payload = JSON.parse(atob(token.split('.')[1]));
   console.log('User ID:', payload.sub);
   ```

2. **Run these SQL commands** in Supabase SQL Editor:
   ```sql
   -- Replace <YOUR_CLERK_USER_ID> with your actual user ID
   
   -- Create onboarding profile
   INSERT INTO onboarding_profiles (user_id, full_name, website_url, industry, location)
   VALUES ('<YOUR_CLERK_USER_ID>', 'Test User', 'example.com', 'Technology', 'United States');
   
   -- Create workflow run
   INSERT INTO workflow_runs (user_id, website_url, status, triggered_at, completed_at)
   VALUES ('<YOUR_CLERK_USER_ID>', 'example.com', 'completed', NOW(), NOW())
   RETURNING id;
   ```

3. **Copy the workflow ID** from the result, then:
   ```sql
   -- Create test report (replace <WORKFLOW_ID> with the ID from above)
   INSERT INTO reports (workflow_id, payload)
   VALUES ('<WORKFLOW_ID>', '{
     "summary": {
       "id": "test-report",
       "captured_at": "2025-10-01T00:00:00Z",
       "executive_summary": "This is a test report to verify the dashboard display works correctly.",
       "recommendations": [
         {
           "title": "Test Recommendation 1",
           "description": "This is a test recommendation to ensure the dashboard can display AI-generated insights.",
           "confidence": 0.95
         },
         {
           "title": "Test Recommendation 2", 
           "description": "Another test recommendation to verify multiple recommendations display properly.",
           "confidence": 0.87
         }
       ]
     },
     "serpTimeline": [
       {"captured_at": "2025-09-01T00:00:00Z", "share_of_voice": 15},
       {"captured_at": "2025-09-15T00:00:00Z", "share_of_voice": 20},
       {"captured_at": "2025-10-01T00:00:00Z", "share_of_voice": 25}
     ],
     "keywordOpportunities": [
       {"keyword": "business intelligence", "volume": 5000, "difficulty": 45, "ctrPotential": 0.65},
       {"keyword": "data analytics", "volume": 8000, "difficulty": 60, "ctrPotential": 0.55},
       {"keyword": "market research", "volume": 3000, "difficulty": 35, "ctrPotential": 0.75}
     ],
     "sentiment": [
       {"label": "Brand Awareness", "score": 80},
       {"label": "Product Quality", "score": 85},
       {"label": "Customer Service", "score": 75},
       {"label": "Innovation", "score": 90},
       {"label": "Value", "score": 70}
     ],
     "backlinks": [
       {"source": "techcrunch.com", "authority": 92, "anchorText": "innovative solution"},
       {"source": "forbes.com", "authority": 95, "anchorText": "market leader"},
       {"source": "businessinsider.com", "authority": 88, "anchorText": "industry analysis"}
     ],
     "coreWebVitals": [
       {"metric": "LCP", "desktop": 2.5, "mobile": 3.5},
       {"metric": "FID", "desktop": 100, "mobile": 150},
       {"metric": "CLS", "desktop": 0.1, "mobile": 0.15}
     ],
     "techStack": [
       {"competitor": "competitor1.com", "categories": ["React", "Node.js", "PostgreSQL"]},
       {"competitor": "competitor2.com", "categories": ["Vue.js", "Express", "MongoDB"]}
     ]
   }'::jsonb);
   ```

4. **Reload your dashboard** - You should now see the test report!

---

## 🔍 Common Issues & Solutions

### Issue: "VITE_SUPABASE_URL is not defined"

**Fix:**
```bash
cd C:\Users\User\Documents\New folder\BI-Dashboard\frontend
echo VITE_SUPABASE_URL=https://your-project.supabase.co >> .env
# Restart dev server
npm run dev
```

### Issue: "Not authenticated"

**Fix:**
1. Sign out of your app
2. Clear cookies (DevTools → Application → Cookies → Clear all)
3. Sign back in
4. Try onboarding again

### Issue: "Service misconfigured"

**Fix:** Edge function environment variables missing
1. Go to Supabase Dashboard
2. Edge Functions → run-intelligence-workflow → Settings
3. Add required environment variables:
   - `SERVICE_ROLE_KEY`
   - `CLERK_SECRET_KEY`
   - (See `API_FAILURE_ANALYSIS.md` for full list)

### Issue: Form submits but nothing happens

**Check:** Browser console for silent errors
```javascript
// Add this to OnboardingPage.tsx in the catch block
console.error('Full error:', error);
console.error('Error stack:', error.stack);
```

---

## ✅ Success Checklist

After completing all phases, you should have:

- [ ] Confirmed your Clerk User ID
- [ ] Verified Supabase URL is set correctly
- [ ] Successfully submitted onboarding form
- [ ] Seen workflow request in Network tab with 202 response
- [ ] Found workflow_runs record in database
- [ ] (Eventually) Found reports record in database
- [ ] Seen report display on dashboard

---

## 📞 Still Stuck?

Run this comprehensive check:

```javascript
// In browser console:
console.log('=== COMPREHENSIVE CHECK ===');
console.log('1. Signed in?', document.cookie.includes('__session'));
console.log('2. On correct page?', window.location.pathname);
console.log('3. Supabase URL:', localStorage.getItem('supabase-url') || 'Check .env');
console.log('4. Clerk loaded?', typeof Clerk !== 'undefined');
console.log('5. React app loaded?', document.getElementById('root')?.innerHTML.length > 100);
```

If any of these show issues, you've found the problem!

---

## 🚀 After Fixing

Once onboarding works, the workflow will:
1. ✅ Start immediately (status: 'queued')
2. ⏳ Run for 2-5 minutes (status: 'running')
3. ✅ Complete with report (status: 'completed')
4. 📊 Display on dashboard automatically

**Note:** The workflow can take 2-10 minutes depending on API response times. The dashboard will poll every 10 seconds and auto-refresh when ready.
