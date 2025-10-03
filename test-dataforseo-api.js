// Test DataForSEO API directly
const fetch = require('node-fetch');

// Get Supabase URL from environment (update if needed)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/dataforseo-keywords`;

// You need to provide a valid Clerk token
const CLERK_TOKEN = process.argv[2];

if (!CLERK_TOKEN) {
  console.error('Usage: node test-dataforseo-api.js <clerk-token>');
  console.error('Get your token from browser DevTools > Application > Local Storage');
  process.exit(1);
}

async function testAPI() {
  console.log('🧪 Testing DataForSEO API...');
  console.log('📍 URL:', FUNCTION_URL);
  
  try {
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CLERK_TOKEN}`
      },
      body: JSON.stringify({
        keywords: ['digital marketing'],
        location_code: 2840,
        language_code: 'en',
        limit: 10
      })
    });

    console.log('\n📡 Response Status:', response.status, response.statusText);
    console.log('📋 Headers:', Object.fromEntries(response.headers));

    const data = await response.json();
    
    if (!response.ok) {
      console.error('\n❌ API Error:');
      console.error(JSON.stringify(data, null, 2));
      return;
    }

    console.log('\n✅ Success! Response structure:');
    console.log('   - status_code:', data.status_code);
    console.log('   - status_message:', data.status_message);
    console.log('   - tasks:', data.tasks?.length || 0);
    
    if (data.tasks?.[0]) {
      const task = data.tasks[0];
      console.log('\n📦 Task 0:');
      console.log('   - status_code:', task.status_code);
      console.log('   - status_message:', task.status_message);
      console.log('   - result:', task.result?.length || 0, 'items');
      
      if (task.result?.[0]) {
        const result = task.result[0];
        console.log('\n📊 Result 0:');
        console.log('   - keyword:', result.keyword);
        console.log('   - location_code:', result.location_code);
        console.log('   - language_code:', result.language_code);
        console.log('   - items:', result.items?.length || 0, 'keywords');
        
        if (result.items?.[0]) {
          console.log('\n🔑 First keyword:');
          console.log(JSON.stringify(result.items[0], null, 2));
        }
      }
    }

    console.log('\n\n📄 Full Response:');
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('\n💥 Error:', error.message);
    console.error(error);
  }
}

testAPI();
