# Clerk Authentication Setup

This guide will help you set up Clerk authentication to replace Supabase Auth.

## Why Clerk?

- **Better UX**: More reliable signup/signin flows
- **Better DX**: Easier to implement and debug
- **More Features**: Built-in user management, webhooks, etc.
- **Fixes Issues**: Solves current Supabase Auth signup problems

## 1. Create Clerk Account

1. Go to [clerk.com](https://clerk.com) and create a free account
2. Create a new application
3. Choose your authentication methods (Email, Google, etc.)

## 2. Get API Keys

From your Clerk dashboard:

1. **Publishable Key**: Found in "API Keys" section
   - Copy the "Publishable key" (starts with `pk_test_`)
   
2. **Secret Key**: Found in "API Keys" section  
   - Copy the "Secret key" (starts with `sk_test_`)

## 3. Environment Variables

Add to your `.env` file:

```bash
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here
```

## 4. Test Authentication

1. Start your frontend: `npm run dev`
2. Go to `/clerk-auth` route
3. Try signing up/signing in
4. Check console for any errors

## 5. Migration Benefits

✅ **Frontend Changes**:
- New `/clerk-auth` route with better UX
- Keeps existing `/auth` route as fallback
- Same `useAuth()` hook interface

✅ **Backend Changes**:  
- Edge functions support both Clerk and Supabase tokens
- Backward compatible - no breaking changes
- Better error handling

✅ **User Experience**:
- Faster signup/signin
- Better error messages
- More reliable authentication

## 6. Troubleshooting

**"Clerk not configured" error:**
- Check your `VITE_CLERK_PUBLISHABLE_KEY` is set correctly
- Make sure you're using the publishable key (starts with `pk_`)

**Token verification fails:**
- Check your `CLERK_SECRET_KEY` is set in Supabase Edge Functions
- Make sure you're using the secret key (starts with `sk_`)

**Database errors:**
- User data is stored in same Supabase tables
- Clerk user IDs are used as foreign keys
- No data migration needed

## 7. Deployment

1. Add Clerk environment variables to:
   - **Cloudflare Pages**: For frontend (VITE_CLERK_PUBLISHABLE_KEY)
   - **Supabase Edge Functions**: For backend (CLERK_SECRET_KEY)

2. Test the deployed app authentication flow

3. Update your landing page links to point to `/clerk-auth`

## 8. Next Steps

Once Clerk is working:
1. You can remove Supabase Auth dependencies
2. Update all auth links to use `/clerk-auth`
3. Remove the fallback `/auth` route
4. Clean up old auth provider files
