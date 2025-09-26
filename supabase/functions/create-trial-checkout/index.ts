import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.5';
import { ensureStripeClient } from '../lib/integrations/stripe.ts';

serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response('Service misconfigured', { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: user, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user?.user) {
      return new Response('Invalid token', { status: 401 });
    }

    const { 
      planType = 'starter',
      couponCode = null,
      trialDays = 14
    } = await request.json();

    // Define pricing tiers
    const pricing = {
      starter: {
        price_id: 'price_1SBThLDgH8UdYyxEKwxfjvvF',
        name: 'BI Dashboard Starter',
        amount: 4900, // $49/month
        description: '1 Website/Industry/Location - 1 full AI-powered report per fortnight'
      },
      growth: {
        price_id: 'price_1SBThODgH8UdYyxEfWTuLIlI',
        name: 'BI Dashboard Growth',
        amount: 9900, // $99/month  
        description: 'Up to 3 Websites/Industry/Locations - 3 reports per fortnight'
      }
    };

    const selectedPlan = pricing[planType];
    if (!selectedPlan) {
      return new Response('Invalid plan type', { status: 400 });
    }

    const stripe = ensureStripeClient();

    // Create or get customer
    let stripeCustomerId;
    const { data: existingCustomer } = await supabase
      .from('billing_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.user.id)
      .maybeSingle();

    if (existingCustomer?.stripe_customer_id) {
      stripeCustomerId = existingCustomer.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.user.email,
        metadata: {
          supabase_user_id: user.user.id,
          plan_type: planType
        }
      });
      stripeCustomerId = customer.id;
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const successUrl = `${origin}/dashboard?trial=started&plan=${planType}`;
    const cancelUrl = `${origin}/pricing?trial=cancelled`;

    // Create checkout session with 14-day free trial
    const sessionConfig = {
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [
        {
          price: selectedPlan.price_id,
          quantity: 1
        }
      ],
      allow_promotion_codes: true,
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        trial_period_days: trialDays,
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel'
          }
        },
        metadata: {
          supabase_user_id: user.user.id,
          plan_type: planType,
          trial_started_at: new Date().toISOString()
        }
      }
    };

    // Add coupon if provided
    if (couponCode) {
      sessionConfig.discounts = [{ coupon: couponCode }];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Track trial start in database
    const trialEndDate = new Date(Date.now() + (trialDays * 24 * 60 * 60 * 1000));
    
    await supabase.from('billing_customers').upsert({
      user_id: user.user.id,
      stripe_customer_id: stripeCustomerId,
      trial_started_at: new Date().toISOString(),
      trial_ends_at: trialEndDate.toISOString(),
      plan_type: planType,
      subscription_status: 'trialing',
      coupon_used: couponCode,
      status: 'trial_active'
    }, { onConflict: 'user_id' });

    console.log(`Created ${trialDays}-day trial for user ${user.user.id}, plan: ${planType}`);

    return new Response(JSON.stringify({ 
      url: session.url,
      trial_days: trialDays,
      plan_type: planType,
      coupon_applied: !!couponCode,
      trial_ends_at: trialEndDate.toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Trial checkout creation failed', error);
    return new Response(JSON.stringify({
      error: 'Trial checkout creation failed',
      message: error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
