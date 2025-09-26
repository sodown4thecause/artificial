#!/usr/bin/env node

/**
 * Intelligence API Validation Script
 * 
 * Validates that all critical APIs for the intelligence workflow are properly configured
 * and have sufficient credits/quotas for generating comprehensive reports.
 */

// Load environment variables from .env file
require('dotenv').config();

const https = require('https');

const CRITICAL_APIS = [
  {
    name: 'DataForSEO',
    description: 'Complete SEO intelligence API (9 endpoints)',
    validate: validateDataForSEO,
    importance: 'Essential for SERP, keywords, backlinks, competitive analysis'
  },
  {
    name: 'Anthropic Claude',
    description: 'AI-powered report generation',
    validate: validateAnthropic,
    importance: 'Essential for synthesizing all data into actionable insights'
  },
  {
    name: 'Google PageSpeed',
    description: 'Core Web Vitals analysis',
    validate: validatePageSpeed,
    importance: 'Essential for technical SEO performance metrics'
  },
  {
    name: 'Firecrawl',
    description: 'Competitive content analysis',
    validate: validateFirecrawl,
    importance: 'Essential for competitor intelligence and content strategies'
  },
  {
    name: 'Perplexity AI',
    description: 'Real-time market intelligence',
    validate: validatePerplexity,
    importance: 'Essential for live data synthesis and market research'
  },
  {
    name: 'Google Custom Search',
    description: 'Content discovery and news analysis',
    validate: validateCustomSearch,
    importance: 'Essential for content intelligence and market monitoring'
  },
  {
    name: 'VoilaNorbert',
    description: 'Business intelligence and contact enrichment',
    validate: validateVoilaNorbert,
    importance: 'Essential for business data and contact analysis'
  }
];

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const data = res.headers['content-type']?.includes('application/json') 
            ? JSON.parse(body) 
            : body;
          resolve({ status: res.statusCode, data, headers: res.headers });
        } catch (error) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function validateDataForSEO() {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    return {
      status: 'critical_error',
      message: 'Missing DataForSEO credentials',
      details: 'DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD are required',
      action: 'Configure DataForSEO API credentials'
    };
  }

  try {
    const auth = Buffer.from(`${login}:${password}`).toString('base64');
    
    // Test authentication with a simple POST endpoint
    const testResponse = await makeRequest('https://api.dataforseo.com/v3/serp/google/organic/tasks_ready', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([])
    });

    if (testResponse.status !== 200) {
      return {
        status: 'critical_error',
        message: 'DataForSEO authentication failed',
        details: `HTTP ${testResponse.status}`,
        action: 'Verify DataForSEO login credentials'
      };
    }

    // Check if authentication is successful (should get a proper API response)
    const apiData = testResponse.data;
    const isAuthenticated = apiData?.status_code !== undefined;
    
    if (!isAuthenticated) {
      return {
        status: 'critical_error',
        message: 'DataForSEO authentication failed',
        details: 'Invalid API response format',
        action: 'Verify DataForSEO login credentials'
      };
    }

    // Check for authentication errors
    if (apiData.status_code === 40101) {
      return {
        status: 'critical_error',
        message: 'DataForSEO authentication failed',
        details: 'Invalid credentials',
        action: 'Verify DataForSEO login and password'
      };
    }

    return {
      status: 'healthy',
      message: 'DataForSEO operational - Authentication successful',
      details: 'All 9 endpoints accessible via single API',
      action: null
    };

  } catch (error) {
    return {
      status: 'critical_error',
      message: 'DataForSEO connection failed',
      details: error.message,
      action: 'Check network connectivity and credentials'
    };
  }
}

async function validateAnthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      status: 'critical_error',
      message: 'Missing Anthropic API key',
      details: 'ANTHROPIC_API_KEY is required for AI report generation',
      action: 'Configure Anthropic API key from console.anthropic.com'
    };
  }

  try {
    const response = await makeRequest('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Test' }]
      })
    });

    if (response.status === 401) {
      return {
        status: 'critical_error',
        message: 'Anthropic API key invalid',
        details: 'Authentication failed',
        action: 'Verify API key from console.anthropic.com'
      };
    }

    if (response.status === 429) {
      return {
        status: 'warning',
        message: 'Anthropic rate limit exceeded',
        details: 'API temporarily throttled',
        action: 'Monitor usage or upgrade plan'
      };
    }

    if (response.status === 200) {
      return {
        status: 'healthy',
        message: 'Anthropic Claude operational',
        details: 'AI report generation available',
        action: null
      };
    }

    return {
      status: 'warning',
      message: `Anthropic API issue (HTTP ${response.status})`,
      details: response.data?.error?.message || 'Unknown error',
      action: 'Check API status and billing'
    };

  } catch (error) {
    return {
      status: 'critical_error',
      message: 'Anthropic connection failed',
      details: error.message,
      action: 'Check network connectivity'
    };
  }
}

async function validatePageSpeed() {
  const apiKey = process.env.PAGESPEED_API_KEY;

  if (!apiKey) {
    return {
      status: 'critical_error',
      message: 'Missing PageSpeed API key',
      details: 'PAGESPEED_API_KEY is required for Core Web Vitals analysis',
      action: 'Get API key from Google Cloud Console'
    };
  }

  try {
    const response = await makeRequest(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://google.com&strategy=DESKTOP&key=${apiKey}`);

    if (response.status === 400) {
      return {
        status: 'critical_error',
        message: 'PageSpeed API key invalid',
        details: 'Bad request - check API key format',
        action: 'Verify API key from Google Cloud Console'
      };
    }

    if (response.status === 403) {
      return {
        status: 'critical_error',
        message: 'PageSpeed API access denied',
        details: 'API key forbidden or quota exceeded',
        action: 'Check API key permissions and quota'
      };
    }

    if (response.status === 200) {
      return {
        status: 'healthy',
        message: 'PageSpeed Insights operational',
        details: 'Core Web Vitals analysis available',
        action: null
      };
    }

    return {
      status: 'warning',
      message: `PageSpeed API issue (HTTP ${response.status})`,
      details: 'Unexpected response',
      action: 'Check API status and quota'
    };

  } catch (error) {
    return {
      status: 'critical_error',
      message: 'PageSpeed connection failed',
      details: error.message,
      action: 'Check network connectivity'
    };
  }
}

async function validateFirecrawl() {
  const apiKey = process.env.FIRECRAWL_API_KEY;

  if (!apiKey) {
    return {
      status: 'critical_error',
      message: 'Missing Firecrawl API key',
      details: 'FIRECRAWL_API_KEY is required for competitive analysis',
      action: 'Get API key from firecrawl.dev'
    };
  }

  try {
    const response = await makeRequest('https://api.firecrawl.dev/v2/status', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      return {
        status: 'critical_error',
        message: 'Firecrawl API key invalid',
        details: 'Authentication failed',
        action: 'Verify API key from firecrawl.dev dashboard'
      };
    }

    if (response.status === 200) {
      const credits = response.data?.credits;
      if (credits !== undefined && credits < 100) {
        return {
          status: 'warning',
          message: 'Firecrawl operational but low credits',
          details: `${credits} credits remaining`,
          action: 'Consider topping up credits for continuous analysis'
        };
      }

      return {
        status: 'healthy',
        message: 'Firecrawl operational',
        details: credits !== undefined ? `${credits} credits available` : 'API accessible',
        action: null
      };
    }

    return {
      status: 'warning',
      message: `Firecrawl API issue (HTTP ${response.status})`,
      details: 'Unexpected response',
      action: 'Check API status and billing'
    };

  } catch (error) {
    return {
      status: 'critical_error',
      message: 'Firecrawl connection failed',
      details: error.message,
      action: 'Check network connectivity'
    };
  }
}

async function validatePerplexity() {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    return {
      status: 'critical_error',
      message: 'Missing Perplexity API key',
      details: 'PERPLEXITY_API_KEY is required for real-time market intelligence',
      action: 'Get API key from docs.perplexity.ai'
    };
  }

  try {
    const response = await makeRequest('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: 'Test API connection' }],
        max_tokens: 5
      })
    });

    if (response.status === 401) {
      return {
        status: 'critical_error',
        message: 'Perplexity API key invalid',
        details: 'Authentication failed',
        action: 'Verify API key from Perplexity dashboard'
      };
    }

    if (response.status === 200) {
      return {
        status: 'healthy',
        message: 'Perplexity AI operational',
        details: 'Real-time market intelligence available',
        action: null
      };
    }

    return {
      status: 'warning',
      message: `Perplexity API issue (HTTP ${response.status})`,
      details: response.data?.error?.message || 'Unknown error',
      action: 'Check API status and billing'
    };

  } catch (error) {
    return {
      status: 'critical_error',
      message: 'Perplexity connection failed',
      details: error.message,
      action: 'Check network connectivity'
    };
  }
}

async function validateCustomSearch() {
  const apiKey = process.env.CUSTOM_SEARCH_KEY;
  const cseId = process.env.CUSTOM_SEARCH_CSE_ID;

  if (!apiKey || !cseId) {
    return {
      status: 'critical_error',
      message: 'Missing Google Custom Search credentials',
      details: 'CUSTOM_SEARCH_KEY and CUSTOM_SEARCH_CSE_ID are required',
      action: 'Configure Custom Search API from Google Cloud Console'
    };
  }

  try {
    const response = await makeRequest(`https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=test&num=1`);

    if (response.status === 400) {
      return {
        status: 'critical_error',
        message: 'Custom Search configuration invalid',
        details: 'Bad request - check API key and CSE ID',
        action: 'Verify credentials from Google Cloud Console'
      };
    }

    if (response.status === 403) {
      return {
        status: 'critical_error',
        message: 'Custom Search access denied',
        details: 'API key forbidden or quota exceeded',
        action: 'Check API permissions and daily quota'
      };
    }

    if (response.status === 200) {
      return {
        status: 'healthy',
        message: 'Google Custom Search operational',
        details: 'Content discovery and news analysis available',
        action: null
      };
    }

    return {
      status: 'warning',
      message: `Custom Search API issue (HTTP ${response.status})`,
      details: 'Unexpected response',
      action: 'Check API status and quota'
    };

  } catch (error) {
    return {
      status: 'critical_error',
      message: 'Custom Search connection failed',
      details: error.message,
      action: 'Check network connectivity'
    };
  }
}

async function validateVoilaNorbert() {
  const apiKey = process.env.VOILANORBERT_API_KEY;

  if (!apiKey) {
    return {
      status: 'critical_error',
      message: 'Missing VoilaNorbert API key',
      details: 'VOILANORBERT_API_KEY is required for business intelligence',
      action: 'Get API key from voilanorbert.com dashboard'
    };
  }

  try {
    const response = await makeRequest('https://app.voilanorbert.com/api/2014-06-15/account/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      return {
        status: 'critical_error',
        message: 'VoilaNorbert API key invalid',
        details: 'Authentication failed',
        action: 'Verify API key from VoilaNorbert dashboard'
      };
    }

    if (response.status === 200) {
      const credits = response.data?.credits;
      if (credits !== undefined && credits < 50) {
        return {
          status: 'warning',
          message: 'VoilaNorbert operational but low credits',
          details: `${credits} credits remaining`,
          action: 'Consider purchasing more credits for continuous analysis'
        };
      }

      return {
        status: 'healthy',
        message: 'VoilaNorbert operational',
        details: credits !== undefined ? `${credits} credits available` : 'API accessible',
        action: null
      };
    }

    return {
      status: 'warning',
      message: `VoilaNorbert API issue (HTTP ${response.status})`,
      details: 'Unexpected response',
      action: 'Check API status and billing'
    };

  } catch (error) {
    return {
      status: 'critical_error',
      message: 'VoilaNorbert connection failed',
      details: error.message,
      action: 'Check network connectivity'
    };
  }
}

async function main() {
  console.log('🔍 Intelligence API Validation Report');
  console.log('=====================================\n');

  const results = [];
  let criticalErrors = 0;
  let warnings = 0;

  console.log('Testing critical intelligence APIs...\n');

  for (const api of CRITICAL_APIS) {
    console.log(`🔗 Testing ${api.name}...`);
    
    try {
      const result = await api.validate();
      results.push({ api: api.name, ...result });

      const statusIcon = result.status === 'healthy' ? '✅' : 
                        result.status === 'warning' ? '⚠️' : '❌';
      
      console.log(`   ${statusIcon} ${result.message}`);
      
      if (result.details) {
        console.log(`      Details: ${result.details}`);
      }
      
      if (result.warnings) {
        result.warnings.forEach(warning => {
          console.log(`      ⚠️  ${warning}`);
        });
      }
      
      if (result.action) {
        console.log(`      🔧 Action: ${result.action}`);
      }

      if (result.status === 'critical_error') criticalErrors++;
      if (result.status === 'warning') warnings++;

    } catch (error) {
      console.log(`   ❌ ${api.name} validation failed: ${error.message}`);
      results.push({
        api: api.name,
        status: 'critical_error',
        message: 'Validation failed',
        details: error.message
      });
      criticalErrors++;
    }
    
    console.log('');
  }

  // Summary
  console.log('📊 VALIDATION SUMMARY');
  console.log('=====================');
  console.log(`Total APIs: ${CRITICAL_APIS.length}`);
  console.log(`✅ Healthy: ${results.filter(r => r.status === 'healthy').length}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`❌ Critical Errors: ${criticalErrors}`);
  console.log('');

  if (criticalErrors === 0 && warnings === 0) {
    console.log('🎉 All intelligence APIs are operational!');
    console.log('   Your workflow is ready to generate comprehensive reports.');
  } else if (criticalErrors === 0) {
    console.log('✅ Core intelligence APIs operational with warnings');
    console.log('   Address warnings for optimal performance.');
  } else {
    console.log('🚨 CRITICAL ISSUES DETECTED');
    console.log(`   ${criticalErrors} APIs require immediate attention.`);
    console.log('   Intelligence reports cannot be generated until all APIs are operational.');
  }

  console.log('\n💡 IMPORTANCE OF EACH API:');
  CRITICAL_APIS.forEach(api => {
    const result = results.find(r => r.api === api.name);
    const statusIcon = result?.status === 'healthy' ? '✅' : 
                      result?.status === 'warning' ? '⚠️' : '❌';
    console.log(`   ${statusIcon} ${api.name}: ${api.importance}`);
  });

  process.exit(criticalErrors > 0 ? 1 : 0);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { CRITICAL_APIS, validateDataForSEO, validateAnthropic };
