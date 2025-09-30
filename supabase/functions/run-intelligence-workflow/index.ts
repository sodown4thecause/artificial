import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.5';

import { triggerWorkflow } from '../lib/workflow-orchestrator.ts';
import type { OnboardingPayload } from '../lib/types.ts';
import { getClerkUser } from '../lib/integrations/clerk-auth.ts';

serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase credentials');
      return new Response('Service misconfigured', { status: 500 });
    }

    // Try Clerk authentication
    console.log('Attempting Clerk authentication...');
    const clerkResult = await getClerkUser(request);
    
    if (clerkResult.error) {
      console.error('Clerk authentication failed:', clerkResult.error);
      return new Response(JSON.stringify({
        error: 'AUTHENTICATION_FAILED',
        message: 'Unable to authenticate. Please sign in again.',
        details: clerkResult.error.message
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const user = clerkResult.data;
    const supabaseClient = clerkResult.supabaseClient;
    console.log('Clerk authentication successful for user:', user.user?.id);

    const forwardedFor = request.headers.get('x-forwarded-for') ?? '';
    const ipAddress = forwardedFor.split(',')[0]?.trim() ?? 'unknown';

    const payload = (await request.json()) as OnboardingPayload;
    const validationError = validatePayload(payload);
    if (validationError) {
      return new Response(validationError, { status: 400 });
    }

    const { count: existingCount } = await supabaseClient
      .from('signup_fingerprints')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ipAddress);

    if ((existingCount ?? 0) > 0) {
      return new Response(
        JSON.stringify({
          error: 'IP_LIMIT_EXCEEDED',
          message:
            'We detected an existing account from this network. Only one free launch account per IP is allowed during the trial period.'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const result = await triggerWorkflow(supabaseClient, user.user, payload, ipAddress);

    await supabaseClient
      .from('signup_fingerprints')
      .upsert({ user_id: user.user.id, ip_address: ipAddress }, { onConflict: 'user_id' });

    return new Response(JSON.stringify({
      ...result,
      rate_limit_info: {
        message: 'Report generation started. You can generate up to 10 reports per day during our launch phase.',
        daily_limit: 10
      }
    }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Workflow trigger failed', error);
    
    // Handle rate limiting errors specifically
    if (error.message && error.message.includes('Daily report generation limit')) {
      return new Response(JSON.stringify({
        error: 'RATE_LIMIT_EXCEEDED',
        message: error.message,
        details: {
          daily_limit: 10,
          reset_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          suggestion: 'You can upgrade to a premium plan for higher limits, or wait until tomorrow for your limits to reset.'
        }
      }), {
        status: 429, // Too Many Requests
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '86400' // 24 hours in seconds
        }
      });
    }
    
    return new Response(JSON.stringify({
      error: 'WORKFLOW_TRIGGER_FAILED',
      message: 'Unable to start report generation. Please try again.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

function validatePayload(payload: OnboardingPayload) {
  if (!payload) return 'Missing payload';
  if (!payload.fullName) return 'fullName is required';
  if (!payload.websiteUrl) return 'websiteUrl is required';
  if (!payload.industry) return 'industry is required';
  if (!payload.location) return 'location is required';
  return null;
}

