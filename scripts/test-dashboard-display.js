#!/usr/bin/env node

/**
 * Test Dashboard Display
 * 
 * This script tests the dashboard display by creating a local server
 * that serves sample report data, allowing us to test the frontend
 * visualization without needing database setup.
 */

const http = require('http');
const path = require('path');
const fs = require('fs');

// Sample report data that matches the IntelligenceReportPayload interface
const sampleReportData = {
  summary: {
    id: `report-sample-${Date.now()}`,
    captured_at: new Date().toISOString(),
    executive_summary: "This is a comprehensive sample intelligence report demonstrating the dashboard's visualization capabilities. The analysis reveals strong performance opportunities in organic search visibility with specific recommendations for keyword optimization, technical improvements, and competitive positioning. Based on comprehensive data analysis, we've identified key growth opportunities that could increase organic traffic by 45% within the next quarter.",
    recommendations: [
      {
        title: "Target High-Volume Keywords",
        description: "Focus on 'digital marketing automation' and related terms showing 45K monthly searches with medium difficulty. These keywords present immediate opportunities for ranking improvements.",
        confidence: 0.85
      },
      {
        title: "Improve Core Web Vitals Performance",
        description: "Optimize Largest Contentful Paint (LCP) which is currently at 3.2s on mobile devices. This improvement could boost search rankings significantly.",
        confidence: 0.92
      },
      {
        title: "Content Strategy Enhancement", 
        description: "Develop comprehensive content around identified keyword opportunities to capture additional market share and establish thought leadership.",
        confidence: 0.78
      },
      {
        title: "Backlink Acquisition Strategy",
        description: "Target high-authority domains in the marketing and technology sectors to improve domain authority and search visibility.",
        confidence: 0.81
      }
    ]
  },

  // SERP Timeline Data (showing growth trend)
  serpTimeline: [
    { captured_at: new Date(Date.now() - 30*24*60*60*1000).toISOString(), share_of_voice: 12.5 },
    { captured_at: new Date(Date.now() - 25*24*60*60*1000).toISOString(), share_of_voice: 14.2 },
    { captured_at: new Date(Date.now() - 20*24*60*60*1000).toISOString(), share_of_voice: 13.8 },
    { captured_at: new Date(Date.now() - 15*24*60*60*1000).toISOString(), share_of_voice: 16.3 },
    { captured_at: new Date(Date.now() - 10*24*60*60*1000).toISOString(), share_of_voice: 18.7 },
    { captured_at: new Date(Date.now() - 5*24*60*60*1000).toISOString(), share_of_voice: 19.4 },
    { captured_at: new Date().toISOString(), share_of_voice: 21.2 }
  ],

  // Keyword Opportunities (scatter plot data)
  keywordOpportunities: [
    { keyword: 'digital marketing automation', volume: 45000, difficulty: 65, ctrPotential: 0.12 },
    { keyword: 'seo optimization tools', volume: 28000, difficulty: 58, ctrPotential: 0.15 },
    { keyword: 'content strategy framework', volume: 18500, difficulty: 42, ctrPotential: 0.18 },
    { keyword: 'social media marketing trends', volume: 52000, difficulty: 72, ctrPotential: 0.09 },
    { keyword: 'email marketing automation', volume: 33000, difficulty: 48, ctrPotential: 0.14 },
    { keyword: 'ppc advertising strategies', volume: 22000, difficulty: 67, ctrPotential: 0.11 },
    { keyword: 'marketing analytics dashboard', volume: 16500, difficulty: 38, ctrPotential: 0.16 },
    { keyword: 'customer acquisition cost', volume: 29000, difficulty: 55, ctrPotential: 0.13 },
    { keyword: 'conversion rate optimization', volume: 24000, difficulty: 61, ctrPotential: 0.12 },
    { keyword: 'marketing funnel optimization', volume: 19500, difficulty: 46, ctrPotential: 0.17 }
  ],

  // Sentiment Metrics (radar chart)
  sentiment: [
    { label: 'Brand Awareness', score: 78 },
    { label: 'Customer Satisfaction', score: 82 },
    { label: 'Market Sentiment', score: 65 },
    { label: 'Competitive Position', score: 71 },
    { label: 'Content Quality', score: 86 },
    { label: 'Social Media Presence', score: 73 },
    { label: 'Industry Authority', score: 69 }
  ],

  // Backlink Network Data
  backlinks: [
    { source: 'industry-insights.com', authority: 85, anchorText: 'comprehensive marketing guide' },
    { source: 'tech-innovators.com', authority: 78, anchorText: 'expert analysis and insights' },
    { source: 'marketing-weekly.com', authority: 82, anchorText: 'digital strategy framework' },
    { source: 'business-growth.com', authority: 71, anchorText: 'market research methodology' },
    { source: 'startup-resources.com', authority: 74, anchorText: 'growth hacking tactics' },
    { source: 'digital-trends.com', authority: 89, anchorText: 'innovative marketing solutions' },
    { source: 'saas-metrics.com', authority: 66, anchorText: 'customer acquisition strategies' }
  ],

  // Core Web Vitals Data
  coreWebVitals: [
    { metric: 'LCP (Largest Contentful Paint)', desktop: 2.1, mobile: 3.2 },
    { metric: 'CLS (Cumulative Layout Shift)', desktop: 0.05, mobile: 0.12 },
    { metric: 'FID (First Input Delay)', desktop: 45, mobile: 89 },
    { metric: 'FCP (First Contentful Paint)', desktop: 1.8, mobile: 2.4 },
    { metric: 'TTFB (Time to First Byte)', desktop: 0.8, mobile: 1.1 }
  ],

  // Competitor Tech Stack Analysis
  techStack: [
    { 
      competitor: 'competitor-a.com', 
      categories: ['React', 'Next.js', 'AWS', 'Cloudflare', 'Google Analytics', 'HubSpot'] 
    },
    { 
      competitor: 'competitor-b.com', 
      categories: ['WordPress', 'WooCommerce', 'Google Tag Manager', 'Mailchimp', 'Stripe'] 
    },
    { 
      competitor: 'competitor-c.com', 
      categories: ['Vue.js', 'Nuxt.js', 'Vercel', 'Stripe', 'Intercom', 'Mixpanel'] 
    },
    { 
      competitor: 'competitor-d.com', 
      categories: ['Angular', 'Firebase', 'Mailchimp', 'Shopify', 'Zendesk'] 
    },
    { 
      competitor: 'competitor-e.com', 
      categories: ['Svelte', 'SvelteKit', 'Netlify', 'ConvertKit', 'Fathom Analytics'] 
    }
  ]
};

// Simple HTTP server to serve the sample data
function createTestServer(port = 8080) {
  const server = http.createServer((req, res) => {
    // Enable CORS for frontend development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    if (req.url === '/functions/v1/reports/latest' && req.method === 'GET') {
      // Mock the reports API endpoint
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(sampleReportData));
    } else if (req.url === '/functions/v1/billing-status' && req.method === 'GET') {
      // Mock billing status for testing
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        subscribed: true,
        planId: 'test-plan',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
        stripeCustomerId: 'test-customer',
        stripeSubscriptionId: 'test-subscription'
      }));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });
  
  return server;
}

function startTestServer() {
  const port = 8080;
  const server = createTestServer(port);
  
  server.listen(port, () => {
    console.log('🚀 Test server started for dashboard testing');
    console.log(`📊 Mock API server running on http://localhost:${port}`);
    console.log('');
    console.log('📋 Available endpoints:');
    console.log(`   GET  http://localhost:${port}/functions/v1/reports/latest`);
    console.log(`   GET  http://localhost:${port}/functions/v1/billing-status`);
    console.log('');
    console.log('🎯 To test the dashboard:');
    console.log('   1. Update frontend to point to this mock server (or use proxy)');
    console.log('   2. Start frontend: cd frontend && npm run dev');
    console.log('   3. Navigate to http://localhost:3000/dashboard');
    console.log('');
    console.log('💡 Sample data includes:');
    console.log('   ✅ Executive summary with 4 recommendations');
    console.log('   ✅ SERP share of voice trend (7 data points)');
    console.log('   ✅ Keyword opportunities (10 keywords)');
    console.log('   ✅ Brand sentiment radar (7 metrics)');
    console.log('   ✅ Core Web Vitals performance (5 metrics)');
    console.log('   ✅ Backlink network (7 backlinks)');
    console.log('   ✅ Competitor tech stack (5 competitors)');
    console.log('');
    console.log('Press Ctrl+C to stop the server');
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down test server...');
    server.close(() => {
      console.log('✅ Server stopped');
      process.exit(0);
    });
  });
  
  return server;
}

// Save sample data to file for inspection
function saveSampleData() {
  const filePath = path.join(__dirname, '..', 'logs', 'sample-report-data.json');
  
  // Create logs directory if it doesn't exist
  const logsDir = path.dirname(filePath);
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, JSON.stringify(sampleReportData, null, 2));
  console.log(`💾 Sample data saved to: ${filePath}`);
}

if (require.main === module) {
  console.log('🎯 Starting Dashboard Display Test\n');
  
  // Save sample data for inspection
  saveSampleData();
  
  // Start the test server
  startTestServer();
}

module.exports = { sampleReportData, createTestServer };