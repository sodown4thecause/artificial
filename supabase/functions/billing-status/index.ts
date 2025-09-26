// deno-lint-ignore-file no-namespace
/// <reference lib="deno.ns" />

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.5';

serve(async (request) => {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase credentials');
      return new Response('Service misconfigured', { status: 500 });
    }

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }

    const accessToken = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: userError
    } = await supabaseClient.auth.getUser(accessToken);

    if (userError || !user) {
      return new Response('Invalid token', { status: 401 });
    }

    const { data: billing, error } = await supabaseClient
      .from('billing_customers')
      .select('plan_id, status, current_period_end, stripe_customer_id, stripe_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Failed to fetch billing status', error);
      return new Response('Unable to load billing status', { status: 500 });
    }

    return new Response(
      JSON.stringify({
        subscribed: Boolean(billing?.stripe_subscription_id && billing.status !== 'canceled'),
        planId: billing?.plan_id ?? null,
        status: billing?.status ?? null,
        currentPeriodEnd: billing?.current_period_end ?? null,
        stripeCustomerId: billing?.stripe_customer_id ?? null,
        stripeSubscriptionId: billing?.stripe_subscription_id ?? null
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Billing status handler failed', error);
    return new Response('Internal Server Error', { status: 500 });
  }
});

