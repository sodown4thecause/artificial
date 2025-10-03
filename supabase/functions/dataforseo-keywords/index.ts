import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getClerkUser } from '../lib/integrations/clerk-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-clerk-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  // Verify Clerk authentication
  const clerkResult = await getClerkUser(req);
  if (clerkResult.error) {
    return new Response(JSON.stringify({
      error: 'AUTHENTICATION_FAILED',
      message: 'Please sign in to use keyword search'
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { keywords, location_code = 2840, language_code = 'en', limit = 10 } = await req.json()

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Keywords array is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get DataForSEO credentials from environment variables
    const username = Deno.env.get('DATAFORSEO_USERNAME')
    const password = Deno.env.get('DATAFORSEO_PASSWORD')

    console.log('🔐 Checking DataForSEO credentials...')
    console.log('   - Username present:', !!username)
    console.log('   - Password present:', !!password)

    if (!username || !password) {
      console.error('❌ DataForSEO credentials not configured')
      return new Response(
        JSON.stringify({ 
          error: 'DataForSEO API not configured',
          message: 'DATAFORSEO_USERNAME and DATAFORSEO_PASSWORD environment variables are required'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Basic Auth header
    const auth = btoa(`${username}:${password}`)

    // Use standard keyword_suggestions endpoint (not .ai)
    console.log('📡 Making DataForSEO keyword suggestions request for:', keywords[0])

    // Make the request to DataForSEO API
    const response = await fetch('https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_suggestions/live', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{
        keyword: keywords[0], // Primary keyword
        location_code: location_code,
        language_code: language_code,
        limit: limit || 50
      }])
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('DataForSEO API error:', response.status, errorText)
      return new Response(
        JSON.stringify({
          error: 'DataForSEO API request failed',
          details: errorText,
          status: response.status
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const data = await response.json()
    console.log('✅ DataForSEO API response received')
    console.log('   - Status code:', data.status_code)
    console.log('   - Tasks:', data.tasks?.length || 0)
    
    // Log the response structure for debugging
    if (data.tasks?.[0]) {
      console.log('   - Task status:', data.tasks[0].status_code, data.tasks[0].status_message)
      console.log('   - Result items:', data.tasks[0].result?.[0]?.items?.length || 0)
    }

    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
