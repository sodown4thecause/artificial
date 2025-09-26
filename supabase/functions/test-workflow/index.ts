import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.5';

// Import all integration test functions
import { testDataForSEOConnections } from './tests/test-dataforseo.ts';
import { testPageSpeedConnection } from './tests/test-pagespeed.ts';
import { testFirecrawlConnection } from './tests/test-firecrawl.ts';
import { testLLMConnections } from './tests/test-llm.ts';
import { testCustomSearchConnection } from './tests/test-search.ts';
import { testVoilaNorbertConnection } from './tests/test-voilanorbert.ts';
// Note: Stripe is for payment processing, not part of the intelligence workflow
import { testWorkflowEndpoint } from './tests/test-workflow-endpoint.ts';

interface TestResult {
  service: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  responseTime?: number;
  error?: string;
}

serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response('Service misconfigured', { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    const { testType, includeIntegrations = true, includeEndpoints = true } = await request.json();

    const results: TestResult[] = [];

    console.log('🧪 Starting workflow tests...');

    // Test Supabase connection first
    try {
      const start = Date.now();
      const { data, error } = await supabase.from('workflow_runs').select('id').limit(1);
      const responseTime = Date.now() - start;
      
      if (error) {
        results.push({
          service: 'Supabase Database',
          status: 'fail',
          message: 'Database connection failed',
          responseTime,
          error: error.message
        });
      } else {
        results.push({
          service: 'Supabase Database',
          status: 'pass',
          message: 'Database connection successful',
          responseTime
        });
      }
    } catch (error) {
      results.push({
        service: 'Supabase Database',
        status: 'fail',
        message: 'Database connection failed',
        error: String(error)
      });
    }

    // Test external API integrations
    if (includeIntegrations) {
      console.log('🔗 Testing API integrations...');
      
      const integrationTests = await Promise.allSettled([
        testDataForSEOConnections(),
        testPageSpeedConnection(),
        testFirecrawlConnection(),
        testLLMConnections(),
        testCustomSearchConnection(),
        testVoilaNorbertConnection()
      ]);

      integrationTests.forEach((test, index) => {
        if (test.status === 'fulfilled') {
          results.push(...test.value);
        } else {
          const services = ['DataForSEO', 'PageSpeed', 'Firecrawl', 'LLM', 'CustomSearch', 'VoilaNorbert'];
          results.push({
            service: services[index] || 'Unknown',
            status: 'fail',
            message: 'Test execution failed',
            error: String(test.reason)
          });
        }
      });
    }

    // Test workflow endpoints
    if (includeEndpoints) {
      console.log('🚀 Testing workflow endpoints...');
      
      try {
        const endpointResults = await testWorkflowEndpoint(supabaseUrl, serviceRoleKey);
        results.push(...endpointResults);
      } catch (error) {
        results.push({
          service: 'Workflow Endpoints',
          status: 'fail',
          message: 'Endpoint testing failed',
          error: String(error)
        });
      }
    }

    // Generate summary
    const summary = {
      total: results.length,
      passed: results.filter(r => r.status === 'pass').length,
      failed: results.filter(r => r.status === 'fail').length,
      warnings: results.filter(r => r.status === 'warning').length
    };

    const report = {
      timestamp: new Date().toISOString(),
      summary,
      results,
      overallStatus: summary.failed === 0 ? 'healthy' : 'issues_detected'
    };

    console.log(`✅ Tests completed: ${summary.passed} passed, ${summary.failed} failed, ${summary.warnings} warnings`);

    return new Response(JSON.stringify(report, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Test runner failed:', error);
    return new Response(JSON.stringify({
      error: 'Test execution failed',
      message: String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
