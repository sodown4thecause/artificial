# Quick Fix: Missing Rate Limit Table Error

## 🚨 Error You're Seeing

```
ERROR: 42P01: relation "daily_usage_limits" does not exist
```

or

```
ERROR: 42P01: relation "daily_report_limits" does not exist
```

## 🔧 Solution

The `daily_report_limits` table is missing from your database. This is required for rate limiting in the workflow.

### Step 1: Create the Missing Table

1. **Open Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `fix-missing-rate-limit-table.sql`
4. Click **Run**

### Step 2: Verify the Fix

Run this verification query in Supabase SQL Editor:

```sql
SELECT 
    'Table exists: ' || CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'daily_report_limits'
    ) THEN '✅ YES' ELSE '❌ NO' END as table_check,
    
    'Function exists: ' || CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'check_and_increment_daily_limit'
    ) THEN '✅ YES' ELSE '❌ NO' END as function_check;
```

Expected result:
```
table_check: Table exists: ✅ YES
function_check: Function exists: ✅ YES
```

### Step 3: Test the Diagnostic Script

Now you can run the corrected `check-workflow-status.sql` script:

1. Get your Clerk User ID from your app (look in browser DevTools → Application → Cookies → `__session` and decode the JWT)
2. Replace `<USER_ID>` in `check-workflow-status.sql` with your actual Clerk user ID
3. Run the script in Supabase SQL Editor

## 📋 What This Creates

### Table: `daily_report_limits`

Tracks daily report generation to enforce the 10 reports/day limit during launch phase.

**Columns:**
- `id` (uuid) - Primary key
- `user_id` (text) - Clerk user ID
- `ip_address` (text) - User's IP address (for anonymous tracking)
- `report_date` (date) - Date of the reports
- `reports_generated` (integer) - Count of reports generated
- `last_report_at` (timestamptz) - Last report generation timestamp
- `created_at` (timestamptz) - Record creation timestamp
- `updated_at` (timestamptz) - Record update timestamp

### Function: `check_and_increment_daily_limit()`

Called by the workflow to check if a user has exceeded their daily limit.

**Parameters:**
- `p_user_id` (text) - Clerk user ID
- `p_ip_address` (text) - User's IP address
- `p_daily_limit` (integer) - Daily limit (default: 10)

**Returns:** JSON with:
```json
{
  "allowed": true/false,
  "current_count": 1,
  "daily_limit": 10,
  "remaining": 9,
  "reset_time": "2025-10-02T00:00:00Z",
  "message": "Report generation approved"
}
```

### Function: `get_daily_usage_stats()`

Gets current usage statistics for a user.

**Parameters:**
- `p_user_id` (text) - Optional Clerk user ID
- `p_ip_address` (text) - Optional IP address

**Returns:** JSON with usage stats

## 🔍 Why This Happened

The table might be missing because:

1. **Migration not run** - The migration files exist but weren't executed on your Supabase instance
2. **Table dropped accidentally** - Someone ran a DROP TABLE command
3. **Schema reset** - Database was reset without re-running migrations
4. **Wrong database** - Connected to a different Supabase project

## 🚀 After Fixing

Once the table is created, you should be able to:

1. ✅ Run the diagnostic script without errors
2. ✅ Complete onboarding and trigger workflows
3. ✅ See rate limit checks in workflow logs
4. ✅ View your usage in the dashboard

## 🆘 Still Having Issues?

### Check if migrations folder exists:

```bash
ls supabase/migrations/
```

Should contain:
- `20250927060000_add_rate_limiting.sql`
- `20250930050000_fix_rate_limiting_for_clerk.sql`
- `20250930053000_recreate_daily_limits_constraints.sql`

### Manually apply migrations:

If migrations exist but weren't applied:

1. Open each migration file in order
2. Copy contents
3. Run in Supabase SQL Editor

### Check database connection:

Make sure you're connected to the correct Supabase project:

```bash
# Check your .env or environment variables
echo $VITE_SUPABASE_URL
echo $SUPABASE_URL
```

## 📞 Next Steps

After fixing the table issue, continue with the diagnostic process:

1. ✅ **Table created** - You're here!
2. 🔍 **Run diagnostic script** - Use `check-workflow-status.sql`
3. 🔎 **Check workflow logs** - Look for API errors in Supabase Edge Functions logs
4. 🛠️ **Fix API issues** - Follow recommendations in `API_FAILURE_ANALYSIS.md`

---

## Common Follow-up Errors

### "User ID not found"

Your Clerk user ID format might be wrong. Clerk user IDs look like:
- `user_2xxxxxxxxxxxxxxxxxxxxx` (starts with `user_`)

### "Rate limit check failed"

The function might need the service role key. Check that edge functions have:
- `SERVICE_ROLE_KEY` environment variable set
- Proper permissions in Supabase Dashboard → Settings → API

### "ON CONFLICT clause violates constraint"

If you see constraint violations, check that:
- Only one record exists per user per day
- IP address uniqueness is properly handled
- Old data is cleaned up (run `SELECT cleanup_old_daily_limits();`)
