/**
 * Test script to verify Cloudflare MCP server
 * Tests connectivity and lists available DataForSEO tools
 */

const MCP_SERVER_URL = 'https://bi-dashboard-mcp-server.liam-wilson1990.workers.dev';

async function testHealthEndpoint() {
  console.log('\n🏥 Testing health endpoint...');
  try {
    const response = await fetch(`${MCP_SERVER_URL}/health`);
    const data = await response.json();
    console.log('✅ Health check:', data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testDataForSEOEndpoint() {
  console.log('\n🧪 Testing DataForSEO endpoint...');
  try {
    // Test with a simple locations endpoint (no credits used)
    const request = {
      endpoint: '/v3/serp/google/locations',
      payload: []
    };

    const response = await fetch(`${MCP_SERVER_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ Failed to call endpoint:', response.status, text);
      return false;
    }

    const data = await response.json();
    
    if (data.error) {
      console.error('❌ Worker error:', data.error);
      return false;
    }

    // Check DataForSEO response structure
    if (data.tasks && data.tasks.length > 0) {
      const task = data.tasks[0];
      console.log('✅ DataForSEO API accessible!');
      console.log(`   Status: ${task.status_message} (${task.status_code})`);
      console.log(`   Cost: $${task.cost}`);
      return true;
    } else {
      console.log('⚠️  Unexpected response format:', JSON.stringify(data).substring(0, 200));
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to test endpoint:', error.message);
    return false;
  }
}

async function testKeywordSuggestion() {
  console.log('\n🔑 Testing keyword suggestion endpoint...');
  try {
    // Test with keyword suggestions - low cost endpoint
    const request = {
      endpoint: '/v3/dataforseo_labs/google/keyword_suggestions/live',
      payload: [{
        keyword: 'seo',
        location_name: 'United States',
        language_name: 'English',
        limit: 5
      }]
    };

    const response = await fetch(`${MCP_SERVER_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ Keyword suggestion failed:', response.status, text);
      return false;
    }

    const data = await response.json();
    
    if (data.error) {
      console.error('❌ Worker error:', data.error);
      return false;
    }

    // Check DataForSEO response
    if (data.tasks && data.tasks.length > 0) {
      const task = data.tasks[0];
      if (task.status_code === 20000 && task.result && task.result.length > 0) {
        const items = task.result[0].items || [];
        console.log('✅ Keyword suggestions working!');
        console.log(`   Found ${items.length} keyword suggestions`);
        if (items.length > 0) {
          console.log(`   Example: "${items[0].keyword}" (volume: ${items[0].keyword_info?.search_volume || 0})`);
        }
        console.log(`   Cost: $${task.cost}`);
        return true;
      } else {
        console.log('⚠️  Task completed but no results:', task.status_message);
        return false;
      }
    } else {
      console.log('⚠️  Unexpected response format');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing DataForSEO MCP Server');
  console.log('Server URL:', MCP_SERVER_URL);

  const healthOk = await testHealthEndpoint();
  if (!healthOk) {
    console.log('\n⚠️  Server health check failed. Server may be down or URL is incorrect.');
    return;
  }

  const apiOk = await testDataForSEOEndpoint();
  if (!apiOk) {
    console.log('\n⚠️  DataForSEO API endpoint test failed.');
  }

  const keywordOk = await testKeywordSuggestion();
  if (!keywordOk) {
    console.log('\n⚠️  Keyword suggestion test failed.');
  }

  console.log('\n✅ Test complete!\n');
}

main().catch(console.error);
