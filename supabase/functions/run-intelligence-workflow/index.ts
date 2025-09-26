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

    // Try Clerk authentication first, fallback to Supabase
    let user, supabaseClient;
    
    const clerkResult = await getClerkUser(request);
    if (clerkResult.error) {
      // Fallback to Supabase auth
      supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false }
      });

      const authHeader = request.headers.get('Authorization');
      if (!authHeader) {
        return new Response('Unauthorized', { status: 401 });
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: supabaseUser, error: userError } = await supabaseClient.auth.getUser(token);
      if (userError || !supabaseUser?.user) {
        return new Response('Invalid token', { status: 401 });
      }
      user = supabaseUser;
    } else {
      user = clerkResult.data;
      supabaseClient = clerkResult.supabaseClient;
    }

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

    const result = await triggerWorkflow(supabaseClient, user.user, payload);

    await supabaseClient
      .from('signup_fingerprints')
      .upsert({ user_id: user.user.id, ip_address: ipAddress }, { onConflict: 'user_id' });

    return new Response(JSON.stringify(result), {
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Workflow trigger failed', error);
    return new Response('Internal Server Error', { status: 500 });
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

