interface TestResult {
  service: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  responseTime?: number;
  error?: string;
}

export async function testPageSpeedConnection(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  const apiKey = Deno.env.get('PAGESPEED_API_KEY');

  if (!apiKey) {
    return [{
      service: 'PageSpeed Insights',
      status: 'fail',
      message: 'API key not configured (PAGESPEED_API_KEY) - CRITICAL for Core Web Vitals analysis',
      error: 'Missing required API key for technical SEO performance data'
    }];
  }

  try {
    const start = Date.now();
    
    // Test with a simple URL to verify API access
    const testUrl = 'https://www.google.com';
    const url = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(testUrl)}&strategy=DESKTOP&key=${apiKey}`;
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000)
    });
    
    const responseTime = Date.now() - start;

    if (!response.ok) {
      const errorText = await response.text();
      let message = `API request failed (${response.status})`;
      
      if (response.status === 400) {
        message = 'API key invalid or request malformed';
      } else if (response.status === 403) {
        message = 'API key forbidden or quota exceeded';
      } else if (response.status === 429) {
        message = 'Rate limit exceeded';
      }

      results.push({
        service: 'PageSpeed Insights',
        status: 'fail',
        message,
        responseTime,
        error: errorText
      });
    } else {
      const data = await response.json();
      const hasResults = data?.lighthouseResult?.audits;
      
      if (hasResults) {
        results.push({
          service: 'PageSpeed Insights',
          status: 'pass',
          message: 'API connection successful, data retrieved',
          responseTime
        });
      } else {
        results.push({
          service: 'PageSpeed Insights',
          status: 'warning',
          message: 'API connected but unexpected response format',
          responseTime
        });
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      results.push({
        service: 'PageSpeed Insights',
        status: 'fail',
        message: 'Request timeout (15s)',
        error: 'API response too slow'
      });
    } else {
      results.push({
        service: 'PageSpeed Insights',
        status: 'fail',
        message: 'Connection failed',
        error: String(error)
      });
    }
  }

  return results;
}
