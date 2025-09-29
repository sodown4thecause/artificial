import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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

    // Get DataForSEO API credentials from environment variables
    const dataforseoUsername = Deno.env.get('DATAFORSEO_USERNAME')
    const dataforseoPassword = Deno.env.get('DATAFORSEO_PASSWORD')

    if (!dataforseoUsername || !dataforseoPassword) {
      console.error('DataForSEO credentials not configured')
      return new Response(
        JSON.stringify({ error: 'DataForSEO API not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Prepare the request data for DataForSEO
    const requestData = {
      data: keywords.map(keyword => ({
        keyword,
        location_code,
        language_code,
        limit
      }))
    }

    console.log('Making DataForSEO API request:', requestData)

    // Make the request to DataForSEO API
    const response = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${dataforseoUsername}:${dataforseoPassword}`)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([requestData])
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
    console.log('DataForSEO API response received')

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
