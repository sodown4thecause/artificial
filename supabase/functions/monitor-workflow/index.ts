import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.5';

interface WorkflowStats {
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  running_runs: number;
  avg_duration_minutes: number;
  success_rate: number;
  last_24h_runs: number;
  last_failure?: {
    id: string;
    error: string;
    created_at: string;
  };
}

interface APIHealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  last_checked: string;
  response_time_ms?: number;
  error_message?: string;
}

serve(async (request) => {
  if (request.method !== 'GET') {
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

    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'json';
    const days = parseInt(url.searchParams.get('days') || '7');

    console.log('📊 Generating workflow monitoring report...');

    // Get workflow statistics
    const workflowStats = await getWorkflowStats(supabase, days);
    
    // Get recent workflow runs with details
    const recentRuns = await getRecentWorkflowRuns(supabase, 20);
    
    // Get database health
    const dbHealth = await getDatabaseHealth(supabase);
    
    // Test API health (quick version)
    const apiHealth = await getAPIHealthStatus();

    // Calculate overall system health
    const systemHealth = calculateSystemHealth(workflowStats, apiHealth, dbHealth);

    const report = {
      timestamp: new Date().toISOString(),
      system_health: systemHealth,
      workflow_stats: workflowStats,
      recent_runs: recentRuns,
      database_health: dbHealth,
      api_health: apiHealth,
      recommendations: generateRecommendations(workflowStats, apiHealth, dbHealth)
    };

    if (format === 'html') {
      const html = generateHTMLReport(report);
      return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    return new Response(JSON.stringify(report, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Monitor failed:', error);
    return new Response(JSON.stringify({
      error: 'Monitoring failed',
      message: String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

async function getWorkflowStats(supabase: any, days: number): Promise<WorkflowStats> {
  const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  
  // Get total counts  
  const { data: runs, error } = await supabase
    .from('workflow_runs')
    .select('id, status, triggered_at, completed_at, metadata')
    .gte('triggered_at', sinceDate);

  if (error) {
    throw new Error(`Failed to fetch workflow stats: ${error.message}`);
  }

  const total_runs = runs?.length || 0;
  const successful_runs = runs?.filter((r: any) => r.status === 'completed').length || 0;
  const failed_runs = runs?.filter((r: any) => r.status === 'failed').length || 0;
  const running_runs = runs?.filter((r: any) => r.status === 'running').length || 0;

  // Calculate average duration for completed runs
  const completedRuns = runs?.filter((r: any) => r.status === 'completed' && r.completed_at) || [];
  const durations = completedRuns.map((r: any) => {
    const start = new Date(r.triggered_at).getTime();
    const end = new Date(r.completed_at).getTime();
    return (end - start) / (1000 * 60); // minutes
  });
  const avg_duration_minutes = durations.length > 0 
    ? durations.reduce((a, b) => a + b, 0) / durations.length 
    : 0;

  // Get last 24 hours
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const last_24h_runs = runs?.filter((r: any) => r.triggered_at >= last24h).length || 0;

  // Get last failure
  const lastFailure = runs
    ?.filter((r: any) => r.status === 'failed')
    .sort((a: any, b: any) => new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime())[0];

  return {
    total_runs,
    successful_runs,
    failed_runs,
    running_runs,
    avg_duration_minutes: Math.round(avg_duration_minutes * 100) / 100,
    success_rate: total_runs > 0 ? Math.round((successful_runs / total_runs) * 100 * 100) / 100 : 0,
    last_24h_runs,
    last_failure: lastFailure ? {
      id: lastFailure.id,
      error: lastFailure.metadata?.error || 'Unknown error',
      triggered_at: lastFailure.triggered_at
    } : undefined
  };
}

async function getRecentWorkflowRuns(supabase: any, limit: number) {
  const { data: runs, error } = await supabase
    .from('workflow_runs')
    .select('id, user_id, website_url, status, triggered_at, completed_at, metadata')
    .order('triggered_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('Failed to fetch recent runs:', error);
    return [];
  }

  return runs?.map((run: any) => ({
    id: run.id,
    website_url: run.website_url,
    status: run.status,
    triggered_at: run.triggered_at,
    completed_at: run.completed_at,
    duration_minutes: run.completed_at 
      ? Math.round(((new Date(run.completed_at).getTime() - new Date(run.triggered_at).getTime()) / (1000 * 60)) * 100) / 100
      : null,
    error: run.metadata?.error || null
  })) || [];
}

async function getDatabaseHealth(supabase: any) {
  const checks = [];
  
  // Test basic connectivity
  try {
    const start = Date.now();
    const { data, error } = await supabase.from('workflow_runs').select('id').limit(1);
    const responseTime = Date.now() - start;
    
    checks.push({
      check: 'database_connectivity',
      status: error ? 'fail' : 'pass',
      response_time_ms: responseTime,
      message: error ? error.message : 'Database accessible'
    });
  } catch (error) {
    checks.push({
      check: 'database_connectivity',
      status: 'fail',
      message: String(error)
    });
  }

  // Check if all required tables exist
  const tables = ['workflow_runs', 'onboarding_profiles', 'reports', 'serp_results', 'keyword_metrics'];
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      checks.push({
        check: `table_${table}`,
        status: error ? 'fail' : 'pass',
        message: error ? error.message : `Table ${table} accessible`
      });
    } catch (error) {
      checks.push({
        check: `table_${table}`,
        status: 'fail',
        message: String(error)
      });
    }
  }

  return {
    overall_status: checks.every(c => c.status === 'pass') ? 'healthy' : 'issues',
    checks
  };
}

async function getAPIHealthStatus(): Promise<APIHealthStatus[]> {
  const apis: APIHealthStatus[] = [];
  
  // Quick health checks for each service
  const services = [
    { name: 'DataForSEO', check: async () => checkDataForSEO() },
    { name: 'PageSpeed', check: async () => checkPageSpeed() },
    { name: 'Firecrawl', check: async () => checkFirecrawl() },
    { name: 'Anthropic', check: async () => checkAnthropic() },
    { name: 'Perplexity', check: async () => checkPerplexity() },
    { name: 'CustomSearch', check: async () => checkCustomSearch() },
    { name: 'VoilaNorbert', check: async () => checkVoilaNorbert() }
  ];

  await Promise.allSettled(
    services.map(async (service) => {
      try {
        const result = await service.check();
        apis.push({
          service: service.name,
          status: result.status,
          last_checked: new Date().toISOString(),
          response_time_ms: result.response_time,
          error_message: result.error
        });
      } catch (error) {
        apis.push({
          service: service.name,
          status: 'unknown',
          last_checked: new Date().toISOString(),
          error_message: String(error)
        });
      }
    })
  );

  return apis;
}

async function checkDataForSEO() {
  const login = Deno.env.get('DATAFORSEO_LOGIN');
  const password = Deno.env.get('DATAFORSEO_PASSWORD');
  
  if (!login || !password) {
    return { status: 'down' as const, error: 'Credentials missing' };
  }

  try {
    const start = Date.now();
    const response = await fetch('https://api.dataforseo.com/v3/user/money_balance', {
      headers: { 'Authorization': `Basic ${btoa(`${login}:${password}`)}` },
      signal: AbortSignal.timeout(5000)
    });
    const response_time = Date.now() - start;
    
    return {
      status: response.ok ? 'healthy' as const : 'down' as const,
      response_time,
      error: response.ok ? undefined : `HTTP ${response.status}`
    };
  } catch (error) {
    return { status: 'down' as const, error: String(error) };
  }
}

async function checkPageSpeed() {
  const apiKey = Deno.env.get('PAGESPEED_API_KEY');
  if (!apiKey) return { status: 'down' as const, error: 'CRITICAL API key missing - required for Core Web Vitals' };

  try {
    const start = Date.now();
    const response = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://google.com&strategy=DESKTOP&key=${apiKey}`, {
      signal: AbortSignal.timeout(5000)
    });
    const response_time = Date.now() - start;
    
    return {
      status: response.ok ? 'healthy' as const : 'down' as const,
      response_time,
      error: response.ok ? undefined : `HTTP ${response.status}`
    };
  } catch (error) {
    return { status: 'down' as const, error: String(error) };
  }
}

async function checkFirecrawl() {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) return { status: 'down' as const, error: 'CRITICAL API key missing - required for competitive analysis' };

  try {
    const start = Date.now();
    const response = await fetch('https://api.firecrawl.dev/v2/status', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000)
    });
    const response_time = Date.now() - start;
    
    return {
      status: response.ok ? 'healthy' as const : 'down' as const,
      response_time,
      error: response.ok ? undefined : `HTTP ${response.status}`
    };
  } catch (error) {
    return { status: 'down' as const, error: String(error) };
  }
}

async function checkAnthropic() {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return { status: 'down' as const, error: 'API key missing' };

  try {
    const start = Date.now();
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Hi' }]
      }),
      signal: AbortSignal.timeout(5000)
    });
    const response_time = Date.now() - start;
    
    return {
      status: response.ok ? 'healthy' as const : 'degraded' as const,
      response_time,
      error: response.ok ? undefined : `HTTP ${response.status}`
    };
  } catch (error) {
    return { status: 'down' as const, error: String(error) };
  }
}

async function checkPerplexity() {
  const apiKey = Deno.env.get('PERPLEXITY_API_KEY');
  if (!apiKey) return { status: 'down' as const, error: 'CRITICAL API key missing - required for real-time intelligence' };

  try {
    const start = Date.now();
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 5
      }),
      signal: AbortSignal.timeout(5000)
    });
    const response_time = Date.now() - start;
    
    return {
      status: response.ok ? 'healthy' as const : 'down' as const,
      response_time,
      error: response.ok ? undefined : `HTTP ${response.status}`
    };
  } catch (error) {
    return { status: 'down' as const, error: String(error) };
  }
}

async function checkCustomSearch() {
  const apiKey = Deno.env.get('CUSTOM_SEARCH_KEY');
  const cseId = Deno.env.get('CUSTOM_SEARCH_CSE_ID');
  
  if (!apiKey || !cseId) return { status: 'down' as const, error: 'CRITICAL credentials missing - required for content discovery' };

  try {
    const start = Date.now();
    const response = await fetch(`https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=test&num=1`, {
      signal: AbortSignal.timeout(5000)
    });
    const response_time = Date.now() - start;
    
    return {
      status: response.ok ? 'healthy' as const : 'down' as const,
      response_time,
      error: response.ok ? undefined : `HTTP ${response.status}`
    };
  } catch (error) {
    return { status: 'down' as const, error: String(error) };
  }
}

async function checkVoilaNorbert() {
  const apiKey = Deno.env.get('VOILANORBERT_API_KEY');
  if (!apiKey) return { status: 'down' as const, error: 'CRITICAL API key missing - required for business intelligence' };

  try {
    const start = Date.now();
    const response = await fetch('https://app.voilanorbert.com/api/2014-06-15/account/', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000)
    });
    const response_time = Date.now() - start;
    
    return {
      status: response.ok ? 'healthy' as const : 'down' as const,
      response_time,
      error: response.ok ? undefined : `HTTP ${response.status}`
    };
  } catch (error) {
    return { status: 'down' as const, error: String(error) };
  }
}

function calculateSystemHealth(workflowStats: WorkflowStats, apiHealth: APIHealthStatus[], dbHealth: any) {
  let score = 100;
  
  // Deduct for low success rate
  if (workflowStats.success_rate < 90) score -= 20;
  if (workflowStats.success_rate < 70) score -= 30;
  
  // Deduct for failed APIs
  const failedAPIs = apiHealth.filter(api => api.status === 'down').length;
  score -= failedAPIs * 15;
  
  // Deduct for degraded APIs
  const degradedAPIs = apiHealth.filter(api => api.status === 'degraded').length;
  score -= degradedAPIs * 10;
  
  // Deduct for database issues
  if (dbHealth.overall_status !== 'healthy') score -= 25;
  
  // Deduct for running workflows stuck
  if (workflowStats.running_runs > 5) score -= 15;
  
  return Math.max(0, score);
}

function generateRecommendations(workflowStats: WorkflowStats, apiHealth: APIHealthStatus[], dbHealth: any) {
  const recommendations = [];
  
  if (workflowStats.success_rate < 90) {
    recommendations.push({
      priority: 'high',
      category: 'workflow',
      message: `Success rate is ${workflowStats.success_rate}%. Investigate recent failures.`
    });
  }
  
  if (workflowStats.running_runs > 3) {
    recommendations.push({
      priority: 'medium',
      category: 'workflow',
      message: `${workflowStats.running_runs} workflows are currently running. Check for stuck processes.`
    });
  }
  
  const downAPIs = apiHealth.filter(api => api.status === 'down');
  if (downAPIs.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'api',
      message: `${downAPIs.map(api => api.service).join(', ')} API(s) are down. Check credentials and service status.`
    });
  }
  
  if (workflowStats.avg_duration_minutes > 30) {
    recommendations.push({
      priority: 'medium',
      category: 'performance',
      message: `Average workflow duration is ${workflowStats.avg_duration_minutes} minutes. Consider optimization.`
    });
  }
  
  if (dbHealth.overall_status !== 'healthy') {
    recommendations.push({
      priority: 'high',
      category: 'database',
      message: 'Database health issues detected. Check connection and table integrity.'
    });
  }

  return recommendations;
}

function generateHTMLReport(report: any): string {
  const healthColor = report.system_health >= 90 ? '#22c55e' : 
                     report.system_health >= 70 ? '#f59e0b' : '#ef4444';
  
  return `
<!DOCTYPE html>
<html>
<head>
    <title>BI Dashboard - Workflow Monitor</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; background: #f9fafb; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 24px; border-radius: 8px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .health-score { font-size: 48px; font-weight: bold; color: ${healthColor}; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .stat { margin: 8px 0; }
        .stat-label { color: #6b7280; font-size: 14px; }
        .stat-value { font-size: 24px; font-weight: 600; }
        .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
        .status-pass { background: #dcfce7; color: #166534; }
        .status-fail { background: #fef2f2; color: #991b1b; }
        .status-warning { background: #fef3c7; color: #92400e; }
        .status-healthy { background: #dcfce7; color: #166534; }
        .status-down { background: #fef2f2; color: #991b1b; }
        .status-degraded { background: #fef3c7; color: #92400e; }
        .recommendation { margin: 12px 0; padding: 12px; border-radius: 6px; }
        .rec-high { background: #fef2f2; border-left: 4px solid #ef4444; }
        .rec-medium { background: #fef3c7; border-left: 4px solid #f59e0b; }
        .rec-low { background: #f0f9ff; border-left: 4px solid #3b82f6; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>BI Dashboard - Workflow Monitor</h1>
            <p>Generated at ${new Date(report.timestamp).toLocaleString()}</p>
            <div class="health-score">${report.system_health}%</div>
            <div>System Health Score</div>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>Workflow Statistics</h3>
                <div class="stat">
                    <div class="stat-label">Total Runs (7 days)</div>
                    <div class="stat-value">${report.workflow_stats.total_runs}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Success Rate</div>
                    <div class="stat-value">${report.workflow_stats.success_rate}%</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Average Duration</div>
                    <div class="stat-value">${report.workflow_stats.avg_duration_minutes} min</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Last 24 Hours</div>
                    <div class="stat-value">${report.workflow_stats.last_24h_runs}</div>
                </div>
            </div>
            
            <div class="card">
                <h3>API Health</h3>
                ${report.api_health.map((api: any) => `
                    <div style="margin: 8px 0; display: flex; justify-content: space-between; align-items: center;">
                        <span>${api.service}</span>
                        <span class="status status-${api.status}">${api.status}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="card">
                <h3>Database Health</h3>
                <div class="stat">
                    <div class="stat-label">Overall Status</div>
                    <div class="stat-value">
                        <span class="status status-${report.database_health.overall_status === 'healthy' ? 'pass' : 'fail'}">
                            ${report.database_health.overall_status}
                        </span>
                    </div>
                </div>
                ${report.database_health.checks.map((check: any) => `
                    <div style="margin: 4px 0;">
                        <span style="font-size: 14px;">${check.check}</span>
                        <span class="status status-${check.status}">${check.status}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        
        ${report.recommendations.length > 0 ? `
        <div class="card" style="margin-top: 24px;">
            <h3>Recommendations</h3>
            ${report.recommendations.map((rec: any) => `
                <div class="recommendation rec-${rec.priority}">
                    <strong>${rec.category.toUpperCase()}</strong>: ${rec.message}
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        <div class="card" style="margin-top: 24px;">
            <h3>Recent Workflow Runs</h3>
            <table>
                <thead>
                    <tr>
                        <th>Website</th>
                        <th>Status</th>
                        <th>Duration</th>
                        <th>Started</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.recent_runs.slice(0, 10).map((run: any) => `
                        <tr>
                            <td>${run.website_url}</td>
                            <td><span class="status status-${run.status === 'completed' ? 'pass' : run.status === 'failed' ? 'fail' : 'warning'}">${run.status}</span></td>
                            <td>${run.duration_minutes ? run.duration_minutes + ' min' : '-'}</td>
                            <td>${new Date(run.created_at).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>`;
}
