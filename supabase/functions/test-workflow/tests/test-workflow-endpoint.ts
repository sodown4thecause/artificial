interface TestResult {
  service: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  responseTime?: number;
  error?: string;
}

export async function testWorkflowEndpoint(supabaseUrl: string, serviceRoleKey: string): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test reports-latest endpoint
  try {
    const start = Date.now();
    const response = await fetch(`${supabaseUrl}/functions/v1/reports-latest`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });
    const responseTime = Date.now() - start;

    if (response.status === 404) {
      results.push({
        service: 'Reports Latest Endpoint',
        status: 'pass',
        message: 'Endpoint accessible (404 expected without user context)',
        responseTime
      });
    } else if (response.status === 401) {
      results.push({
        service: 'Reports Latest Endpoint',
        status: 'warning',
        message: 'Endpoint requires user authentication',
        responseTime
      });
    } else if (response.ok) {
      results.push({
        service: 'Reports Latest Endpoint',
        status: 'pass',
        message: 'Endpoint accessible and responding',
        responseTime
      });
    } else {
      results.push({
        service: 'Reports Latest Endpoint',
        status: 'fail',
        message: `Endpoint failed (${response.status})`,
        responseTime,
        error: await response.text()
      });
    }
  } catch (error) {
    results.push({
      service: 'Reports Latest Endpoint',
      status: 'fail',
      message: 'Endpoint connection failed',
      error: String(error)
    });
  }

  // Test run-intelligence-workflow endpoint (without triggering actual workflow)
  try {
    const start = Date.now();
    const response = await fetch(`${supabaseUrl}/functions/v1/run-intelligence-workflow`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}), // Empty payload to test validation
      signal: AbortSignal.timeout(5000)
    });
    const responseTime = Date.now() - start;

    if (response.status === 400) {
      results.push({
        service: 'Workflow Trigger Endpoint',
        status: 'pass',
        message: 'Endpoint accessible and validating input (400 expected for empty payload)',
        responseTime
      });
    } else if (response.status === 401) {
      results.push({
        service: 'Workflow Trigger Endpoint',
        status: 'warning',
        message: 'Endpoint requires proper authentication',
        responseTime
      });
    } else if (response.status === 500) {
      results.push({
        service: 'Workflow Trigger Endpoint',
        status: 'fail',
        message: 'Internal server error - check function logs',
        responseTime,
        error: await response.text()
      });
    } else {
      results.push({
        service: 'Workflow Trigger Endpoint',
        status: 'pass',
        message: `Endpoint responding (${response.status})`,
        responseTime
      });
    }
  } catch (error) {
    results.push({
      service: 'Workflow Trigger Endpoint',
      status: 'fail',
      message: 'Endpoint connection failed',
      error: String(error)
    });
  }

  // Test run-weekly endpoint
  try {
    const start = Date.now();
    const response = await fetch(`${supabaseUrl}/functions/v1/run-weekly`, {
      method: 'POST',
      headers: {
        'x-scheduler-secret': 'test-secret',
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(5000)
    });
    const responseTime = Date.now() - start;

    if (response.status === 401) {
      results.push({
        service: 'Weekly Scheduler Endpoint',
        status: 'pass',
        message: 'Endpoint accessible and validating scheduler secret',
        responseTime
      });
    } else if (response.ok) {
      results.push({
        service: 'Weekly Scheduler Endpoint',
        status: 'warning',
        message: 'Endpoint accessible but may have executed with test secret',
        responseTime
      });
    } else {
      results.push({
        service: 'Weekly Scheduler Endpoint',
        status: 'fail',
        message: `Endpoint failed (${response.status})`,
        responseTime,
        error: await response.text()
      });
    }
  } catch (error) {
    results.push({
      service: 'Weekly Scheduler Endpoint',
      status: 'fail',
      message: 'Endpoint connection failed',
      error: String(error)
    });
  }

  return results;
}
