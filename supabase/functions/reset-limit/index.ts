import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.5';

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get user_id from query params or use your current user
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id') || 'user_33UGC9OaRUjNqrjLv6YKNb88qAg';

    // Delete the daily limit record
    const { error } = await supabase
      .from('daily_report_limits')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Daily limit reset for user ${userId}`,
        userId 
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
