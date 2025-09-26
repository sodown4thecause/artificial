import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.5';

serve(async (request) => {
  const secret = Deno.env.get('SCHEDULER_SECRET');
  if (!secret || request.headers.get('x-scheduler-secret') !== secret) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response('Service misconfigured', { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: profiles } = await supabase
    .from('onboarding_profiles')
    .select('user_id, website_url, industry, location, full_name');

  const { data: recentRuns } = await supabase
    .from('workflow_runs')
    .select('user_id, completed_at')
    .eq('status', 'completed')
    .gte('completed_at', sevenDaysAgo);

  const usersToRun = (profiles ?? []).filter((profile) => {
    const userRuns = recentRuns?.filter((run) => run.user_id === profile.user_id) ?? [];
    const lastRun = userRuns.sort((a, b) => Date.parse(b.completed_at) - Date.parse(a.completed_at))[0];
    if (!lastRun) return true;
    return Date.now() - Date.parse(lastRun.completed_at) > 7 * 24 * 60 * 60 * 1000;
  });

  await Promise.all(
    usersToRun.map(async (profile) => {
      const response = await fetch(`${supabaseUrl}/functions/v1/run-intelligence-workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceRoleKey}`
        },
        body: JSON.stringify({
          fullName: profile.full_name,
          websiteUrl: profile.website_url,
          industry: profile.industry,
          location: profile.location
        })
      });

      if (!response.ok) {
        console.error('Failed to enqueue workflow for user', profile.user_id, await response.text());
      }
    })
  );

  return new Response('Scheduled refresh triggered', { status: 200 });
});

