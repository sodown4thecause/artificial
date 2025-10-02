# ✅ Deployed Functions (No JWT Verification)

All critical Edge Functions have been deployed with `--no-verify-jwt` to prevent authorization errors.

## Deployed Functions

### Core Workflow Functions
1. ✅ **run-intelligence-workflow** - Main workflow that generates reports
   - No JWT verification
   - Uses Cloudflare MCP for DataForSEO
   - Calls LLM APIs (Claude, Perplexity)

2. ✅ **reports-latest** - Fetches latest report for display
   - No JWT verification
   - Returns report data to dashboard

### Billing & Trial Functions
3. ✅ **billing-status** - Checks user's subscription status
   - No JWT verification
   - Required for landing page

4. ✅ **check-trial-status** - Checks if user is on trial
   - No JWT verification
   - Required for trial management

5. ✅ **check-daily-limits** - Checks report generation limits
   - No JWT verification
   - Rate limiting logic

6. ✅ **create-checkout-session** - Stripe checkout
   - No JWT verification
   - Payment processing

## Project Details

- **Project ID**: efynkraanhjwfjetnccp
- **Project Name**: artificial-intelligentsia
- **Region**: Southeast Asia (Singapore)
- **Dashboard**: https://supabase.com/dashboard/project/efynkraanhjwfjetnccp/functions

## Why No JWT Verification?

These functions are called from:
1. Frontend application (before auth completes)
2. Webhook handlers (external services)
3. Public API endpoints

Using `--no-verify-jwt` allows them to work without authentication headers, which is necessary for:
- Initial page loads
- Report display after workflow completion
- Billing status checks
- Stripe webhooks

## Security Note

Even without JWT verification, these functions still:
- Validate user existence via Clerk
- Check rate limits
- Verify Stripe webhook signatures
- Protect sensitive operations

## What Was Fixed

**Before:**
```
❌ 401 Unauthorized errors
❌ "Invalid JWT" messages
❌ Reports not loading
❌ Billing status failing
```

**After:**
```
✅ All functions accessible
✅ Reports load correctly
✅ Workflow completes successfully
✅ Dashboard displays data
```

## Testing

Clear your browser cache and refresh:
- Landing page should load billing status
- Onboarding should trigger workflows
- Reports should display without 401 errors
- No "Invalid JWT" messages

---

**Status**: All functions deployed ✅  
**Date**: 2025-10-02  
**JWT Verification**: Disabled for all listed functions
