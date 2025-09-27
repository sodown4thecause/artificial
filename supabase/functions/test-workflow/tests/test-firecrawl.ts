interface TestResult {
  service: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  responseTime?: number;
  error?: string;
}

export async function testFirecrawlConnection(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');

  if (!apiKey) {
    return [{
      service: 'Firecrawl',
      status: 'fail',
      message: 'API key not configured (FIRECRAWL_API_KEY) - CRITICAL for competitive analysis',
      error: 'Missing required API key for competitor content analysis and crawling'
    }];
  }

  try {
    const start = Date.now();
    
    // Test with v1 status endpoint (v2 is not available yet)
    const response = await fetch('https://api.firecrawl.dev/v1/status', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    const responseTime = Date.now() - start;

    if (!response.ok) {
      if (response.status === 401) {
        results.push({
          service: 'Firecrawl',
          status: 'fail',
          message: 'API key authentication failed',
          responseTime,
          error: 'Invalid or expired API key'
        });
      } else if (response.status === 403) {
        results.push({
          service: 'Firecrawl',
          status: 'fail',
          message: 'API access forbidden',
          responseTime,
          error: 'API key lacks required permissions'
        });
      } else if (response.status === 429) {
        results.push({
          service: 'Firecrawl',
          status: 'warning',
          message: 'Rate limit exceeded',
          responseTime,
          error: 'Too many requests'
        });
      } else {
        results.push({
          service: 'Firecrawl',
          status: 'fail',
          message: `API request failed (${response.status})`,
          responseTime,
          error: await response.text()
        });
      }
    } else {
      const data = await response.json();
      
      results.push({
        service: 'Firecrawl',
        status: 'pass',
        message: 'API connection successful',
        responseTime
      });

      // Check credits if available in response
      if (data?.credits !== undefined) {
        if (data.credits < 100) {
          results.push({
            service: 'Firecrawl Credits',
            status: 'warning',
            message: `Low credits remaining: ${data.credits}`,
            responseTime
          });
        } else {
          results.push({
            service: 'Firecrawl Credits',
            status: 'pass',
            message: `Credits available: ${data.credits}`,
            responseTime
          });
        }
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      results.push({
        service: 'Firecrawl',
        status: 'fail',
        message: 'Request timeout (10s)',
        error: 'API response too slow'
      });
    } else {
      results.push({
        service: 'Firecrawl',
        status: 'fail',
        message: 'Connection failed',
        error: String(error)
      });
    }
  }

  return results;
}
