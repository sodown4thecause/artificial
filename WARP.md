# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is an AI Business Intelligence Dashboard that provides comprehensive competitive intelligence reports through an integrated API workflow. The system combines SEO analytics, market intelligence, competitor analysis, and AI-powered insights generation to deliver actionable business intelligence reports.

### Architecture

- **Frontend**: React 19 with Vite, TypeScript, and Chart.js for visualizations
- **Backend**: Supabase Edge Functions (Deno/TypeScript) 
- **Database**: Supabase PostgreSQL with Row Level Security
- **Authentication**: Dual system - Clerk (primary) and Supabase Auth (fallback)
- **Deployment**: Cloudflare Pages for frontend, Supabase for backend functions

## Development Commands

### Frontend Development
```bash
cd frontend
npm install --legacy-peer-deps  # Required due to React 19 compatibility
npm run dev                     # Start development server (http://localhost:3000)
npm run build                   # Build for production
npm run preview                 # Preview production build
npm test                        # Run tests with Vitest
```

### Testing & Validation
```bash
# Environment validation
node scripts/check-environment.js

# Complete workflow testing
node scripts/test-workflow.js

# API health monitoring  
node scripts/test-workflow.js --monitor

# Test single workflow end-to-end
curl -X POST "${SUPABASE_URL}/functions/v1/test-single-workflow" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"websiteUrl": "https://example.com", "industry": "technology", "location": "United States", "dryRun": true}'
```

### Database Management
```bash
# Apply migrations (run in Supabase SQL editor)
# Files in supabase/migrations/ must be applied in order

# Deploy edge functions
supabase functions deploy

# Local Supabase development
supabase start
supabase stop
```

## Core Intelligence APIs

The system integrates with 7+ intelligence APIs to generate comprehensive reports:

### Critical APIs (Required for Core Functionality)
- **DataForSEO**: 9 endpoints for SEO intelligence (SERP, Keywords, Backlinks, etc.)
- **Anthropic Claude**: AI report generation and insights synthesis
- **Google PageSpeed**: Core Web Vitals and performance analysis
- **Firecrawl**: Competitive content analysis and site crawling
- **Perplexity AI**: Real-time market intelligence with sonar model
- **Google Custom Search**: Content discovery and brand monitoring
- **VoilaNorbert**: Business intelligence and contact enrichment

### Environment Configuration
All APIs require proper credentials in environment variables. Use `scripts/check-environment.js` to validate configuration.

## Application Architecture

### Frontend Structure
```
frontend/src/
├── components/           # Reusable UI components
│   ├── BrandedHeader.tsx
│   ├── SEOOptimizedContent.tsx
│   ├── TrialGate.jsx
│   └── onboarding/
├── pages/               # Route components  
│   ├── LandingPage.tsx
│   ├── AuthPage.jsx
│   ├── ClerkAuthPage.jsx
│   ├── OnboardingPage.tsx
│   ├── dashboard/       # Protected dashboard pages
│   └── solutions/       # Marketing pages
├── providers/           # Auth context providers
├── hooks/              # Custom React hooks
└── types/              # TypeScript definitions
```

### Backend Structure
```
supabase/functions/
├── lib/                           # Shared utilities and types
│   ├── types.ts                   # TypeScript interfaces
│   ├── utils.ts                   # Helper functions
│   └── workflow-orchestrator.ts   # Core orchestration logic
├── run-intelligence-workflow/     # Main workflow trigger
├── reports-latest/                # Report retrieval
├── monitor-workflow/              # System health monitoring
├── test-workflow/                 # API testing suite
├── test-single-workflow/          # End-to-end testing
└── billing-*/                     # Stripe integration functions
```

### Database Schema
Key tables:
- `onboarding_profiles` - User business information
- `workflow_runs` - Workflow execution tracking  
- `reports` - Generated intelligence reports
- `serp_results`, `keyword_metrics`, `backlink_metrics` - SEO data
- `content_sentiment`, `ai_insights` - Analysis results
- `technical_audits`, `business_profiles` - Additional intelligence

## Authentication Flow

The system supports dual authentication:

1. **Clerk (Primary)**: Modern auth with better UX at `/clerk-auth`
2. **Supabase Auth (Fallback)**: Legacy support at `/auth`

Both systems integrate with the same user database and workflow system.

## Workflow Process

1. **Onboarding**: User provides business details (website, industry, location)
2. **Workflow Trigger**: System initiates intelligence gathering across all APIs
3. **Data Collection**: Parallel execution of SEO, competitive, and market analysis
4. **AI Synthesis**: Claude generates comprehensive report with recommendations  
5. **Dashboard Display**: Results visualized with charts and actionable insights

## Billing Integration

- **Starter Plan**: $49/month (1 website, fortnightly reports)
- **Growth Plan**: $99/month (3 websites, 3x reports)
- **Free Trial**: 14-day trial with coupon codes
- **Stripe Integration**: Complete payment processing with webhooks

## Testing Strategy

### Development Testing
- Use `scripts/test-workflow.js` for comprehensive API validation
- Monitor system health with `scripts/test-workflow.js --monitor`
- Test individual workflows with `test-single-workflow` endpoint

### API Credit Management
- DataForSEO requires $50+ balance for full reports
- Use dry-run mode (`dryRun: true`) to test without consuming credits
- Monitor usage with built-in credit tracking

## Deployment

### Frontend (Cloudflare Pages)
```bash
# Build settings
Build command: cd frontend && npm install --legacy-peer-deps && npm run build
Build output directory: frontend/dist
Root directory: (leave empty)

# Environment variables required
NODE_VERSION=18
NPM_CONFIG_LEGACY_PEER_DEPS=true
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Backend (Supabase)
- Deploy edge functions with `supabase functions deploy`
- Configure environment secrets in Supabase dashboard
- Apply database migrations from `supabase/migrations/`

## Monitoring & Health Checks

The system includes comprehensive monitoring:
- Real-time API health status
- Workflow success/failure rates  
- Response time tracking
- Credit usage monitoring
- Automated recommendations for issues

Access monitoring at: `${SUPABASE_URL}/functions/v1/monitor-workflow`

## Development Notes

### React 19 Compatibility
- Use `npm install --legacy-peer-deps` for dependency resolution
- Some Material-UI components may have peer dependency warnings
- Vite configuration includes jsdom test environment

### API Rate Limiting
- DataForSEO: Respect rate limits across 9 endpoints
- Claude: Monitor token usage for cost optimization
- PageSpeed: Has timeout issues, implement retry logic

### Common Issues
- **Frontend won't start**: Run `npm install --legacy-peer-deps` in frontend directory
- **API failures**: Check credentials with `scripts/check-environment.js`
- **Database errors**: Ensure RLS policies are properly configured
- **Build failures**: Use Node 18 and legacy peer deps flag

## Intelligence Report Generation

The system generates comprehensive reports combining:
- SEO performance and keyword opportunities
- Competitive landscape analysis  
- Technical performance metrics (Core Web Vitals)
- Market sentiment and brand analysis
- AI-powered strategic recommendations
- Actionable insights with confidence scores

Reports are visualized with Chart.js components and include executive summaries generated by Claude.