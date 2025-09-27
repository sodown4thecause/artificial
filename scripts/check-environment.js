#!/usr/bin/env node

/**
 * Environment Configuration Checker
 * 
 * This script validates all required environment variables and API credentials
 * for the BI Dashboard workflow system.
 */

// Load environment variables from .env file
require('dotenv').config();

const fs = require('fs');
const path = require('path');

// Required environment variables
const REQUIRED_ENV_VARS = {
  // Supabase
  'SUPABASE_URL': 'Supabase project URL',
  'SERVICE_ROLE_KEY': 'Supabase service role key',
  
  // DataForSEO (Critical)
  'DATAFORSEO_LOGIN': 'DataForSEO API login',
  'DATAFORSEO_PASSWORD': 'DataForSEO API password',
  
  // AI Services (Critical)
  'ANTHROPIC_API_KEY': 'Anthropic Claude API key for AI insights',
  
  // Intelligence Workflow APIs (All Critical)
  'PAGESPEED_API_KEY': 'Google PageSpeed Insights API key for Core Web Vitals analysis',
  'PERPLEXITY_API_KEY': 'Perplexity API key for real-time market intelligence',
  'CUSTOM_SEARCH_KEY': 'Google Custom Search API key for news and content discovery',
  'CUSTOM_SEARCH_CSE_ID': 'Google Custom Search Engine ID for content analysis',
  'VOILANORBERT_API_KEY': 'VoilaNorbert API key for contact and business intelligence',
  
  // Workflow configuration
  'WORKFLOW_REPORT_LLM_MODEL': 'LLM model for report generation (optional)',
  'SCHEDULER_SECRET': 'Secret key for scheduled workflows',
  'FIRECRAWL_API_KEY': 'Firecrawl API key (optional - using Jina AI Reader as free primary)',
  
  // Payment Processing (separate from workflow)
  'STRIPE_SECRET_KEY': 'Stripe secret key (for billing, not workflow)',
  'STRIPE_PRICE_ID': 'Stripe price ID for subscriptions (for billing, not workflow)',
  'STRIPE_WEBHOOK_SECRET': 'Stripe webhook secret (for billing, not workflow)',
  'STRIPE_PRICE_LOOKUP_KEY': 'Stripe price lookup key (optional)',
  'STRIPE_SUCCESS_URL': 'Stripe checkout success URL (optional)',
  'STRIPE_CANCEL_URL': 'Stripe checkout cancel URL (optional)',
  'STRIPE_PORTAL_RETURN_URL': 'Stripe customer portal return URL (optional)'
};

const CRITICAL_VARS = [
  'SUPABASE_URL',
  'SERVICE_ROLE_KEY',
  'DATAFORSEO_LOGIN',
  'DATAFORSEO_PASSWORD',
  'ANTHROPIC_API_KEY',
  'PAGESPEED_API_KEY',
  'PERPLEXITY_API_KEY',
  'CUSTOM_SEARCH_KEY',
  'CUSTOM_SEARCH_CSE_ID',
  'VOILANORBERT_API_KEY'
];

const AUTH_VARS = [
  'VITE_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY'
];

const OPTIONAL_VARS = [
  'WORKFLOW_REPORT_LLM_MODEL',
  'SCHEDULER_SECRET',
  'FIRECRAWL_API_KEY' // Now optional since we use Jina AI Reader (free) as primary
];

const BILLING_VARS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PRICE_ID',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_LOOKUP_KEY',
  'STRIPE_SUCCESS_URL',
  'STRIPE_CANCEL_URL',
  'STRIPE_PORTAL_RETURN_URL'
];

function checkEnvironmentVariables() {
  console.log('🔍 Checking Environment Variables\n');
  
  const results = {
    critical: { present: 0, missing: 0, vars: [] },
    optional: { present: 0, missing: 0, vars: [] },
    billing: { present: 0, missing: 0, vars: [] },
    all: { present: 0, missing: 0 }
  };

  // Check critical variables
  console.log('🔴 Critical Variables (required for basic functionality):');
  CRITICAL_VARS.forEach(varName => {
    const value = process.env[varName];
    const description = REQUIRED_ENV_VARS[varName];
    
    if (value) {
      console.log(`   ✅ ${varName}: Set (${description})`);
      results.critical.present++;
      results.critical.vars.push({ name: varName, status: 'present', description });
    } else {
      console.log(`   ❌ ${varName}: Missing (${description})`);
      results.critical.missing++;
      results.critical.vars.push({ name: varName, status: 'missing', description });
    }
  });

  // Check authentication variables
  console.log('\n🔐 Authentication Variables (Clerk):');
  AUTH_VARS.forEach(varName => {
    const value = process.env[varName];
    const description = REQUIRED_ENV_VARS[varName] || 'Clerk authentication configuration';
    
    if (value) {
      console.log(`   ✅ ${varName}: Set (${description})`);
      results.critical.present++;
      results.critical.vars.push({ name: varName, status: 'present', description });
    } else {
      console.log(`   ❌ ${varName}: Missing (${description})`);
      results.critical.missing++;
      results.critical.vars.push({ name: varName, status: 'missing', description });
    }
  });

  console.log('\n🟡 Configuration Variables (workflow settings):');
  OPTIONAL_VARS.forEach(varName => {
    const value = process.env[varName];
    const description = REQUIRED_ENV_VARS[varName];
    
    if (value) {
      console.log(`   ✅ ${varName}: Set (${description})`);
      results.optional.present++;
      results.optional.vars.push({ name: varName, status: 'present', description });
    } else {
      console.log(`   ⚠️  ${varName}: Missing (${description})`);
      results.optional.missing++;
      results.optional.vars.push({ name: varName, status: 'missing', description });
    }
  });

  console.log('\n💳 Billing Variables (payment processing, separate from workflow):');
  BILLING_VARS.forEach(varName => {
    const value = process.env[varName];
    const description = REQUIRED_ENV_VARS[varName];
    
    if (value) {
      console.log(`   ✅ ${varName}: Set (${description})`);
      results.billing.present++;
      results.billing.vars.push({ name: varName, status: 'present', description });
    } else {
      console.log(`   ⚠️  ${varName}: Missing (${description})`);
      results.billing.missing++;
      results.billing.vars.push({ name: varName, status: 'missing', description });
    }
  });

  results.all.present = results.critical.present + results.optional.present + results.billing.present;
  results.all.missing = results.critical.missing + results.optional.missing + results.billing.missing;

  return results;
}

function generateEnvTemplate(results) {
  console.log('\n📝 Generating .env template...');
  
  let template = `# BI Dashboard Environment Configuration
# Generated on ${new Date().toISOString()}

# =============================================================================
# CRITICAL VARIABLES (Required for basic functionality)
# =============================================================================

`;

  results.critical.vars.forEach(variable => {
    const placeholder = variable.status === 'missing' ? 'your_' + variable.name.toLowerCase() + '_here' : '[SET]';
    template += `# ${variable.description}\n`;
    template += `${variable.name}=${variable.status === 'missing' ? placeholder : '[CONFIGURED]'}\n\n`;
  });

  template += `# =============================================================================
# CONFIGURATION VARIABLES (Workflow settings)
# =============================================================================

`;

  results.optional.vars.forEach(variable => {
    const placeholder = variable.status === 'missing' ? 'your_' + variable.name.toLowerCase() + '_here' : '[SET]';
    template += `# ${variable.description}\n`;
    template += `${variable.name}=${variable.status === 'missing' ? placeholder : '[CONFIGURED]'}\n\n`;
  });

template += `# =============================================================================
# BILLING VARIABLES (Payment processing - separate from intelligence workflow)
# =============================================================================

`;

  results.billing.vars.forEach(variable => {
    const placeholder = variable.status === 'missing' ? 'your_' + variable.name.toLowerCase() + '_here' : '[SET]';
    template += `# ${variable.description}\n`;
    template += `${variable.name}=${variable.status === 'missing' ? placeholder : '[CONFIGURED]'}\n\n`;
  });

  template += `# =============================================================================
# CONFIGURATION NOTES
# =============================================================================

# DataForSEO: Register at https://dataforseo.com/ for SEO data API (9 endpoints)
# Anthropic: Get API key at https://console.anthropic.com/ for AI insights
# Stripe: Configure at https://dashboard.stripe.com/ for payments
# Google PageSpeed: Get API key at https://developers.google.com/speed/docs/insights/v5/get-started
# Firecrawl: Register at https://firecrawl.dev/ for web content analysis
# Perplexity: Get API key at https://docs.perplexity.ai/ for live web research
# Google Custom Search: Configure at https://developers.google.com/custom-search/v1/introduction
# VoilaNorbert: Register at https://www.voilanorbert.com/ for contact enrichment

# For production deployment, ensure all critical variables are set
# Optional variables can be omitted if the related features are not needed
`;

  const envPath = path.join(process.cwd(), '.env.template');
  fs.writeFileSync(envPath, template);
  console.log(`   Template saved to: ${envPath}`);
}

function generateConfigurationGuide(results) {
  const criticalMissing = results.critical.vars.filter(v => v.status === 'missing');
  
  if (criticalMissing.length === 0) {
    console.log('\n✅ All critical environment variables are configured!');
    return;
  }

  console.log('\n🔧 Configuration Guide for Missing Critical Variables:\n');

  criticalMissing.forEach(variable => {
    console.log(`❌ ${variable.name}`);
    console.log(`   Description: ${variable.description}`);
    
    switch (variable.name) {
      case 'SUPABASE_URL':
        console.log('   How to get: Go to https://supabase.com → Your Project → Settings → API → Project URL');
        break;
      case 'SERVICE_ROLE_KEY':
        console.log('   How to get: Go to https://supabase.com → Your Project → Settings → API → service_role key');
        console.log('   ⚠️  WARNING: Keep this secret! Never expose in client-side code.');
        break;
      case 'DATAFORSEO_LOGIN':
      case 'DATAFORSEO_PASSWORD':
        console.log('   How to get: Register at https://dataforseo.com/ → Dashboard → API Access');
        console.log('   Cost: Pay-per-use API credits required for 9 endpoints');
        break;
      case 'ANTHROPIC_API_KEY':
        console.log('   How to get: Register at https://console.anthropic.com/ → API Keys');
        console.log('   Cost: Pay-per-use tokens');
        break;
    }
    console.log('');
  });
}

function checkEnvFiles() {
  console.log('\n📁 Checking for environment files:');
  
  const envFiles = ['.env', '.env.local', '.env.production'];
  let foundFiles = [];
  
  envFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      foundFiles.push(file);
      console.log(`   ✅ Found: ${file}`);
    } else {
      console.log(`   ❌ Not found: ${file}`);
    }
  });

  if (foundFiles.length === 0) {
    console.log('\n   💡 Tip: Create a .env file in your project root to store environment variables');
  }

  return foundFiles;
}

function printSummary(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 ENVIRONMENT CHECK SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`Total Variables: ${results.all.present + results.all.missing}`);
  console.log(`✅ Configured: ${results.all.present}`);
  console.log(`❌ Missing: ${results.all.missing}`);
  console.log('');
  
  console.log(`🔴 Critical (workflow): ${results.critical.present}/${CRITICAL_VARS.length} configured`);
  console.log(`🟡 Configuration: ${results.optional.present}/${OPTIONAL_VARS.length} configured`);
  console.log(`💳 Billing (payments): ${results.billing.present}/${BILLING_VARS.length} configured`);
  console.log('');
  
  if (results.critical.missing === 0) {
    console.log('🎉 Your workflow environment is ready for production!');
    if (results.optional.missing > 0) {
      console.log(`💡 Consider configuring ${results.optional.missing} workflow settings for optimal performance`);
    }
    if (results.billing.missing > 0) {
      console.log(`💳 Note: ${results.billing.missing} billing variables missing - configure these for payment processing`);
    }
  } else {
    console.log(`⚠️  ${results.critical.missing} critical variables must be configured before deployment`);
    console.log('🔧 See the configuration guide above for setup instructions');
  }
  
  console.log('='.repeat(60));
}

// Main execution
function main() {
  console.log('🔍 BI Dashboard Environment Configuration Checker\n');
  
  // Check for Node.js and basic environment
  console.log(`Node.js version: ${process.version}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`Working directory: ${process.cwd()}\n`);
  
  // Check environment files
  checkEnvFiles();
  
  // Check environment variables
  const results = checkEnvironmentVariables();
  
  // Generate template and guide
  generateEnvTemplate(results);
  generateConfigurationGuide(results);
  
  // Print summary
  printSummary(results);
  
  // Exit with appropriate code
  process.exit(results.critical.missing > 0 ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = {
  checkEnvironmentVariables,
  REQUIRED_ENV_VARS,
  CRITICAL_VARS,
  OPTIONAL_VARS
};
