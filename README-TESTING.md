# BI Dashboard - Testing & Monitoring Guide

This guide explains how to test and monitor your BI Dashboard workflow system to ensure all APIs and endpoints are working correctly.

## 🎯 Overview

Your BI Dashboard is a comprehensive intelligence platform that delivers actionable insights through an integrated API workflow. Every component is essential for generating complete competitive intelligence reports:

## 🎯 Intelligence Workflow Components

### **Real-Time Search Performance Monitoring**
- **DataForSEO SERP API** - Track rankings across Google, Bing, and Yahoo instantly
- **DataForSEO Keywords Data API** - Monitor SERP features, competitor positions, and ranking fluctuations

### **Advanced Keyword Research & Opportunity Discovery**  
- **DataForSEO AI Optimization API** - Discover high-value keywords competitors miss
- **DataForSEO Labs API** - Access search volume, CPC metrics, competition scores, and clickstream analytics

### **AI-Powered Content Optimization**
- **Anthropic Claude** - Create content that ranks and converts using real-time LLM benchmarking
- **Perplexity AI** - Synthesize live market data for conversational search optimization

### **Comprehensive Competitive Analysis**
- **Firecrawl** - Analyze competitor content strategies, technology stacks, and site structures  
- **DataForSEO Domain Analytics API** - Reveal traffic sources and competitive strategies
- **DataForSEO Business Data API** - Access comprehensive business intelligence

### **Technical SEO & Site Performance**
- **Google PageSpeed** - Monitor Core Web Vitals and technical health
- **DataForSEO OnPage API** - Crawl websites with customizable parameters for technical SEO

### **Enterprise Backlink Intelligence**
- **DataForSEO Backlinks API** - Build authority with data-driven link strategies and quality metrics

### **Business Intelligence & Contact Discovery**
- **VoilaNorbert** - Enrich contact data and business profiles
- **Google Custom Search** - Discover relevant content and market intelligence

### **Content Analysis & Brand Monitoring**
- **DataForSEO Content Analysis API** - Robust sentiment analysis and citation management

**All APIs feed into Claude's comprehensive report generation with dashboard visualizations, graphs, and charts.**

Note: Stripe handles payment processing and billing separately from the intelligence workflow.

## 🧪 Testing Tools

### 1. Environment Configuration Checker

First, ensure all your environment variables are properly configured:

```bash
node scripts/check-environment.js
```

This will:
- ✅ Check all required API keys and credentials
- 🔧 Generate a `.env.template` file with missing variables
- 📋 Provide setup instructions for each service
- ⚠️ Identify critical vs. optional configurations

### 2. Complete API Integration Testing

Test all your API integrations and workflow endpoints:

```bash
node scripts/test-workflow.js
```

**Options:**
- `--skip-integrations` - Skip testing external APIs
- `--skip-endpoints` - Skip testing workflow endpoints  
- `--help` - Show all available options

**What it tests:**
- 🔐 Authentication with all critical intelligence APIs
- 📊 DataForSEO comprehensive API (9 endpoints for complete SEO intelligence)
- 🚀 Google PageSpeed API for Core Web Vitals analysis
- 🔍 Firecrawl for competitive content analysis
- 🧠 Anthropic Claude for AI-powered insights generation
- 🌐 Perplexity AI for real-time market intelligence synthesis
- 🔎 Google Custom Search for content discovery
- 📧 VoilaNorbert for business intelligence and contact enrichment
- 🏗️ Supabase database connectivity
- 🚪 All workflow endpoints accessibility

### 3. Single Workflow Testing

Test a complete workflow end-to-end with a real website:

**Dry Run (test integrations without saving data):**
```bash
curl -X POST "YOUR_SUPABASE_URL/functions/v1/test-single-workflow" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "websiteUrl": "https://example.com",
    "industry": "technology",
    "location": "United States",
    "dryRun": true
  }'
```

**Full Test (complete workflow with cleanup):**
```bash
curl -X POST "YOUR_SUPABASE_URL/functions/v1/test-single-workflow" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "websiteUrl": "https://example.com",
    "industry": "technology",
    "location": "United States",
    "dryRun": false
  }'
```

## 📊 Monitoring Dashboard

### Real-time Monitoring

Get a comprehensive health report of your system:

```bash
node scripts/test-workflow.js --monitor
```

**Generate HTML Report:**
```bash
node scripts/test-workflow.js --monitor --html
```

**Direct API Call:**
```bash
curl "YOUR_SUPABASE_URL/functions/v1/monitor-workflow" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

**HTML Dashboard:**
```bash
curl "YOUR_SUPABASE_URL/functions/v1/monitor-workflow?format=html" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

### What the Monitor Tracks

**System Health Score** (0-100%):
- Workflow success rates
- API response times
- Database connectivity
- Failed/stuck workflows

**Workflow Statistics:**
- Total runs (configurable timeframe)
- Success/failure rates
- Average execution time
- Recent activity

**API Health Status:**
- Connection status for each service
- Response times
- Error rates and messages
- Rate limit warnings

**Database Health:**
- Connection status
- Table accessibility
- Data integrity checks

**Smart Recommendations:**
- Identifies issues requiring attention
- Suggests optimizations
- Alerts for low API credits/quotas

## 🚨 Troubleshooting Common Issues

### DataForSEO Connection Failures

```bash
# Check your DataForSEO balance and limits
curl -u "YOUR_LOGIN:YOUR_PASSWORD" \
  "https://api.dataforseo.com/v3/user/money_balance"

curl -u "YOUR_LOGIN:YOUR_PASSWORD" \
  "https://api.dataforseo.com/v3/user/limits"
```

**Common Solutions:**
- Verify login/password in environment variables
- Check account balance (needs $50+ recommended for full intelligence reports)
- Ensure API access is enabled for all DataForSEO endpoints
- Monitor rate limits across different endpoint usage

### Anthropic Claude API Issues

```bash
# Test your Anthropic API key
curl -X POST "https://api.anthropic.com/v1/messages" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3-haiku-20240307",
    "max_tokens": 10,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

**Common Solutions:**
- Verify API key is correct and active
- Check account credits/billing (Claude is essential for report generation)
- Ensure proper headers are sent
- Monitor token usage for cost optimization

### Database Connection Issues

```bash
# Test Supabase connection
curl "YOUR_SUPABASE_URL/rest/v1/workflow_runs?select=id&limit=1" \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

**Common Solutions:**
- Verify SUPABASE_URL format (should end with `.supabase.co`)
- Check SERVICE_ROLE_KEY (not the anon key)
- Ensure database tables exist (run migrations)

## 📅 Scheduled Monitoring

### Set Up Continuous Monitoring

1. **GitHub Actions** (recommended):
```yaml
# .github/workflows/monitor-workflow.yml
name: Workflow Health Check
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Check workflow health
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SERVICE_ROLE_KEY: ${{ secrets.SERVICE_ROLE_KEY }}
        run: node scripts/test-workflow.js --monitor
```

2. **Cron Job** (Linux/Mac):
```bash
# Add to crontab: crontab -e
0 */6 * * * cd /path/to/your/project && node scripts/test-workflow.js --monitor > logs/health-check.log 2>&1
```

3. **External Monitoring** (UptimeRobot, Pingdom, etc.):
Monitor your main endpoints:
- `YOUR_SUPABASE_URL/functions/v1/monitor-workflow`
- `YOUR_SUPABASE_URL/functions/v1/reports-latest`

## 📋 Test Results Interpretation

### Healthy System Example
```json
{
  "system_health": 95,
  "workflow_stats": {
    "success_rate": 98.5,
    "avg_duration_minutes": 12.3
  },
  "api_health": [
    {"service": "DataForSEO", "status": "healthy", "response_time_ms": 245},
    {"service": "Anthropic", "status": "healthy", "response_time_ms": 1200}
  ]
}
```

### System with Issues Example
```json
{
  "system_health": 65,
  "workflow_stats": {
    "success_rate": 75.0,
    "running_runs": 8
  },
  "api_health": [
    {"service": "DataForSEO", "status": "down", "error_message": "Authentication failed"},
    {"service": "PageSpeed", "status": "degraded", "response_time_ms": 8500}
  ],
  "recommendations": [
    {
      "priority": "high",
      "category": "api", 
      "message": "DataForSEO API is down. Check credentials and service status."
    }
  ]
}
```

## 🔄 Integration with CI/CD

Add testing to your deployment pipeline:

```bash
# Before deployment
npm run test
node scripts/check-environment.js
node scripts/test-workflow.js

# After deployment  
node scripts/test-workflow.js --monitor
```

## 📞 Getting Help

1. **Check the logs**: All tools save detailed logs to the `logs/` directory
2. **Review environment**: Run `node scripts/check-environment.js` first
3. **Test individual APIs**: Use the monitoring dashboard to identify which service is failing
4. **Verify credentials**: Most issues are related to API keys or account limits

## 🔧 Custom Testing

You can extend the testing framework by:

1. **Adding new API tests** in `supabase/functions/test-workflow/tests/`
2. **Custom monitoring checks** in `supabase/functions/monitor-workflow/`
3. **Workflow-specific tests** using `test-single-workflow`

The testing framework is modular and designed to be easily extended as your system grows.
