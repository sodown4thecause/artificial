// deno-lint-ignore-file no-namespace
/// <reference lib="deno.ns" />

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@15.11.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.5';

import { ensureStripeClient } from '../../lib/integrations/stripe.ts';

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  if (!webhookSecret) {
    console.error('Stripe webhook secret missing');
    return new Response('Service misconfigured', { status: 500 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase credentials');
      return new Response('Service misconfigured', { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      return new Response('Missing signature', { status: 400 });
    }

    const payload = await request.text();
    const stripe = ensureStripeClient();

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      console.error('Webhook signature verification failed', error);
      return new Response('Invalid signature', { status: 400 });
    }

    const rawObject = event.data.object as Record<string, unknown>;
    const customerId = 'customer' in rawObject ? (rawObject.customer as string | null) : null;

    let userId: string | null = null;
    if (customerId) {
      const { data: customerRecord } = await supabase
        .from('billing_customers')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle();

      userId = customerRecord?.user_id ?? null;
    }

    const { error: eventInsertError } = await supabase.from('billing_events').insert({
      stripe_event_id: event.id,
      type: event.type,
      data: rawObject,
      customer_id: customerId,
      user_id: userId
    });

    if (eventInsertError) {
      console.error('Failed to persist billing event', eventInsertError);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = rawObject as Stripe.Checkout.Session;
        const subscriptionId = session.subscription as string | null;
        const sessionCustomerId = session.customer as string | null;
        const planId =
          (session.metadata?.plan_id as string | undefined) ||
          (session.total_details?.breakdown?.line_items?.[0]?.price?.id as string | undefined) ||
          null;

        if (sessionCustomerId && userId) {
          await supabase
            .from('billing_customers')
            .update({
              stripe_subscription_id: subscriptionId,
              status: session.status ?? 'completed',
              plan_id: planId ?? undefined
            })
            .eq('stripe_customer_id', sessionCustomerId);
        }

        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.created':
      case 'customer.subscription.deleted': {
        const subscription = rawObject as Stripe.Subscription;
        const subscriptionCustomerId = subscription.customer as string | null;
        const planId = subscription.items?.data?.[0]?.price?.id ?? null;

        if (subscriptionCustomerId && userId) {
            await supabase
              .from('billing_customers')
              .update({
                stripe_subscription_id: subscription.id,
                status: subscription.status,
                current_period_end: subscription.current_period_end
                  ? new Date(subscription.current_period_end * 1000).toISOString()
                  : null,
                plan_id: planId
              })
              .eq('stripe_customer_id', subscriptionCustomerId);
        }
        break;
      }

      default:
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Stripe webhook handler failed', error);
    return new Response('Internal Server Error', { status: 500 });
  }
});

