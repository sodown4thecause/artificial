import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.5';
import { triggerWorkflow } from '../lib/workflow-orchestrator.ts';

/**
 * Test Single Workflow Function
 * 
 * This function allows you to test a complete workflow with a real website
 * without affecting production data. Perfect for debugging and validation.
 */

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

    const { 
      websiteUrl, 
      industry = 'technology', 
      location = 'United States',
      fullName = 'Test User',
      dryRun = false,
      testTimeout = 300000 // 5 minutes default timeout
    } = await request.json();

    if (!websiteUrl) {
      return new Response(JSON.stringify({
        error: 'Missing required field: websiteUrl'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`🧪 Testing workflow for: ${websiteUrl}`);
    console.log(`   Industry: ${industry}`);
    console.log(`   Location: ${location}`);
    console.log(`   Dry Run: ${dryRun}`);

    const startTime = Date.now();
    const testResults = {
      website_url: websiteUrl,
      test_started_at: new Date().toISOString(),
      dry_run: dryRun,
      steps: [] as any[],
      errors: [] as any[],
      warnings: [] as any[]
    };

    // Create a test user for this workflow
    const testUserId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // If not dry run, create actual workflow
    if (!dryRun) {
      try {
        testResults.steps.push({
          step: 'trigger_workflow',
          status: 'started',
          timestamp: new Date().toISOString()
        });

        // Create a mock user object for testing
        const mockUser = {
          id: testUserId,
          email: 'test@example.com',
          user_metadata: {},
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        };

        const payload = {
          fullName,
          websiteUrl,
          industry,
          location
        };

        const result = await triggerWorkflow(supabase, mockUser as any, payload);

        testResults.steps.push({
          step: 'trigger_workflow',
          status: 'completed',
          timestamp: new Date().toISOString(),
          workflow_id: result.workflowId,
          result
        });

        // Monitor the workflow progress
        const workflowId = result.workflowId;
        let workflowCompleted = false;
        let attempts = 0;
        const maxAttempts = Math.floor(testTimeout / 5000); // Check every 5 seconds

        while (!workflowCompleted && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
          attempts++;

          const { data: workflowRun } = await supabase
            .from('workflow_runs')
            .select('status, metadata, completed_at')
            .eq('id', workflowId)
            .single();

          if (workflowRun) {
            if (workflowRun.status === 'completed') {
              workflowCompleted = true;
              testResults.steps.push({
                step: 'workflow_completion',
                status: 'completed',
                timestamp: new Date().toISOString(),
                duration_seconds: Math.round((Date.now() - startTime) / 1000)
              });

              // Fetch generated data
              const [serpResults, keywordMetrics, reports] = await Promise.all([
                supabase.from('serp_results').select('*').eq('workflow_id', workflowId),
                supabase.from('keyword_metrics').select('*').eq('workflow_id', workflowId),
                supabase.from('reports').select('*').eq('workflow_id', workflowId)
              ]);

              testResults.steps.push({
                step: 'data_verification',
                status: 'completed',
                timestamp: new Date().toISOString(),
                data_summary: {
                  serp_results: serpResults.data?.length || 0,
                  keyword_metrics: keywordMetrics.data?.length || 0,
                  reports: reports.data?.length || 0
                }
              });

            } else if (workflowRun.status === 'failed') {
              workflowCompleted = true;
              testResults.steps.push({
                step: 'workflow_completion',
                status: 'failed',
                timestamp: new Date().toISOString(),
                error: workflowRun.metadata?.error || 'Unknown error'
              });
              testResults.errors.push({
                source: 'workflow_execution',
                error: workflowRun.metadata?.error || 'Workflow failed with unknown error'
              });
            }
          }
        }

        if (!workflowCompleted) {
          testResults.warnings.push({
            source: 'timeout',
            message: `Workflow did not complete within ${testTimeout / 1000} seconds`
          });
        }

        // Clean up test data
        if (workflowId) {
          console.log('🧹 Cleaning up test data...');
          await Promise.allSettled([
            supabase.from('workflow_runs').delete().eq('id', workflowId),
            supabase.from('onboarding_profiles').delete().eq('user_id', testUserId),
            supabase.from('serp_results').delete().eq('workflow_id', workflowId),
            supabase.from('keyword_metrics').delete().eq('workflow_id', workflowId),
            supabase.from('reports').delete().eq('workflow_id', workflowId),
            supabase.from('ai_insights').delete().eq('workflow_id', workflowId),
            supabase.from('technical_audits').delete().eq('workflow_id', workflowId),
            supabase.from('content_sentiment').delete().eq('workflow_id', workflowId),
            supabase.from('backlink_metrics').delete().eq('workflow_id', workflowId),
            supabase.from('business_profiles').delete().eq('workflow_id', workflowId)
          ]);
        }

      } catch (error) {
        testResults.steps.push({
          step: 'trigger_workflow',
          status: 'failed',
          timestamp: new Date().toISOString(),
          error: String(error)
        });
        testResults.errors.push({
          source: 'workflow_trigger',
          error: String(error)
        });
      }
    } else {
      // Dry run - test individual components
      console.log('🏃‍♂️ Running dry run tests...');
      
      const dryRunTests = [
        {
          name: 'DataForSEO SERP API',
          test: async () => {
            const { fetchSerpResults } = await import('../lib/integrations/dataforseo.ts');
            return await fetchSerpResults({
              workflowId: 'test',
              userId: testUserId,
              websiteUrl,
              industry,
              location,
              fullName
            });
          }
        },
        {
          name: 'DataForSEO Keywords API',
          test: async () => {
            const { fetchKeywordMetrics } = await import('../lib/integrations/dataforseo.ts');
            return await fetchKeywordMetrics({
              workflowId: 'test',
              userId: testUserId,
              websiteUrl,
              industry,
              location,
              fullName
            });
          }
        },
        {
          name: 'PageSpeed API',
          test: async () => {
            const { fetchPageSpeedMetrics } = await import('../lib/integrations/pagespeed.ts');
            return await fetchPageSpeedMetrics({
              workflowId: 'test',
              userId: testUserId,
              websiteUrl,
              industry,
              location,
              fullName
            });
          }
        },
        {
          name: 'Backlinks API',
          test: async () => {
            const { fetchBacklinkMetrics } = await import('../lib/integrations/backlinks.ts');
            return await fetchBacklinkMetrics({
              workflowId: 'test',
              userId: testUserId,
              websiteUrl,
              industry,
              location,
              fullName
            });
          }
        }
      ];

      for (const test of dryRunTests) {
        try {
          console.log(`  Testing ${test.name}...`);
          const stepStart = Date.now();
          
          testResults.steps.push({
            step: test.name,
            status: 'started',
            timestamp: new Date().toISOString()
          });

          const result = await test.test();
          
          testResults.steps.push({
            step: test.name,
            status: 'completed',
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - stepStart,
            data_summary: {
              result_count: Array.isArray(result) ? result.length : result ? 1 : 0,
              has_data: !!result
            }
          });

        } catch (error) {
          testResults.steps.push({
            step: test.name,
            status: 'failed',
            timestamp: new Date().toISOString(),
            error: String(error)
          });
          testResults.errors.push({
            source: test.name,
            error: String(error)
          });
        }
      }
    }

    testResults.test_completed_at = new Date().toISOString();
    testResults.total_duration_seconds = Math.round((Date.now() - startTime) / 1000);
    testResults.overall_status = testResults.errors.length === 0 ? 'success' : 'failed';

    // Generate summary
    const summary = {
      website: websiteUrl,
      status: testResults.overall_status,
      duration: `${testResults.total_duration_seconds}s`,
      steps_completed: testResults.steps.filter(s => s.status === 'completed').length,
      steps_failed: testResults.steps.filter(s => s.status === 'failed').length,
      errors: testResults.errors.length,
      warnings: testResults.warnings.length
    };

    console.log(`✅ Test completed: ${summary.status} in ${summary.duration}`);

    return new Response(JSON.stringify({
      summary,
      details: testResults
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Test execution failed:', error);
    return new Response(JSON.stringify({
      error: 'Test execution failed',
      message: String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
