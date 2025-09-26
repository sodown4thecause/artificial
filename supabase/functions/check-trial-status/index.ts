import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.5';
import { getClerkUser } from '../lib/integrations/clerk-auth.ts';

serve(async (request) => {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response('Service misconfigured', { status: 500 });
    }

    // Try Clerk authentication first, fallback to Supabase
    let user, supabase;
    
    const clerkResult = await getClerkUser(request);
    if (clerkResult.error) {
      // Fallback to Supabase auth
      supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false }
      });

      const authHeader = request.headers.get('Authorization');
      if (!authHeader) {
        return new Response('Unauthorized', { status: 401 });
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: supabaseUser, error: userError } = await supabase.auth.getUser(token);
      if (userError || !supabaseUser?.user) {
        return new Response('Invalid token', { status: 401 });
      }
      user = supabaseUser;
    } else {
      user = clerkResult.data;
      supabase = clerkResult.supabaseClient;
    }

    // Get user's billing status
    const { data: billingCustomer, error: billingError } = await supabase
      .from('billing_customers')
      .select('*')
      .eq('user_id', user.user.id)
      .maybeSingle();

    if (billingError) {
      console.error('Failed to fetch billing status', billingError);
      return new Response('Internal Server Error', { status: 500 });
    }

    // Check if user has completed onboarding
    const { data: onboardingProfile, error: onboardingError } = await supabase
      .from('onboarding_profiles')
      .select('*')
      .eq('user_id', user.user.id)
      .maybeSingle();

    if (onboardingError) {
      console.error('Failed to fetch onboarding status', onboardingError);
      return new Response('Internal Server Error', { status: 500 });
    }

    const now = new Date();
    const hasCompletedOnboarding = !!onboardingProfile;
    
    let trialStatus = 'no_trial';
    let daysRemaining = 0;
    let needsSubscription = false;

    if (billingCustomer) {
      if (billingCustomer.trial_ends_at) {
        const trialEndDate = new Date(billingCustomer.trial_ends_at);
        const isTrialActive = now < trialEndDate;
        
        if (isTrialActive) {
          trialStatus = 'active';
          daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        } else {
          trialStatus = 'expired';
          needsSubscription = billingCustomer.subscription_status !== 'active';
        }
      }
    } else if (hasCompletedOnboarding) {
      // User completed onboarding but no billing record - offer trial
      trialStatus = 'eligible';
    }

    // Get recent workflow runs count
    const { count: recentRuns } = await supabase
      .from('workflow_runs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.user.id)
      .gte('triggered_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const response = {
      user_id: user.user.id,
      has_completed_onboarding: hasCompletedOnboarding,
      trial_status: trialStatus,
      days_remaining: daysRemaining,
      needs_subscription: needsSubscription,
      plan_type: billingCustomer?.plan_type || null,
      subscription_status: billingCustomer?.subscription_status || null,
      recent_workflow_runs: recentRuns || 0,
      available_coupons: {
        free_trial_14: 'AW8ncCmx',
        freetrial14: 'o2rZNU8N'
      },
      pricing: {
        starter: {
          price_id: 'price_1SBThLDgH8UdYyxEKwxfjvvF',
          amount: 4900,
          currency: 'usd',
          interval: 'month',
          description: '1 Website/Industry/Location',
          features: ['1 full AI-powered report per fortnight', 'Ongoing dashboard monitoring', 'Competitor tracking (up to 3)', 'Technical + backlink analysis']
        },
        growth: {
          price_id: 'price_1SBThODgH8UdYyxEfWTuLIlI',
          amount: 9900,
          currency: 'usd',
          interval: 'month',
          description: 'Up to 3 Websites/Industry/Locations',
          features: ['3 reports per fortnight + monitoring dashboards', 'Competitor tracking (up to 10)', 'Technical + backlink analysis']
        }
      }
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Trial status check failed', error);
    return new Response('Internal Server Error', { status: 500 });
  }
});
