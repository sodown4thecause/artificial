import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.5';

serve(async (request) => {
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

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: user, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user?.user) {
    return new Response('Invalid token', { status: 401 });
  }

  const { data: report, error } = await supabase
    .from('reports')
    .select('payload, workflow_runs!inner(user_id)')
    .eq('workflow_runs.user_id', user.user.id)
    .order('captured_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch report', error);
    return new Response('Failed to fetch report', { status: 500 });
  }

  if (!report) {
    return new Response(JSON.stringify({ message: 'No report available yet.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify(report.payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});

