// Cloudflare Pages Function to proxy API requests to Supabase
export async function onRequest(context: any) {
  const { request } = context;
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  
  try {
    // Extract the path after /functions/v1/
    const path = Array.isArray(context.params.path) 
      ? context.params.path.join('/') 
      : context.params.path;
    
    // Construct the Supabase function URL
    const supabaseUrl = `https://efynkraanhjwfjetnccp.supabase.co/functions/v1/${path}`;
    
    // Clone the request headers
    const headers = new Headers(request.headers);
    
    // Forward the request to Supabase
    const supabaseResponse = await fetch(supabaseUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
    });
    
    // Clone response and add CORS headers
    const responseBody = await supabaseResponse.arrayBuffer();
    const newHeaders = new Headers(supabaseResponse.headers);
    newHeaders.set('Access-Control-Allow-Origin', '*');
    newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return new Response(responseBody, {
      status: supabaseResponse.status,
      statusText: supabaseResponse.statusText,
      headers: newHeaders,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Proxy error', message: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}