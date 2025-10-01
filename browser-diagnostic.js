/**
 * BROWSER DIAGNOSTIC SCRIPT
 * 
 * Run this in your browser console (F12 → Console tab) while on your app
 * to diagnose why onboarding isn't working
 */

console.log('🔍 Starting Diagnostic...\n');

// 1. Check Environment Variables
console.log('1️⃣ ENVIRONMENT VARIABLES:');
console.log('   VITE_SUPABASE_URL:', import.meta?.env?.VITE_SUPABASE_URL || 'Not accessible from console');
console.log('   Note: Environment variables may not be accessible from console\n');

// 2. Check Clerk Authentication
console.log('2️⃣ CLERK AUTHENTICATION:');
try {
  const sessionToken = document.cookie.split('__session=')[1]?.split(';')[0];
  if (sessionToken) {
    console.log('   ✅ Session token found');
    try {
      const payload = JSON.parse(atob(sessionToken.split('.')[1]));
      console.log('   User ID:', payload.sub);
      console.log('   Email:', payload.email || 'Not in token');
      console.log('   Issued at:', new Date(payload.iat * 1000).toLocaleString());
      console.log('   Expires at:', new Date(payload.exp * 1000).toLocaleString());
      
      // Store user ID for later use
      window.DIAGNOSTIC_USER_ID = payload.sub;
    } catch (e) {
      console.log('   ⚠️ Could not decode token:', e.message);
    }
  } else {
    console.log('   ❌ No session token found - User not signed in');
  }
} catch (e) {
  console.error('   ❌ Error checking Clerk auth:', e);
}
console.log('');

// 3. Check if onboarding page exists
console.log('3️⃣ CURRENT PAGE:');
console.log('   URL:', window.location.href);
console.log('   Path:', window.location.pathname);
console.log('   On onboarding page?', window.location.pathname.includes('onboarding') ? '✅ Yes' : '❌ No');
console.log('');

// 4. Test API endpoint reachability
console.log('4️⃣ TESTING API ENDPOINTS:');

async function testEndpoint(name, url, method = 'OPTIONS') {
  try {
    console.log(`   Testing ${name}...`);
    const response = await fetch(url, { method });
    console.log(`   ${response.ok ? '✅' : '❌'} ${name}: ${response.status} ${response.statusText}`);
    return response.ok;
  } catch (e) {
    console.log(`   ❌ ${name}: ${e.message}`);
    return false;
  }
}

// Get Supabase URL from page HTML or local storage
const supabaseUrl = 
  document.querySelector('meta[name="supabase-url"]')?.content ||
  localStorage.getItem('supabase-url') ||
  'YOUR_SUPABASE_URL_HERE';

console.log('   Supabase URL:', supabaseUrl);

if (supabaseUrl && !supabaseUrl.includes('YOUR_')) {
  Promise.all([
    testEndpoint('run-intelligence-workflow', `${supabaseUrl}/functions/v1/run-intelligence-workflow`),
    testEndpoint('reports-latest', `${supabaseUrl}/functions/v1/reports-latest`)
  ]).then(() => {
    console.log('\n5️⃣ NEXT STEPS:');
    if (window.DIAGNOSTIC_USER_ID) {
      console.log(`   Your Clerk User ID: ${window.DIAGNOSTIC_USER_ID}`);
      console.log('   \n   Copy this ID and use it in the SQL diagnostic scripts!');
    }
    console.log('\n   To test onboarding manually:');
    console.log('   1. Navigate to /onboarding');
    console.log('   2. Fill out the form');
    console.log('   3. Watch Network tab (F12 → Network) for API calls');
    console.log('   4. Check Console tab for any errors\n');
  });
} else {
  console.log('   ⚠️ Supabase URL not found. Please check .env file\n');
  console.log('5️⃣ MANUAL CHECK:');
  console.log('   1. Check frontend/.env or frontend/.env.local');
  console.log('   2. Ensure VITE_SUPABASE_URL is set');
  console.log('   3. Restart the dev server after changing .env\n');
}

// 6. Create a helper function to test workflow trigger
console.log('6️⃣ HELPER FUNCTION ADDED:');
console.log('   Run testWorkflowTrigger() to manually test the workflow API\n');

window.testWorkflowTrigger = async function() {
  console.log('🧪 Testing Workflow Trigger...\n');
  
  const sessionToken = document.cookie.split('__session=')[1]?.split(';')[0];
  if (!sessionToken) {
    console.error('❌ Not authenticated. Please sign in first.');
    return;
  }
  
  const testData = {
    fullName: 'Test User',
    websiteUrl: 'example.com',
    industry: 'Technology',
    location: 'United States'
  };
  
  console.log('Sending test data:', testData);
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/run-intelligence-workflow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Response status:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('✅ Workflow triggered successfully!');
      console.log('   Workflow ID:', data.workflowId);
      console.log('   Now check the database for workflow_runs record');
    } else {
      console.error('❌ Workflow trigger failed');
      console.error('   Error:', data.error || data.message);
    }
  } catch (e) {
    console.error('❌ Request failed:', e.message);
  }
};

console.log('═══════════════════════════════════════════════════');
console.log('Diagnostic complete! Check the output above.');
console.log('═══════════════════════════════════════════════════\n');
