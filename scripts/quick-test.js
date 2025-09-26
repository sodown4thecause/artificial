#!/usr/bin/env node

/**
 * Quick API Test
 * 
 * Tests your core APIs locally without needing Supabase functions
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

async function testDataForSEO() {
  console.log('🔍 Testing DataForSEO API...');
  
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  const auth = Buffer.from(`${login}:${password}`).toString('base64');
  
  try {
    const response = await makeRequest('https://api.dataforseo.com/v3/serp/google/organic/tasks_ready', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([])
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...`);
    
    if (response.data?.status_code) {
      console.log('   ✅ DataForSEO authentication successful!');
      return true;
    } else {
      console.log('   ❌ DataForSEO authentication failed');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ DataForSEO connection failed: ${error.message}`);
    return false;
  }
}

async function testAnthropic() {
  console.log('\\n🧠 Testing Anthropic Claude...');
  
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  try {
    const response = await makeRequest('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Test intelligence report generation' }]
      })
    });
    
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 200 && response.data?.content) {
      console.log('   ✅ Anthropic Claude ready for AI report generation!');
      console.log(`   Response: ${response.data.content[0]?.text}`);
      return true;
    } else {
      console.log('   ❌ Anthropic Claude failed');
      console.log(`   Error: ${JSON.stringify(response.data, null, 2)}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Anthropic connection failed: ${error.message}`);
    return false;
  }
}

async function testWorkflowCore() {
  console.log('\\n🚀 Testing Core Intelligence Workflow Components\\n');
  console.log('='.repeat(50));
  
  const results = await Promise.all([
    testDataForSEO(),
    testAnthropic()
  ]);
  
  const allWorking = results.every(r => r === true);
  
  console.log('\\n' + '='.repeat(50));
  console.log('📊 CORE WORKFLOW TEST SUMMARY');
  console.log('='.repeat(50));
  
  if (allWorking) {
    console.log('🎉 SUCCESS! Your core intelligence workflow is operational!');
    console.log('');
    console.log('✅ DataForSEO API: Ready for comprehensive SEO data');
    console.log('✅ Anthropic Claude: Ready for AI report generation');
    console.log('');
    console.log('🚀 You can now run workflows that will:');
    console.log('   • Fetch SERP rankings and keyword data');
    console.log('   • Generate AI-powered intelligence reports');
    console.log('   • Create dashboard visualizations');
    console.log('');
    console.log('💡 Next steps:');
    console.log('   • Fix the optional APIs for enhanced features');
    console.log('   • Test with a real website: node scripts/test-single-workflow.js');
    console.log('   • Deploy your Supabase functions for production');
  } else {
    console.log('❌ CORE WORKFLOW ISSUES DETECTED');
    console.log('');
    console.log('Your essential intelligence pipeline is not ready.');
    console.log('Fix the issues above before proceeding.');
  }
  
  console.log('='.repeat(50));
  
  process.exit(allWorking ? 0 : 1);
}

if (require.main === module) {
  testWorkflowCore().catch(console.error);
}
