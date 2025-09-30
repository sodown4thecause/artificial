// Cloudflare Pages Function to proxy API requests to Supabase
export async function onRequest(context: any) {
  const { request } = context;
  const url = new URL(request.url);
  
  // Extract the path after /functions/v1/
  const path = context.params.path.join('/');
  
  // Construct the Supabase function URL
  const supabaseUrl = `https://efynkraanhjwfjetnccp.supabase.co/functions/v1/${path}`;
  
  // Forward the request to Supabase
  const supabaseRequest = new Request(supabaseUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
  
  // Get response from Supabase
  const response = await fetch(supabaseRequest);
  
  // Return the response with CORS headers
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}