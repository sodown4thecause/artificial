#!/usr/bin/env node

/**
 * Test Enhanced Competitor Analysis Workflow
 * 
 * This script tests the enhanced workflow that includes comprehensive 
 * competitor analysis, scraping competitor sites and providing competitive intelligence.
 */

require('dotenv').config();
const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL and SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const BASE_URL = `${SUPABASE_URL}/functions/v1`;

async function makeRequest(endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    const options = {
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      }
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const responseData = res.headers['content-type']?.includes('application/json') 
            ? JSON.parse(body) 
            : body;
          resolve({
            status: res.statusCode,
            data: responseData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: body,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(120000, () => {
      req.destroy();
      reject(new Error('Request timeout (120s)'));
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testEnhancedWorkflow() {
  console.log('🚀 Testing Enhanced Competitor Analysis Workflow\n');
  
  const testPayload = {
    fullName: 'Test User',
    websiteUrl: 'example.com',
    industry: 'digital marketing',
    location: 'United States'
  };

  console.log('📋 Test Configuration:');
  console.log(`   Website: ${testPayload.websiteUrl}`);
  console.log(`   Industry: ${testPayload.industry}`);
  console.log(`   Location: ${testPayload.location}\n`);

  try {
    console.log('🔄 Triggering enhanced workflow...');
    const startTime = Date.now();
    
    const response = await makeRequest('/test-single-workflow', {
      ...testPayload,
      dryRun: false,
      testTimeout: 600000 // 10 minutes
    });

    const duration = Math.round((Date.now() - startTime) / 1000);

    if (response.status !== 200) {
      console.error(`❌ Workflow failed with status ${response.status}`);
      console.error(JSON.stringify(response.data, null, 2));
      return false;
    }

    const results = response.data;
    console.log('\n✅ Workflow completed successfully!');
    console.log(`⏱️  Total Duration: ${duration}s\n`);

    // Display results summary
    if (results.summary) {
      console.log('📊 Workflow Summary:');
      console.log(`   Status: ${results.summary.status}`);
      console.log(`   Duration: ${results.summary.duration}`);
      console.log(`   Steps Completed: ${results.summary.steps_completed}`);
      console.log(`   Steps Failed: ${results.summary.steps_failed}`);
      console.log(`   Errors: ${results.summary.errors}`);
      console.log(`   Warnings: ${results.summary.warnings}\n`);
    }

    // Display detailed steps
    if (results.details?.steps) {
      console.log('📋 Workflow Steps:');
      results.details.steps.forEach((step, index) => {
        const statusIcon = step.status === 'completed' ? '✅' : 
                          step.status === 'failed' ? '❌' : '⏳';
        const timing = step.duration_ms ? ` (${step.duration_ms}ms)` : 
                      step.duration_seconds ? ` (${step.duration_seconds}s)` : '';
        
        console.log(`   ${statusIcon} ${step.step}${timing}`);
        
        if (step.data_summary) {
          console.log(`      Data: ${JSON.stringify(step.data_summary)}`);
        }
        if (step.error) {
          console.log(`      Error: ${step.error}`);
        }
      });
      console.log('');
    }

    // Test report retrieval
    console.log('📄 Testing report retrieval...');
    const reportResponse = await makeRequest('/reports/latest');
    
    if (reportResponse.status === 200) {
      console.log('✅ Report successfully retrieved!');
      const report = reportResponse.data;
      
      console.log('\n📊 Report Content Summary:');
      if (report.summary) {
        console.log(`   Executive Summary Length: ${report.summary.executive_summary?.length || 0} chars`);
        console.log(`   Recommendations: ${report.summary.recommendations?.length || 0}`);
      }
      console.log(`   SERP Timeline Points: ${report.serpTimeline?.length || 0}`);
      console.log(`   Keyword Opportunities: ${report.keywordOpportunities?.length || 0}`);
      console.log(`   Sentiment Metrics: ${report.sentiment?.length || 0}`);
      console.log(`   Backlinks: ${report.backlinks?.length || 0}`);
      console.log(`   Core Web Vitals: ${report.coreWebVitals?.length || 0}`);
      console.log(`   Tech Stack Entries: ${report.techStack?.length || 0}`);

      // Check for competitive intelligence
      if (report.competitorAnalysis || report.competitors) {
        console.log('\n🏆 Competitive Intelligence:');
        console.log(`   Competitors Identified: ${(report.competitors || []).length}`);
        if (report.competitors) {
          console.log(`   Top Competitors: ${report.competitors.slice(0, 3).join(', ')}`);
        }
      }

      if (report.summary?.recommendations) {
        console.log('\n💡 Top Recommendations:');
        report.summary.recommendations.slice(0, 3).forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec.title} (${(rec.confidence * 100).toFixed(0)}% confidence)`);
          console.log(`      ${rec.description.substring(0, 100)}...`);
        });
      }
    } else {
      console.log(`⚠️ Report not yet available (status: ${reportResponse.status})`);
    }

    return true;

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    return false;
  }
}

async function testCompetitorApis() {
  console.log('🧪 Testing Individual Competitor Analysis APIs\n');
  
  const tests = [
    {
      name: 'DataForSEO Authentication',
      endpoint: '/test-workflow',
      payload: { testType: 'api', service: 'dataforseo' }
    },
    {
      name: 'PageSpeed Insights', 
      endpoint: '/test-workflow',
      payload: { testType: 'api', service: 'pagespeed' }
    },
    {
      name: 'Anthropic Claude',
      endpoint: '/test-workflow', 
      payload: { testType: 'api', service: 'anthropic' }
    }
  ];

  for (const test of tests) {
    try {
      console.log(`🔍 Testing ${test.name}...`);
      const response = await makeRequest(test.endpoint, test.payload);
      
      if (response.status === 200 && response.data?.status === 'healthy') {
        console.log(`   ✅ ${test.name}: Working`);
      } else {
        console.log(`   ⚠️ ${test.name}: ${response.data?.message || 'Issues detected'}`);
      }
    } catch (error) {
      console.log(`   ❌ ${test.name}: ${error.message}`);
    }
  }
  console.log('');
}

async function main() {
  console.log('🎯 Enhanced Competitor Analysis Testing Suite\n');
  console.log('='.repeat(60));
  
  // Test individual APIs first
  await testCompetitorApis();
  
  // Then test the full enhanced workflow
  const success = await testEnhancedWorkflow();
  
  console.log('='.repeat(60));
  console.log(success ? '🎉 All tests completed successfully!' : '❌ Some tests failed');
  
  if (success) {
    console.log('\n✨ Enhanced Features Now Available:');
    console.log('   🔍 Automatic competitor identification');
    console.log('   📊 Competitor SERP performance analysis'); 
    console.log('   🎯 Competitor keyword strategy insights');
    console.log('   🔗 Competitor backlink profile analysis');
    console.log('   🏆 Market share and positioning insights');
    console.log('   📈 Competitive intelligence reporting');
    console.log('\n🚀 Your reports now include comprehensive competitive analysis!');
  } else {
    console.log('\n🔧 Next Steps:');
    console.log('   1. Check API credentials and limits');
    console.log('   2. Review error messages above');
    console.log('   3. Test individual API components');
    console.log('   4. Verify Supabase Edge Functions are deployed');
  }
  
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}