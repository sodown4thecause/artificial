#!/usr/bin/env node

/**
 * Workflow Testing Script
 * 
 * This script helps you test your BI Dashboard workflow system.
 * Usage: node scripts/test-workflow.js [options]
 */

// Load environment variables from .env file
require('dotenv').config();

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL and SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const BASE_URL = `${SUPABASE_URL}/functions/v1`;

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  integrations: !args.includes('--skip-integrations'),
  endpoints: !args.includes('--skip-endpoints'),
  monitor: args.includes('--monitor'),
  format: args.includes('--html') ? 'html' : 'json',
  help: args.includes('--help') || args.includes('-h')
};

if (options.help) {
  console.log(`
BI Dashboard Workflow Testing Script

Usage: node scripts/test-workflow.js [options]

Options:
  --skip-integrations    Skip testing external API integrations
  --skip-endpoints      Skip testing workflow endpoints
  --monitor             Generate monitoring report instead of tests
  --html                Output HTML format (for monitor only)
  --help, -h            Show this help message

Examples:
  node scripts/test-workflow.js                    # Run all tests
  node scripts/test-workflow.js --skip-integrations # Test only endpoints
  node scripts/test-workflow.js --monitor          # Generate monitoring report
  node scripts/test-workflow.js --monitor --html   # Generate HTML monitoring report
`);
  process.exit(0);
}

async function makeRequest(endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    const options = {
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      }
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          if (res.headers['content-type']?.includes('application/json')) {
            resolve({
              status: res.statusCode,
              data: JSON.parse(body),
              headers: res.headers
            });
          } else {
            resolve({
              status: res.statusCode,
              data: body,
              headers: res.headers
            });
          }
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: body,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting BI Dashboard Workflow Tests\n');
  
  try {
    const response = await makeRequest('/test-workflow', {
      testType: 'full',
      includeIntegrations: options.integrations,
      includeEndpoints: options.endpoints
    });

    if (response.status !== 200) {
      console.error(`❌ Test failed with status ${response.status}`);
      console.error(response.data);
      process.exit(1);
    }

    const results = response.data;
    
    // Print summary
    console.log(`📊 Test Summary (${results.timestamp})`);
    console.log(`   Overall Status: ${results.overallStatus === 'healthy' ? '✅ Healthy' : '⚠️ Issues Detected'}`);
    console.log(`   Total Tests: ${results.summary.total}`);
    console.log(`   Passed: ${results.summary.passed}`);
    console.log(`   Failed: ${results.summary.failed}`);
    console.log(`   Warnings: ${results.summary.warnings}\n`);

    // Print individual results
    console.log('📋 Detailed Results:');
    results.results.forEach(result => {
      const statusIcon = result.status === 'pass' ? '✅' : 
                        result.status === 'fail' ? '❌' : '⚠️';
      const timing = result.responseTime ? ` (${result.responseTime}ms)` : '';
      
      console.log(`   ${statusIcon} ${result.service}: ${result.message}${timing}`);
      
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    });

    // Save detailed results to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `test-results-${timestamp}.json`;
    const filepath = path.join(process.cwd(), 'logs', filename);
    
    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Detailed results saved to: ${filepath}`);

    // Exit with appropriate code
    process.exit(results.summary.failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

async function runMonitoring() {
  console.log('📊 Generating Workflow Monitoring Report\n');
  
  try {
    const queryParams = options.format === 'html' ? '?format=html' : '';
    const response = await makeRequest(`/monitor-workflow${queryParams}`);

    if (response.status !== 200) {
      console.error(`❌ Monitoring failed with status ${response.status}`);
      console.error(response.data);
      process.exit(1);
    }

    if (options.format === 'html') {
      // Save HTML report
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `monitor-report-${timestamp}.html`;
      const filepath = path.join(process.cwd(), 'logs', filename);
      
      const logsDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      
      fs.writeFileSync(filepath, response.data);
      console.log(`📊 HTML monitoring report saved to: ${filepath}`);
      console.log(`   Open in browser: file://${filepath}`);
    } else {
      const report = response.data;
      
      // Print monitoring summary
      console.log(`📊 System Health Score: ${report.system_health}%`);
      console.log(`📅 Report Time: ${new Date(report.timestamp).toLocaleString()}\n`);
      
      console.log('🔄 Workflow Statistics:');
      console.log(`   Total Runs (7 days): ${report.workflow_stats.total_runs}`);
      console.log(`   Success Rate: ${report.workflow_stats.success_rate}%`);
      console.log(`   Average Duration: ${report.workflow_stats.avg_duration_minutes} minutes`);
      console.log(`   Last 24 Hours: ${report.workflow_stats.last_24h_runs} runs`);
      
      if (report.workflow_stats.last_failure) {
        console.log(`   Last Failure: ${new Date(report.workflow_stats.last_failure.created_at).toLocaleString()}`);
        console.log(`   Error: ${report.workflow_stats.last_failure.error}`);
      }
      
      console.log('\n🔗 API Health:');
      report.api_health.forEach(api => {
        const statusIcon = api.status === 'healthy' ? '✅' : 
                          api.status === 'degraded' ? '⚠️' : '❌';
        const timing = api.response_time_ms ? ` (${api.response_time_ms}ms)` : '';
        console.log(`   ${statusIcon} ${api.service}: ${api.status}${timing}`);
        if (api.error_message) {
          console.log(`      Error: ${api.error_message}`);
        }
      });
      
      console.log('\n💾 Database Health:');
      console.log(`   Overall: ${report.database_health.overall_status === 'healthy' ? '✅' : '❌'} ${report.database_health.overall_status}`);
      
      if (report.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        report.recommendations.forEach(rec => {
          const priority = rec.priority === 'high' ? '🔴' : 
                          rec.priority === 'medium' ? '🟡' : '🔵';
          console.log(`   ${priority} ${rec.category.toUpperCase()}: ${rec.message}`);
        });
      }
      
      // Save JSON report
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `monitor-report-${timestamp}.json`;
      const filepath = path.join(process.cwd(), 'logs', filename);
      
      const logsDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      
      fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
      console.log(`\n💾 Detailed report saved to: ${filepath}`);
    }

  } catch (error) {
    console.error('❌ Monitoring failed:', error.message);
    process.exit(1);
  }
}

// Main execution
if (options.monitor) {
  runMonitoring();
} else {
  runTests();
}
