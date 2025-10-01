import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.5';
import { getClerkUser } from '../lib/integrations/clerk-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-clerk-token',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

serve(async (request) => {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders
    });
  }

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
      return new Response(JSON.stringify({
        error: 'AUTHENTICATION_FAILED',
        message: 'Unable to authenticate. Please sign in again.'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // First try to verify as a Supabase session token
    const { data: supabaseUser, error: userError } = await supabase.auth.getUser(token);
    if (userError || !supabaseUser?.user) {
      // If that fails, try the token as a Supabase anonymous key (for backward compatibility)
      console.log('Session token verification failed, checking if anonymous key');
      if (token === Deno.env.get('SUPABASE_ANON_KEY')) {
        return new Response(JSON.stringify({
          error: 'AUTHENTICATION_FAILED',
          message: 'Anonymous access not allowed for reports. Please sign in.'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        error: 'AUTHENTICATION_FAILED',
        message: 'Invalid token. Please sign in again.'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    user = supabaseUser;
  } else {
    user = clerkResult.data;
    supabase = clerkResult.supabaseClient;
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
    return new Response(JSON.stringify({ error: 'Failed to fetch report' }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (!report) {
    // Check if there's a workflow in progress
    const { data: workflow } = await supabase
      .from('workflow_runs')
      .select('id, status, triggered_at')
      .eq('user_id', user.user.id)
      .order('triggered_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (workflow && (workflow.status === 'queued' || workflow.status === 'running')) {
      return new Response(JSON.stringify({ 
        status: 'processing',
        message: 'Your intelligence report is being generated. This may take a few minutes.',
        workflowStatus: workflow.status,
        triggeredAt: workflow.triggered_at
      }), {
        status: 202, // Accepted - still processing
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      status: 'not_found',
      message: 'No report available yet. Please complete the onboarding process.' 
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Transform old report format to new format if necessary
  const payload = report.payload;
  
  // Check if report has old structure (overview instead of summary)
  if (payload.overview && !payload.summary) {
    console.log('Transforming old report format to new format');
    const capturedAt = payload.overview.generated_at || new Date().toISOString();
    
    const transformedPayload = {
      summary: {
        id: 'legacy-report',
        captured_at: capturedAt,
        executive_summary: `Report for ${payload.overview.website || 'your website'}. Industry: ${payload.overview.industry || 'N/A'}. Location: ${payload.overview.location || 'N/A'}.`,
        recommendations: [
          {
            title: 'Legacy Report',
            description: 'This report was generated with an older format. Please regenerate your report for the latest insights.',
            confidence: 0.5
          }
        ]
      },
      serpTimeline: payload.serp_timeline || [],
      keywordOpportunities: payload.keywordOpportunities || [],
      sentiment: payload.contentSentiment || [],
      backlinks: payload.backlinks || [],
      coreWebVitals: Array.isArray(payload.coreWebVitals) ? payload.coreWebVitals : [
        { metric: 'LCP', desktop: 0, mobile: 0 },
        { metric: 'FID', desktop: 0, mobile: 0 },
        { metric: 'CLS', desktop: 0, mobile: 0 }
      ],
      techStack: payload.techStack || []
    };
    
    return new Response(JSON.stringify(transformedPayload), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Return report as-is if it's already in the correct format
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});

