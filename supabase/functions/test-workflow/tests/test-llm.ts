interface TestResult {
  service: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  responseTime?: number;
  error?: string;
}

export async function testLLMConnections(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  // Test Anthropic (Claude)
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicKey) {
    results.push({
      service: 'Anthropic Claude',
      status: 'fail',
      message: 'API key not configured (ANTHROPIC_API_KEY)',
      error: 'Required for AI insights generation'
    });
  } else {
    try {
      const start = Date.now();
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307', // Use faster, cheaper model for testing
          max_tokens: 10,
          messages: [{
            role: 'user',
            content: 'Hello'
          }]
        }),
        signal: AbortSignal.timeout(15000)
      });
      
      const responseTime = Date.now() - start;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let message = `API request failed (${response.status})`;
        
        if (response.status === 401) {
          message = 'API key authentication failed';
        } else if (response.status === 403) {
          message = 'API access forbidden or insufficient credits';
        } else if (response.status === 429) {
          message = 'Rate limit exceeded';
        }

        results.push({
          service: 'Anthropic Claude',
          status: 'fail',
          message,
          responseTime,
          error: errorData?.error?.message || 'Unknown error'
        });
      } else {
        const data = await response.json();
        if (data?.content && Array.isArray(data.content)) {
          results.push({
            service: 'Anthropic Claude',
            status: 'pass',
            message: 'API connection successful, model responsive',
            responseTime
          });
        } else {
          results.push({
            service: 'Anthropic Claude',
            status: 'warning',
            message: 'API connected but unexpected response format',
            responseTime
          });
        }
      }
    } catch (error) {
      results.push({
        service: 'Anthropic Claude',
        status: 'fail',
        message: 'Connection failed',
        error: String(error)
      });
    }
  }

  // Test Perplexity (optional)
  const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
  if (!perplexityKey) {
    results.push({
      service: 'Perplexity AI',
      status: 'fail',
      message: 'API key not configured (PERPLEXITY_API_KEY) - CRITICAL for real-time market intelligence',
      error: 'Missing required API key for live data synthesis and market research'
    });
  } else {
    try {
      const start = Date.now();
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${perplexityKey}`
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [{
            role: 'user',
            content: 'Hello'
          }],
          max_tokens: 10
        }),
        signal: AbortSignal.timeout(15000)
      });
      
      const responseTime = Date.now() - start;

      if (!response.ok) {
        let message = `API request failed (${response.status})`;
        
        if (response.status === 401) {
          message = 'API key authentication failed';
        } else if (response.status === 403) {
          message = 'API access forbidden or insufficient credits';
        } else if (response.status === 429) {
          message = 'Rate limit exceeded';
        }

        results.push({
          service: 'Perplexity AI',
          status: 'fail',
          message,
          responseTime,
          error: await response.text()
        });
      } else {
        const data = await response.json();
        if (data?.choices && Array.isArray(data.choices)) {
          results.push({
            service: 'Perplexity AI',
            status: 'pass',
            message: 'API connection successful, model responsive',
            responseTime
          });
        } else {
          results.push({
            service: 'Perplexity AI',
            status: 'warning',
            message: 'API connected but unexpected response format',
            responseTime
          });
        }
      }
    } catch (error) {
      results.push({
        service: 'Perplexity AI',
        status: 'fail',
        message: 'Connection failed',
        error: String(error)
      });
    }
  }

  return results;
}
