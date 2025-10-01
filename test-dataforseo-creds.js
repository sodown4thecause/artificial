/**
 * Test DataForSEO Credentials
 * 
 * This script tests your DataForSEO credentials directly
 * to verify they work before debugging the edge function
 */

// Replace these with your actual credentials
const DATAFORSEO_LOGIN = 'YOUR_LOGIN_HERE';
const DATAFORSEO_PASSWORD = 'YOUR_PASSWORD_HERE';

// Create base64 encoded credentials
const base64Creds = Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString('base64');

console.log('🔍 Testing DataForSEO Credentials...\n');
console.log('Login:', DATAFORSEO_LOGIN);
console.log('Password:', '*'.repeat(DATAFORSEO_PASSWORD.length));
console.log('Base64:', base64Creds);
console.log('\n---\n');

// Test 1: Check user data (account info)
async function testUserData() {
  console.log('Test 1: Fetching user account data...');
  try {
    const response = await fetch('https://api.dataforseo.com/v3/appendix/user_data', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${base64Creds}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Authentication successful!');
      console.log('Account info:', JSON.stringify(data, null, 2));
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ Authentication failed!');
      console.log('Error:', errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return false;
  }
}

// Test 2: Simple keyword search
async function testKeywordSearch() {
  console.log('\nTest 2: Testing keyword search API...');
  try {
    const response = await fetch('https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_suggestions/live', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${base64Creds}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{
        keyword: 'technology',
        location_name: 'United States',
        language_name: 'English',
        limit: 5
      }])
    });

    console.log('Status:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Keyword search successful!');
      console.log('Results:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ Keyword search failed!');
      console.log('Error:', errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return false;
  }
}

// Run tests
(async () => {
  const test1Pass = await testUserData();
  
  if (test1Pass) {
    await testKeywordSearch();
    
    console.log('\n✅ All tests passed!');
    console.log('\nYour base64 credential for Supabase:');
    console.log('---');
    console.log(base64Creds);
    console.log('---');
    console.log('\nAdd this to Supabase Edge Function secrets as:');
    console.log('Name: DATAFORSEO_BASE64');
    console.log('Value:', base64Creds);
  } else {
    console.log('\n❌ Authentication failed. Please check your credentials.');
    console.log('\nTroubleshooting:');
    console.log('1. Verify login and password at https://app.dataforseo.com/api-dashboard');
    console.log('2. Make sure there are no extra spaces');
    console.log('3. Check that your account has API access enabled');
  }
})();
