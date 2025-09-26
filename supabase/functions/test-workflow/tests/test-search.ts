interface TestResult {
  service: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  responseTime?: number;
  error?: string;
}

export async function testCustomSearchConnection(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  const apiKey = Deno.env.get('CUSTOM_SEARCH_KEY');
  const cseId = Deno.env.get('CUSTOM_SEARCH_CSE_ID');

  if (!apiKey || !cseId) {
    return [{
      service: 'Google Custom Search',
      status: 'fail',
      message: 'API credentials not configured (CUSTOM_SEARCH_KEY or CUSTOM_SEARCH_CSE_ID) - CRITICAL for content discovery',
      error: 'Missing required credentials for news search and content analysis'
    }];
  }

  try {
    const start = Date.now();
    
    // Test with a simple search query
    const testQuery = 'test';
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(testQuery)}&num=1`;
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000)
    });
    
    const responseTime = Date.now() - start;

    if (!response.ok) {
      let message = `API request failed (${response.status})`;
      
      if (response.status === 400) {
        message = 'Invalid request - check CSE ID and API key';
      } else if (response.status === 403) {
        message = 'API key forbidden or quota exceeded';
      } else if (response.status === 429) {
        message = 'Rate limit exceeded';
      }

      results.push({
        service: 'Google Custom Search',
        status: 'fail',
        message,
        responseTime,
        error: await response.text()
      });
    } else {
      const data = await response.json();
      
      if (data?.items || data?.searchInformation) {
        results.push({
          service: 'Google Custom Search',
          status: 'pass',
          message: 'API connection successful, search functional',
          responseTime
        });
      } else if (data?.error) {
        results.push({
          service: 'Google Custom Search',
          status: 'fail',
          message: `API error: ${data.error.message}`,
          responseTime,
          error: data.error.code
        });
      } else {
        results.push({
          service: 'Google Custom Search',
          status: 'warning',
          message: 'API connected but no results returned',
          responseTime
        });
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      results.push({
        service: 'Google Custom Search',
        status: 'fail',
        message: 'Request timeout (10s)',
        error: 'API response too slow'
      });
    } else {
      results.push({
        service: 'Google Custom Search',
        status: 'fail',
        message: 'Connection failed',
        error: String(error)
      });
    }
  }

  return results;
}
