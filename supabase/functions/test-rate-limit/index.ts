import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.5';

serve(async (request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({
      error: 'Missing credentials',
      supabaseUrl: supabaseUrl ? 'present' : 'missing',
      serviceRoleKey: serviceRoleKey ? 'present' : 'missing'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Test the rate limit function
    const testUserId = 'user_diagnostic_test';
    const testIp = '127.0.0.1';
    
    console.log('Testing rate limit with:', { testUserId, testIp });
    
    const { data, error } = await supabase.rpc('check_and_increment_daily_limit', {
      p_user_id: testUserId,
      p_ip_address: testIp,
      p_daily_limit: 10
    });

    return new Response(JSON.stringify({
      success: !error,
      data,
      error: error ? {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      } : null,
      environment: {
        supabaseUrl,
        serviceRoleKeyLength: serviceRoleKey.length
      }
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Exception caught',
      message: error.message,
      stack: error.stack
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});