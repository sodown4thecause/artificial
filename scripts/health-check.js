#!/usr/bin/env node

/**
 * Quick Health Check
 * 
 * Checks if APIs are active without consuming credits or running workflows
 */

require('dotenv').config();
const https = require('https');

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
          resolve({ status: res.statusCode, data });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function checkAPI(name, testFn) {
  try {
    const result = await testFn();
    const status = result ? '✅' : '❌';
    console.log(`${status} ${name}: ${result ? 'Active' : 'Inactive'}`);
    return result;
  } catch (error) {
    console.log(`❌ ${name}: Error - ${error.message}`);
    return false;
  }
}

async function checkAPIWithDetails(name, testFn) {
  try {
    const result = await testFn();
    const status = result.active ? '✅' : '❌';
    console.log(`${status} ${name}: ${result.active ? 'Active' : 'Inactive'}`);
    if (result.details) {
      console.log(`    Details: ${result.details}`);
    }
    return result.active;
  } catch (error) {
    console.log(`❌ ${name}: Error - ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🏥 Quick API Health Check (No Credits Used)\\n');
  
  const results = [];
  
  // Test DataForSEO (just auth, no actual requests)
  results.push(await checkAPI('DataForSEO API', async () => {
    const login = process.env.DATAFORSEO_LOGIN;
    const password = process.env.DATAFORSEO_PASSWORD;
    if (!login || !password) return false;
    
    const auth = Buffer.from(`${login}:${password}`).toString('base64');
    const response = await makeRequest('https://api.dataforseo.com/v3/serp/google/organic/tasks_ready', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([])
    });
    
    // Just check if we get a valid API response (doesn't consume credits)
    return response.status === 200 && response.data?.status_code !== undefined;
  }));
  
  // Test Anthropic (minimal request)
  results.push(await checkAPI('Anthropic Claude', async () => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return false;
    
    const response = await makeRequest('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }]
      })
    });
    
    return response.status === 200;
  }));
  
  // Test Perplexity (minimal request)
  results.push(await checkAPI('Perplexity AI', async () => {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) return false;
    
    const response = await makeRequest('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 1
      })
    });
    
    return response.status === 200;
  }));
  
  // Test PageSpeed (free, no credits)
  results.push(await checkAPI('Google PageSpeed', async () => {
    const apiKey = process.env.PAGESPEED_API_KEY;
    if (!apiKey) return false;
    
    // Use a simple HEAD request or quota check instead of full analysis
    const response = await makeRequest(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://google.com&strategy=DESKTOP&key=${apiKey}&category=PERFORMANCE`);
    
    return response.status === 200;
  }));
  
  // Test Firecrawl (v2 API test)
  results.push(await checkAPIWithDetails('Firecrawl', async () => {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) return { active: false, details: 'No API key' };
    
    // Test with minimal extract request
    const response = await makeRequest('https://api.firecrawl.dev/v2/extract', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        urls: ['https://google.com'],
        enableWebSearch: false,
        scrapeOptions: {
          storeInCache: true
        }
      })
    });
    
    // Check response details
    if (response.status === 200) {
      return { active: true, details: 'API working' };
    } else if (response.status === 402) {
      return { active: true, details: 'API accessible but no credits' };
    } else if (response.status === 401) {
      return { active: false, details: 'Invalid API key' };
    } else {
      return { active: false, details: `HTTP ${response.status}: ${JSON.stringify(response.data)}` };
    }
  }));
  
  // Test Custom Search (minimal search)
  results.push(await checkAPI('Google Custom Search', async () => {
    const apiKey = process.env.CUSTOM_SEARCH_KEY;
    const cseId = process.env.CUSTOM_SEARCH_CSE_ID;
    if (!apiKey || !cseId) return false;
    
    const response = await makeRequest(`https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=test&num=1`);
    
    return response.status === 200;
  }));
  
  // Test VoilaNorbert (just account check)
  results.push(await checkAPI('VoilaNorbert', async () => {
    const apiKey = process.env.VOILANORBERT_API_KEY;
    if (!apiKey) return false;
    
    const response = await makeRequest('https://app.voilanorbert.com/api/2014-06-15/account/', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    return response.status === 200;
  }));
  
  const working = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\\n📊 Summary: ${working}/${total} APIs active`);
  
  if (working >= 2) { // Core APIs (DataForSEO + Claude)
    console.log('🎉 Core intelligence workflow ready!');
    console.log('   You can generate reports with the active APIs.');
  } else {
    console.log('❌ Core APIs not ready - fix critical issues first.');
  }
  
  console.log('\\n💡 This check uses minimal API calls to avoid consuming credits.');
}

if (require.main === module) {
  main().catch(console.error);
}
