# Quick Start Guide - AI Business Intelligence Dashboard

## 🚀 Getting Started (Fixed Issues)

I've resolved the authentication conflicts and frontend startup issues. Here's how to access your working dashboard:

### 1. 🌐 Access the Frontend
The frontend is now running. Open your browser and go to:
- **Primary URL:** `http://localhost:5173` (Vite dev server)
- **Fallback URL:** `http://localhost:3000` (if port 5173 is busy)

### 2. 🔑 Authentication Flow
1. Click **"Start Free Trial"** or **"Continue to Secure Sign-In"**
2. You'll be taken to the Supabase authentication page
3. **Sign up** with your email (first time) or **Sign in** (returning user)
4. Complete the onboarding form with:
   - **Website:** `https://artificialintelligentsia.co/`
   - **Industry:** `AI powered business intelligence`
   - **Location:** `Brisbane, Australia`

### 3. 📊 Dashboard Access
After authentication and onboarding:
- You'll be automatically redirected to `/dashboard`
- The system will trigger a workflow to generate your AI business intelligence report
- You can monitor progress and view results

## 🔧 Fixed Issues

✅ **Frontend Server:** Now using `npm run dev` (Vite) instead of `npm start`
✅ **Auth Conflict:** Temporarily using Supabase auth while Clerk is in dev mode
✅ **Dashboard Routes:** All routes now properly configured
✅ **API Connections:** Core APIs (DataForSEO, Anthropic) are operational

## 🎯 Current System Status

**Working Components:**
- ✅ Frontend interface
- ✅ Supabase authentication
- ✅ Database and workflow orchestration
- ✅ DataForSEO API (SEO data)
- ✅ Anthropic Claude API (AI insights)
- ✅ Perplexity AI (market intelligence)

**APIs Needing Attention:**
- ⚠️ PageSpeed API (timeout issues)
- ⚠️ Firecrawl API (404 errors)
- ⚠️ Google Custom Search (404 errors)
- ⚠️ VoilaNorbert (404 errors)

## 🔗 Direct Links

Once the frontend is running:
- **Landing Page:** http://localhost:5173/
- **Authentication:** http://localhost:5173/auth
- **Dashboard:** http://localhost:5173/dashboard (after login)
- **Onboarding:** http://localhost:5173/onboarding (after signup)

## 🛠️ For Full Clerk Integration (Optional)

If you want to set up Clerk authentication:

1. **Create Clerk Account:** Go to [clerk.com](https://clerk.com)
2. **Get API Keys:** Copy your publishable and secret keys
3. **Add to .env file:**
   ```bash
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
   CLERK_SECRET_KEY=sk_test_your_secret_key_here
   ```
4. **Update App.jsx:** Change back to ClerkAuthProvider

## 🎉 Success Indicators

You'll know everything is working when:
1. Frontend loads at http://localhost:5173
2. Authentication works without redirecting to Clerk dev mode
3. Onboarding form submits successfully
4. Dashboard shows your generated report
5. Report includes AI insights about artificialintelligentsia.co

## 🆘 Troubleshooting

**If frontend won't start:**
```bash
cd frontend
npm install
npm run dev
```

**If auth redirects to wrong place:**
- Clear browser cache and cookies
- Try incognito/private browsing mode

**If dashboard is empty:**
- Complete the onboarding process first
- Check that all required fields are filled
- Wait a few moments for workflow processing

## 📞 Support

The system is now properly configured for development. Your core workflow (DataForSEO + Anthropic) is operational and will generate meaningful business intelligence reports!
