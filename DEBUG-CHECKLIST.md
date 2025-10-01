# Debug Checklist: All APIs Still Failing

You've added `DATAFORSEO_BASE64` and redeployed, but still getting ❌ across all APIs. Let's systematically debug this.

---

## 🔍 Step 1: Verify Edge Function Logs

**This is the most important step** - the logs will tell you the exact error.

1. Go to: https://app.supabase.com
2. Select your project
3. **Edge Functions** → **run-intelligence-workflow** → **Logs** tab
4. Look for the most recent workflow run (should be timestamped recently)
5. **Look for error messages** - they'll tell you exactly what's wrong

**Common errors you might see:**

| Error Message | Meaning | Solution |
|--------------|---------|----------|
| `DataForSEO credentials are missing` | Environment variable not found | Verify secrets are set |
| `401 Unauthorized` | Credentials are wrong | Check login/password are correct |
| `403 Forbidden` | API credits exhausted | Add credits to DataForSEO account |
| `429 Too Many Requests` | Rate limit hit | Wait or upgrade plan |
| `undefined is not a function` | Code deployment issue | Redeploy edge function |
| `fetch is not defined` | Deno runtime issue | Check Deno version in function |

---

## 🔍 Step 2: Verify Secrets Are Actually Set

1. Go to: Supabase Dashboard → Edge Functions → **run-intelligence-workflow** → **Settings** tab
2. Scroll to **Secrets** section
3. **Verify these secrets exist:**
   - `DATAFORSEO_BASE64` ✓
   - `DATAFORSEO_LOGIN` (optional backup)
   - `DATAFORSEO_PASSWORD` (optional backup)
   - `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` ✓
   - `SERVICE_ROLE_KEY` ✓
   - `CLERK_SECRET_KEY` ✓

4. **Check for common issues:**
   - Extra spaces before/after the value
   - Incorrect base64 encoding
   - Copy/paste issues (invisible characters)

---

## 🔍 Step 3: Test DataForSEO Credentials Locally

Run the test script I just created:

```bash
cd "C:\Users\User\Documents\New folder\BI-Dashboard"

# Edit the file first - add your actual credentials
# Replace YOUR_LOGIN_HERE and YOUR_PASSWORD_HERE

node test-dataforseo-creds.js
```

**Expected output if credentials work:**
```
✅ Authentication successful!
✅ Keyword search successful!
```

**If this fails**, your credentials are wrong. Get new ones from:
https://app.dataforseo.com/api-dashboard

---

## 🔍 Step 4: Check Deployment Actually Happened

Sometimes deployments fail silently or use cached code.

**Verify deployment:**
1. Go to Edge Functions → run-intelligence-workflow
2. Check **"Last deployed"** timestamp - should be recent (within last 10 minutes)
3. If it's old, redeploy:
   - Click **Deploy** button
   - Wait for "Deployment successful" message
   - Check logs again

**Force a clean deployment:**
```bash
cd "C:\Users\User\Documents\New folder\BI-Dashboard"

# If you have Supabase CLI
supabase functions delete run-intelligence-workflow
supabase functions deploy run-intelligence-workflow
```

---

## 🔍 Step 5: Check Database for Actual Error Messages

The workflow might be logging errors to the database:

```sql
-- Check the latest workflow run metadata
SELECT 
    id,
    status,
    triggered_at,
    metadata
FROM workflow_runs
WHERE user_id = 'YOUR_USER_ID'
ORDER BY triggered_at DESC
LIMIT 1;
```

Look at the `metadata` field - it might contain error details.

---

## 🔍 Step 6: Verify API Keys Format

**DataForSEO Base64 should look like:**
```
bXl1c2VybmFtZTpteXBhc3N3b3Jk
```
(random letters and numbers, no special characters)

**OpenAI API Key should look like:**
```
sk-proj-xxxxxxxxxxxxxxxxxxxxx
```
(starts with `sk-`)

**To generate correct Base64:**

**PowerShell:**
```powershell
$login = "your_login"
$password = "your_password"
$pair = "$login:$password"
$bytes = [System.Text.Encoding]::ASCII.GetBytes($pair)
$base64 = [Convert]::ToBase64String($bytes)
Write-Output $base64
```

**Online tool:**
- Go to: https://www.base64encode.org/
- Input: `login:password` (replace with your actual credentials)
- Click Encode
- Copy result

---

## 🔍 Step 7: Check If It's Just DataForSEO or ALL APIs

Run this modified diagnostic:

```sql
-- Check workflow logs
SELECT 
    'Latest workflow' as info,
    id,
    status,
    triggered_at,
    metadata->>'error' as error_message,
    metadata->>'error_stack' as error_stack
FROM workflow_runs
WHERE user_id = 'YOUR_USER_ID'
ORDER BY triggered_at DESC
LIMIT 1;
```

If `error_message` shows something specific, that's your clue!

---

## 🔍 Step 8: Check Other API Keys

If DataForSEO is working but OTHER APIs fail:

**OpenAI/Anthropic:**
```bash
# Test OpenAI
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_OPENAI_KEY"

# Should return list of models if key is valid
```

**PageSpeed (Google):**
```bash
# Test PageSpeed API
curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://example.com&key=YOUR_PAGESPEED_KEY"

# Should return page speed data if key is valid
```

---

## 🎯 Most Likely Issues (Ranked by Probability)

### 1. **Secrets Not Actually Set** (40% probability)
- Go back and VERIFY each secret exists
- Click "Edit" on DATAFORSEO_BASE64 to see if value is there
- Common issue: They were set in a different project!

### 2. **Deployment Didn't Actually Happen** (30% probability)
- Check "Last deployed" timestamp
- Force redeploy by deleting and recreating function

### 3. **Wrong Credentials** (20% probability)
- Test with `test-dataforseo-creds.js` script
- Verify at https://app.dataforseo.com/api-dashboard

### 4. **Code Error** (5% probability)
- Check edge function logs for JavaScript errors
- Look for "undefined", "TypeError", etc.

### 5. **Supabase Issue** (5% probability)
- Check https://status.supabase.com for outages
- Try restarting the edge function

---

## ✅ Quick Verification Commands

Run these in order:

```bash
# 1. Test credentials locally
node test-dataforseo-creds.js

# 2. Check Supabase project is correct
# Open: https://app.supabase.com
# Verify you're in the right project!

# 3. Check function deployment status
# Go to: Edge Functions → run-intelligence-workflow
# Note the "Last deployed" timestamp

# 4. Trigger a new workflow
# Go to: https://artificialintelligentsia.co/onboarding
# Submit the form

# 5. Check logs immediately after
# Go to: Edge Functions → run-intelligence-workflow → Logs
# Look for errors in real-time
```

---

## 📞 If Still Failing

**Share with me:**
1. Screenshot/text of Edge Function Logs (most important!)
2. Result of running `test-dataforseo-creds.js`
3. Screenshot of Secrets section showing secrets exist
4. "Last deployed" timestamp from edge function

With that info, I can pinpoint the exact issue!

---

## 🚨 Nuclear Option: Start Fresh

If nothing works, recreate the edge function:

```bash
cd "C:\Users\User\Documents\New folder\BI-Dashboard"

# Backup and recreate
supabase functions delete run-intelligence-workflow
supabase functions deploy run-intelligence-workflow

# Then re-add ALL secrets via dashboard
```

After redeployment, **immediately check logs** when you trigger a workflow to see the actual error message!
