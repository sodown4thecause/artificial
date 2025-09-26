#!/usr/bin/env node

/**
 * Interactive Environment Setup Script
 * 
 * This script helps you set up your environment variables interactively.
 * It will guide you through configuring all the required API keys.
 */

// Load environment variables from .env file
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ENV_CONFIGS = [
  {
    section: 'Supabase Configuration',
    variables: [
      {
        name: 'SUPABASE_URL',
        description: 'Your Supabase project URL',
        help: 'Go to https://supabase.com → Your Project → Settings → API → Project URL',
        example: 'https://yourproject.supabase.co',
        required: true
      },
      {
        name: 'SERVICE_ROLE_KEY',
        description: 'Supabase service role key (keep secret!)',
        help: 'Go to https://supabase.com → Your Project → Settings → API → service_role key',
        example: 'eyJ...',
        required: true,
        secret: true
      }
    ]
  },
  {
    section: 'DataForSEO Configuration (Critical for SEO Intelligence)',
    variables: [
      {
        name: 'DATAFORSEO_LOGIN',
        description: 'DataForSEO API login email',
        help: 'Register at https://dataforseo.com/ → Dashboard → API Access',
        example: 'your-email@example.com',
        required: true
      },
      {
        name: 'DATAFORSEO_PASSWORD',
        description: 'DataForSEO API password',
        help: 'Found in DataForSEO Dashboard → API Access',
        example: 'your-api-password',
        required: true,
        secret: true
      }
    ]
  },
  {
    section: 'AI Services Configuration',
    variables: [
      {
        name: 'ANTHROPIC_API_KEY',
        description: 'Anthropic Claude API key for AI insights',
        help: 'Get from https://console.anthropic.com/ → API Keys',
        example: 'sk-ant-...',
        required: true,
        secret: true
      },
      {
        name: 'PERPLEXITY_API_KEY',
        description: 'Perplexity API key for real-time intelligence',
        help: 'Get from https://docs.perplexity.ai/',
        example: 'pplx-...',
        required: true,
        secret: true
      }
    ]
  },
  {
    section: 'Google Services Configuration',
    variables: [
      {
        name: 'PAGESPEED_API_KEY',
        description: 'Google PageSpeed Insights API key',
        help: 'Get from Google Cloud Console → APIs & Services → Credentials',
        example: 'AIza...',
        required: true,
        secret: true
      },
      {
        name: 'CUSTOM_SEARCH_KEY',
        description: 'Google Custom Search API key',
        help: 'Get from Google Cloud Console → APIs & Services → Credentials',
        example: 'AIza...',
        required: true,
        secret: true
      },
      {
        name: 'CUSTOM_SEARCH_CSE_ID',
        description: 'Google Custom Search Engine ID',
        help: 'Get from https://cse.google.com/cse/ → Your Search Engine → Setup',
        example: '0123456789abcdef0:abcdefghij',
        required: true
      }
    ]
  },
  {
    section: 'Content & Business Intelligence',
    variables: [
      {
        name: 'FIRECRAWL_API_KEY',
        description: 'Firecrawl API key for competitive analysis',
        help: 'Get from https://firecrawl.dev/ → Dashboard',
        example: 'fc-...',
        required: true,
        secret: true
      },
      {
        name: 'VOILANORBERT_API_KEY',
        description: 'VoilaNorbert API key for business intelligence',
        help: 'Get from https://www.voilanorbert.com/ → API',
        example: 'vn_...',
        required: true,
        secret: true
      }
    ]
  }
];

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function askForVariable(variable) {
  console.log(`\\n📝 ${variable.name}`);
  console.log(`   Description: ${variable.description}`);
  console.log(`   Help: ${variable.help}`);
  if (variable.example) {
    console.log(`   Example: ${variable.example}`);
  }
  
  const prompt = variable.secret 
    ? `   Enter ${variable.name} (input hidden): `
    : `   Enter ${variable.name}: `;
  
  const value = await question(prompt);
  
  if (variable.required && !value.trim()) {
    console.log('   ❌ This field is required for the intelligence workflow!');
    return await askForVariable(variable);
  }
  
  return value.trim();
}

async function setupEnvironment() {
  console.log('🔧 BI Dashboard Environment Setup');
  console.log('==================================\\n');
  
  console.log('This script will help you configure all required API keys for your intelligence workflow.');
  console.log('Each API is critical for generating comprehensive competitive intelligence reports.\\n');
  
  const proceed = await question('Continue with setup? (y/N): ');
  if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
    console.log('Setup cancelled.');
    process.exit(0);
  }

  const envVars = new Map();
  
  // Check if .env already exists
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const overwrite = await question('\\n.env file already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
      console.log('Setup cancelled.');
      process.exit(0);
    }
  }

  // Collect all variables
  for (const section of ENV_CONFIGS) {
    console.log(`\\n🔹 ${section.section}`);
    console.log('='.repeat(section.section.length + 4));
    
    for (const variable of section.variables) {
      const value = await askForVariable(variable);
      envVars.set(variable.name, value);
    }
  }

  // Generate .env content
  let envContent = `# BI Dashboard Environment Configuration
# Generated on ${new Date().toISOString()}
# 
# This file contains your API keys and configuration.
# Keep this file secure and never commit it to version control!

`;

  for (const section of ENV_CONFIGS) {
    envContent += `# =============================================================================
# ${section.section.toUpperCase()}
# =============================================================================

`;
    
    for (const variable of section.variables) {
      const value = envVars.get(variable.name);
      envContent += `# ${variable.description}\\n`;
      envContent += `${variable.name}=${value}\\n\\n`;
    }
  }

  // Add optional configuration
  envContent += `# =============================================================================
# OPTIONAL CONFIGURATION
# =============================================================================

# LLM model for report generation (leave as default)
WORKFLOW_REPORT_LLM_MODEL=claude-3-opus-20240229

# Secret key for scheduled workflows (generate a random string)
SCHEDULER_SECRET=${generateRandomSecret()}

`;

  // Write .env file
  fs.writeFileSync(envPath, envContent);
  
  console.log('\\n✅ Environment configuration completed!');
  console.log(`   .env file created at: ${envPath}`);
  console.log('\\n🔒 Security Notes:');
  console.log('   • Never commit your .env file to version control');
  console.log('   • Keep your API keys secure and private');
  console.log('   • Regularly rotate your API keys for security');
  
  console.log('\\n🚀 Next Steps:');
  console.log('   1. Test your configuration: node scripts/validate-intelligence-apis.js');
  console.log('   2. Run workflow tests: node scripts/test-workflow.js');
  console.log('   3. Start your development server');
  
  rl.close();
}

function generateRandomSecret() {
  return require('crypto').randomBytes(32).toString('hex');
}

if (require.main === module) {
  setupEnvironment().catch((error) => {
    console.error('\\nSetup failed:', error.message);
    process.exit(1);
  });
}
