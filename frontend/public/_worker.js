// Cloudflare Pages Worker to proxy API requests to Supabase
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-clerk-token',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    
    // Proxy /functions/v1/* to Supabase
    if (url.pathname.startsWith('/functions/v1/')) {
      try {
        const supabasePath = url.pathname.replace('/functions/v1/', '');
        const supabaseUrl = `https://efynkraanhjwfjetnccp.supabase.co/functions/v1/${supabasePath}${url.search}`;
        
        // Clone request with new URL
        const supabaseRequest = new Request(supabaseUrl, {
          method: request.method,
          headers: request.headers,
          body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
        });
        
        const response = await fetch(supabaseRequest);
        
        // Add CORS headers to response
        const newHeaders = new Headers(response.headers);
        newHeaders.set('Access-Control-Allow-Origin', '*');
        newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-clerk-token');
        
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Proxy error', message: error.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }
    
    // For all other requests, fetch from the assets
    return env.ASSETS.fetch(request);
  }
}