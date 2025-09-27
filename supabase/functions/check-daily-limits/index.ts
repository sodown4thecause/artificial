import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.5';

serve(async (request) => {
  // Only allow GET requests
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response('Service misconfigured', { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  try {
    // Get user from auth header (optional for anonymous users)
    let userId = null;
    const authHeader = request.headers.get('Authorization');
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: user, error: userError } = await supabase.auth.getUser(token);
      if (!userError && user?.user) {
        userId = user.user.id;
      }
    }

    // Get IP address for rate limiting fallback
    const forwardedFor = request.headers.get('x-forwarded-for') ?? '';
    const ipAddress = forwardedFor.split(',')[0]?.trim() ?? 
                     request.headers.get('x-real-ip') ?? 
                     'unknown';

    // Get current usage stats
    const { data: usageStats, error: usageError } = await supabase
      .rpc('get_daily_usage_stats', {
        p_user_id: userId,
        p_ip_address: userId ? null : ipAddress
      });

    if (usageError) {
      console.error('Failed to get usage stats:', usageError);
      return new Response(JSON.stringify({
        error: 'Unable to check usage limits'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Return usage information
    return new Response(JSON.stringify({
      usage: usageStats,
      launch_phase: {
        active: true,
        message: 'During our launch phase, we\'re limiting reports to 10 per day to ensure quality service for all users.',
        upgrade_message: 'Upgrade to a premium plan for higher limits and priority processing.'
      },
      user_context: {
        authenticated: !!userId,
        tracking_method: userId ? 'user_id' : 'ip_address'
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('Rate limit check failed:', error);
    return new Response(JSON.stringify({
      error: 'Rate limit check failed',
      message: 'Unable to verify usage limits'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});