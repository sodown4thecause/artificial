interface TestResult {
  service: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  responseTime?: number;
  error?: string;
}

export async function testVoilaNorbertConnection(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  const apiKey = Deno.env.get('VOILANORBERT_API_KEY');

  if (!apiKey) {
    return [{
      service: 'VoilaNorbert',
      status: 'fail',
      message: 'API key not configured (VOILANORBERT_API_KEY) - CRITICAL for business intelligence',
      error: 'Missing required API key for contact enrichment and business data analysis'
    }];
  }

  try {
    const start = Date.now();
    
    // Test with account info endpoint to verify API access
    const response = await fetch('https://app.voilanorbert.com/api/2014-06-15/account/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    const responseTime = Date.now() - start;

    if (!response.ok) {
      let message = `API request failed (${response.status})`;
      
      if (response.status === 401) {
        message = 'API key authentication failed';
      } else if (response.status === 403) {
        message = 'API access forbidden';
      } else if (response.status === 429) {
        message = 'Rate limit exceeded';
      }

      results.push({
        service: 'VoilaNorbert',
        status: 'fail',
        message,
        responseTime,
        error: await response.text()
      });
    } else {
      const data = await response.json();
      
      results.push({
        service: 'VoilaNorbert',
        status: 'pass',
        message: 'API connection successful',
        responseTime
      });

      // Check credits if available
      if (data?.credits !== undefined) {
        if (data.credits < 50) {
          results.push({
            service: 'VoilaNorbert Credits',
            status: 'warning',
            message: `Low credits remaining: ${data.credits}`,
            responseTime
          });
        } else {
          results.push({
            service: 'VoilaNorbert Credits',
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
        service: 'VoilaNorbert',
        status: 'fail',
        message: 'Request timeout (10s)',
        error: 'API response too slow'
      });
    } else {
      results.push({
        service: 'VoilaNorbert',
        status: 'fail',
        message: 'Connection failed',
        error: String(error)
      });
    }
  }

  return results;
}
