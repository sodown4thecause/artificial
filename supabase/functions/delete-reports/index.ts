import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.5';

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get user_id from query params or use your current user
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id') || 'user_33UGC9OaRUjNqrjLv6YKNb88qAg';

    // Delete all reports for this user
    const { data: workflows, error: workflowError } = await supabase
      .from('workflow_runs')
      .select('id')
      .eq('user_id', userId);

    if (workflowError) throw workflowError;

    const workflowIds = workflows?.map(w => w.id) || [];

    if (workflowIds.length > 0) {
      // Delete related data
      await supabase.from('reports').delete().in('workflow_id', workflowIds);
      await supabase.from('ai_insights').delete().in('workflow_id', workflowIds);
      await supabase.from('serp_results').delete().in('workflow_id', workflowIds);
      await supabase.from('keyword_metrics').delete().in('workflow_id', workflowIds);
      await supabase.from('backlink_metrics').delete().in('workflow_id', workflowIds);
      await supabase.from('technical_audits').delete().in('workflow_id', workflowIds);
      await supabase.from('content_sentiment').delete().in('workflow_id', workflowIds);
      await supabase.from('business_profiles').delete().in('workflow_id', workflowIds);
      
      // Delete workflow runs
      await supabase.from('workflow_runs').delete().eq('user_id', userId);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Deleted ${workflowIds.length} workflow(s) and related data for user ${userId}`,
        deletedWorkflows: workflowIds.length
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
