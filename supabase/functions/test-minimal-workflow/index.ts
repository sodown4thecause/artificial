import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.5';
import { getClerkUser } from '../lib/integrations/clerk-auth.ts';

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

    const clerkResult = await getClerkUser(request);
    
    if (clerkResult.error) {
      return new Response(JSON.stringify({
        error: 'AUTHENTICATION_FAILED',
        message: 'Unable to authenticate'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const user = clerkResult.data.user;
    const supabase = clerkResult.supabaseClient;
    
    const payload = await request.json();
    
    console.log('Creating minimal test workflow for user:', user.id);
    
    // Create workflow record
    const { data: workflowRecord, error: workflowError } = await supabase
      .from('workflow_runs')
      .insert({
        user_id: user.id,
        website_url: payload.websiteUrl,
        status: 'running'
      })
      .select('id')
      .single();

    if (workflowError) {
      throw workflowError;
    }

    // Generate minimal report with mock data matching frontend IntelligenceReportPayload type
    const capturedAt = new Date().toISOString();
    const mockReport = {
      summary: {
        id: workflowRecord.id,
        captured_at: capturedAt,
        executive_summary: `Test report generated for ${payload.websiteUrl}. This is a minimal mock report to verify the workflow is functioning correctly.`,
        recommendations: [
          {
            title: 'Test Recommendation 1',
            description: 'This is a test recommendation to verify the dashboard can display data correctly.',
            confidence: 0.85
          },
          {
            title: 'Test Recommendation 2',
            description: 'Another test recommendation for demonstration purposes.',
            confidence: 0.75
          }
        ]
      },
      serpTimeline: [
        { captured_at: capturedAt, share_of_voice: 25 }
      ],
      keywordOpportunities: [
        {
          keyword: payload.industry || 'test keyword',
          volume: 1000,
          difficulty: 50,
          ctrPotential: 0.15
        }
      ],
      sentiment: [
        { label: 'Positive', score: 75 },
        { label: 'Neutral', score: 50 },
        { label: 'Negative', score: 25 }
      ],
      backlinks: [],
      coreWebVitals: [
        { metric: 'LCP', desktop: 2.5, mobile: 3.5 },
        { metric: 'FID', desktop: 100, mobile: 150 },
        { metric: 'CLS', desktop: 0.1, mobile: 0.15 }
      ],
      techStack: []
    };

    // Store report
    await supabase.from('reports').insert({
      workflow_id: workflowRecord.id,
      payload: mockReport
    });

    // Mark as completed
    await supabase
      .from('workflow_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', workflowRecord.id);

    return new Response(JSON.stringify({
      workflowId: workflowRecord.id,
      status: 'completed',
      message: 'Test report generated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Test workflow failed:', error);
    return new Response(JSON.stringify({
      error: 'WORKFLOW_FAILED',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});