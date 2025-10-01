const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

async function testFunction() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  console.log('Testing reports-latest function...');
  console.log('URL:', `${supabaseUrl}/functions/v1/reports-latest`);

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/reports-latest`, {
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', response.status);
    const data = await response.text();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testFunction();
