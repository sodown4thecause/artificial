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

  // Test authentication with balance check
  try {
    const start = Date.now();
    const response = await fetch(`${baseUrl}/v3/user/money_balance`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      signal: AbortSignal.timeout(10000)
    });
    const responseTime = Date.now() - start;

    if (!response.ok) {
      results.push({
        service: 'DataForSEO Auth',
        status: 'fail',
        message: `Authentication failed (${response.status})`,
        responseTime,
        error: await response.text()
      });
      // If auth fails, no point testing other endpoints
      return results;
    } else {
      const data = await response.json();
      const balance = data?.tasks?.[0]?.result?.[0]?.money_balance ?? 0;
      
      results.push({
        service: 'DataForSEO Auth',
        status: 'pass',
        message: `Authentication successful, balance: $${balance}`,
        responseTime
      });

      if (balance < 10) {
        results.push({
          service: 'DataForSEO Balance',
          status: 'warning',
          message: `Low balance: $${balance} - consider topping up`,
          responseTime
        });
      }
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

  // Test all DataForSEO endpoints used in your workflow (single API, multiple endpoints)
  const endpoints = [
    {
      name: 'AI Optimization API',
      url: '/v3/ai_optimization/tasks_ready',
      description: 'Keyword discovery and conversational optimization'
    },
    {
      name: 'SERP API',
      url: '/v3/serp/google/organic/tasks_ready',
      description: 'Real-time SERP data for Google, Bing, Yahoo'
    },
    {
      name: 'Keywords Data API',
      url: '/v3/keywords_data/google_ads/search_volume/tasks_ready',
      description: 'Keyword research and clickstream data'
    },
    {
      name: 'OnPage API',
      url: '/v3/on_page/tasks_ready',
      description: 'Website crawling and on-page SEO metrics'
    },
    {
      name: 'DataForSEO Labs API',
      url: '/v3/dataforseo_labs/google/serp_competitors/tasks_ready',
      description: 'Keyword, SERP, and domain data from proprietary databases'
    },
    {
      name: 'Backlinks API',
      url: '/v3/backlinks/backlinks/tasks_ready',
      description: 'Comprehensive backlink analysis'
    },
    {
      name: 'Business Data API',
      url: '/v3/business_data/google/my_business/tasks_ready',
      description: 'Publicly available business entity data'
    },
    {
      name: 'Domain Analytics API',
      url: '/v3/domain_analytics/technologies/domain_technologies/tasks_ready',
      description: 'Website traffic, technologies, and Whois data'
    },
    {
      name: 'Content Analysis API',
      url: '/v3/content_analysis/sentiment_analysis/tasks_ready',
      description: 'Brand monitoring and sentiment analysis'
    }
  ];

  // Test each endpoint
  await Promise.allSettled(
    endpoints.map(async (endpoint) => {
      try {
        const start = Date.now();
        const response = await fetch(`${baseUrl}${endpoint.url}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${credentials}`
          },
          signal: AbortSignal.timeout(10000)
        });
        const responseTime = Date.now() - start;

        if (response.ok) {
          results.push({
            service: `DataForSEO ${endpoint.name}`,
            status: 'pass',
            message: `${endpoint.description} - Endpoint accessible`,
            responseTime
          });
        } else {
          results.push({
            service: `DataForSEO ${endpoint.name}`,
            status: 'fail',
            message: `${endpoint.description} - Endpoint failed (${response.status})`,
            responseTime,
            error: await response.text()
          });
        }
      } catch (error) {
        results.push({
          service: `DataForSEO ${endpoint.name}`,
          status: 'fail',
          message: `${endpoint.description} - Connection failed`,
          error: String(error)
        });
      }
    })
  );

  // Test rate limits by checking user limits
  try {
    const start = Date.now();
    const response = await fetch(`${baseUrl}/v3/user/limits`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
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
