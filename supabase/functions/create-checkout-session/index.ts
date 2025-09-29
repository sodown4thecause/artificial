// deno-lint-ignore-file no-namespace
/// <reference lib="deno.ns" />

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.5';

import {
  ensureStripeClient,
  resolvePriceId,
  STRIPE_CANCEL_URL,
  STRIPE_SUCCESS_URL,
  STRIPE_PORTAL_RETURN_URL
} from '../lib/integrations/stripe.ts';

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

    const stripe = ensureStripeClient();

    const requestBody = await request.json().catch(() => ({}));
    const mode = requestBody.mode === 'portal' ? 'portal' : 'checkout';
    const planId = requestBody.planId ?? null;
    const trialPeriodDays = requestBody.trialPeriodDays ?? undefined;

    const { data: existingCustomer, error: customerError } = await supabaseClient
      .from('billing_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (customerError && customerError.code !== 'PGRST116') {
      console.error('Failed to fetch billing customer', customerError);
      return new Response('Unable to create checkout session', { status: 500 });
    }

    let stripeCustomerId = existingCustomer?.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: {
          supabase_user_id: user.id
        }
      });

      stripeCustomerId = customer.id;

      const { error: upsertError } = await supabaseClient
        .from('billing_customers')
        .upsert({
          user_id: user.id,
          stripe_customer_id: stripeCustomerId,
          status: 'created'
        });

      if (upsertError) {
        console.error('Failed to upsert billing customer', upsertError);
        return new Response('Unable to create checkout session', { status: 500 });
      }
    }

    const origin = request.headers.get('origin') ?? new URL(request.url).origin;
    const successUrl = STRIPE_SUCCESS_URL ?? `${origin}/dashboard?billing=success`;
    const cancelUrl = STRIPE_CANCEL_URL ?? `${origin}/dashboard?billing=cancelled`;

    if (mode === 'portal') {
      const returnUrl = STRIPE_PORTAL_RETURN_URL ?? `${origin}/dashboard`;
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: returnUrl
      });

      return new Response(JSON.stringify({ url: portalSession.url }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const priceId = await resolvePriceId(stripe);

    const couponCode = requestBody.couponCode || null;
    const requestedTrialDays = requestBody.trialDays || 14; // Default 14-day trial

    const sessionConfig = {
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      allow_promotion_codes: true,
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan_id: planId ?? undefined,
          trial_started_at: new Date().toISOString()
        },
        trial_settings: {
          end_behavior: { missing_payment_method: 'cancel' }
        },
        trial_period_days: requestedTrialDays
      }
    };

    // Add coupon if provided
    if (couponCode) {
      sessionConfig.discounts = [{ coupon: couponCode }];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Track trial in database
    await supabaseClient.from('billing_customers').upsert({
      user_id: user.id,
      stripe_customer_id: stripeCustomerId,
      trial_started_at: new Date().toISOString(),
      trial_ends_at: new Date(Date.now() + (requestedTrialDays * 24 * 60 * 60 * 1000)).toISOString(),
      plan_type: planId || 'pro',
      coupon_used: couponCode
    }, { onConflict: 'user_id' });

    return new Response(JSON.stringify({ id: session.id, url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to create checkout session', error);
    return new Response('Internal Server Error', { status: 500 });
  }
});

