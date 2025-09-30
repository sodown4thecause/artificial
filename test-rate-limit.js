// Test script to verify rate limiting function
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testRateLimit() {
  console.log('Testing rate limit function...');
  console.log('Supabase URL:', supabaseUrl);
  
  // Test with a sample Clerk user ID (text format)
  const testUserId = 'user_test123';
  const testIpAddress = '192.168.1.1';
  
  try {
    const { data, error } = await supabase.rpc('check_and_increment_daily_limit', {
      p_user_id: testUserId,
      p_ip_address: testIpAddress,
      p_daily_limit: 10
    });
    
    console.log('Success!');
    console.log('Result:', JSON.stringify(data, null, 2));
    console.log('Error:', error);
    
    if (error) {
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    }
  } catch (err) {
    console.error('Exception caught:', err);
  }
}

testRateLimit();