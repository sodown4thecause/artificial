// Test DataForSEO API access
// Run with: node test-dataforseo-access.js

const DATAFORSEO_API_KEY = 'YOUR_BASE64_KEY_HERE'; // Replace with your actual key
const BASE_URL = 'https://api.dataforseo.com';

const endpoints = [
  '/v3/serp/google/organic/task_post',
  '/v3/serp/google/organic/tasks_ready',
  '/v3/serp/google/organic/task_get',
  '/v3/dataforseo_labs/google/keywords_for_keywords/live',
  '/v3/dataforseo_labs/google/competitors_domain/live',
  '/v3/backlinks/summary/live',
  '/v3/dataforseo_labs/available_filters'
];

async function testEndpoint(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${DATAFORSEO_API_KEY}`
      },
      body: JSON.stringify([{
        keyword: 'test',
        location_name: 'United States',
        language_name: 'English'
      }])
    });

    const data = await response.json();
    
    return {
      endpoint,
      status: response.status,
      ok: response.ok,
      error: data.status_message || null,
      available: response.status !== 404 && response.status !== 403
    };
  } catch (error) {
    return {
      endpoint,
      status: 'ERROR',
      error: error.message,
      available: false
    };
  }
}

async function main() {
  console.log('Testing DataForSEO API endpoints...\n');
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    const icon = result.available ? '✅' : '❌';
    console.log(`${icon} ${endpoint}`);
    console.log(`   Status: ${result.status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log('');
  }
}

main();
