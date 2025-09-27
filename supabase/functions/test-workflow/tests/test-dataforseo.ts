interface TestResult {
  service: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  responseTime?: number;
  error?: string;
}

export async function testDataForSEOConnections(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  const login = Deno.env.get('DATAFORSEO_LOGIN');
  const password = Deno.env.get('DATAFORSEO_PASSWORD');

  if (!login || !password) {
    return [{
      service: 'DataForSEO',
      status: 'fail',
      message: 'Missing credentials (DATAFORSEO_LOGIN or DATAFORSEO_PASSWORD)',
      error: 'Environment variables not configured'
    }];
  }

  const credentials = btoa(`${login}:${password}`);
  const baseUrl = 'https://api.dataforseo.com';

  // Test authentication with a simple check
  try {
    const start = Date.now();
    // Try a simple request to verify credentials are working
    const response = await fetch(`${baseUrl}/v3/serp/google/organic/task_post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify([{
        keyword: 'test auth',
        location_name: 'United States',
        language_name: 'English'
      }]),
      signal: AbortSignal.timeout(10000)
    });
    const responseTime = Date.now() - start;

    const data = await response.json();
    
    // Check if we get a valid response (not necessarily successful task)
    if (data.status_code && (data.status_code === 20000 || data.status_code === 40001)) {
      results.push({
        service: 'DataForSEO Auth',
        status: 'pass',
        message: `Authentication successful (${data.status_message || 'API accessible'})`,
        responseTime
      });
      
      // Check for insufficient credits warning
      if (data.status_code === 40001) {
        results.push({
          service: 'DataForSEO Balance',
          status: 'warning',
          message: 'Insufficient balance - add credits to use DataForSEO',
          responseTime
        });
      }
    } else {
      results.push({
        service: 'DataForSEO Auth',
        status: 'fail',
        message: `Authentication issue: ${data.status_message || 'Unknown error'}`,
        responseTime,
        error: JSON.stringify(data)
      });
      return results; // Don't test other endpoints if auth fails
    }
  } catch (error) {
    results.push({
      service: 'DataForSEO Auth',
      status: 'fail',
      message: 'Connection failed',
      error: String(error)
    });
    return results;
  }

  // Test core DataForSEO endpoints used in the workflow
  const endpoints = [
    {
      name: 'SERP API Task Post',
      url: '/v3/serp/google/organic/task_post',
      description: 'SERP data collection',
      testPayload: [{ keyword: 'test', location_name: 'United States', language_name: 'English' }]
    },
    {
      name: 'Keywords Data API Task Post',
      url: '/v3/keywords_data/google_ads/search_volume/task_post',
      description: 'Keyword research',
      testPayload: [{ language_name: 'English', location_name: 'United States', keywords: ['test'] }]
    }
  ];

  // Test each DataForSEO endpoint
  for (const endpoint of endpoints) {
    try {
      const start = Date.now();
      const response = await fetch(`${baseUrl}${endpoint.url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`
        },
        body: JSON.stringify(endpoint.testPayload),
        signal: AbortSignal.timeout(15000)
      });
      const responseTime = Date.now() - start;

      const data = await response.json();
      
      // DataForSEO uses specific status codes
      if (data.status_code === 20000) {
        results.push({
          service: `DataForSEO ${endpoint.name}`,
          status: 'pass',
          message: `${endpoint.description} - Working (${data.status_message})`,
          responseTime
        });
      } else if (data.status_code === 40001) {
        results.push({
          service: `DataForSEO ${endpoint.name}`,
          status: 'warning',
          message: `${endpoint.description} - Insufficient balance`,
          responseTime
        });
      } else if (data.status_code === 40400) {
        results.push({
          service: `DataForSEO ${endpoint.name}`,
          status: 'fail',
          message: `${endpoint.description} - Endpoint not found or not accessible`,
          responseTime,
          error: data.status_message
        });
      } else {
        results.push({
          service: `DataForSEO ${endpoint.name}`,
          status: 'fail',
          message: `${endpoint.description} - Error: ${data.status_message}`,
          responseTime,
          error: `Status code: ${data.status_code}`
        });
      }
      
      // Add delay between API calls
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      results.push({
        service: `DataForSEO ${endpoint.name}`,
        status: 'fail',
        message: `${endpoint.description} - Connection failed`,
        error: String(error)
      });
    }
  }

  // Test rate limits by checking user limits
  try {
    const start = Date.now();
    const response = await fetch(`${baseUrl}/v3/user/limits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify([{}]),
      signal: AbortSignal.timeout(10000)
    });
    const responseTime = Date.now() - start;

    if (response.ok) {
      const data = await response.json();
      const limits = data?.tasks?.[0]?.result ?? [];
      
      results.push({
        service: 'DataForSEO Rate Limits',
        status: 'pass',
        message: `Rate limits retrieved (${limits.length} endpoints)`,
        responseTime
      });

      // Check for any endpoints approaching limits
      limits.forEach((limit: any) => {
        if (limit.usage_percentage > 80) {
          results.push({
            service: `DataForSEO ${limit.api_name} Endpoint`,
            status: 'warning',
            message: `High usage: ${limit.usage_percentage}% of daily limit`,
            responseTime
          });
        }
      });
    }
  } catch (error) {
    results.push({
      service: 'DataForSEO Rate Limits',
      status: 'warning',
      message: 'Could not check rate limits',
      error: String(error)
    });
  }

  return results;
}
