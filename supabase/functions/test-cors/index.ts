import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-clerk-token',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

serve(async (request) => {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  const headers = {
    'authorization': request.headers.get('authorization'),
    'x-clerk-token': request.headers.get('x-clerk-token'),
    'apikey': request.headers.get('apikey')
  };

  return new Response(JSON.stringify({
    message: 'Test successful!',
    method: request.method,
    headers: headers,
    url: request.url
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
