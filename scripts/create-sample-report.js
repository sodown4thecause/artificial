#!/usr/bin/env node

/**
 * Create Sample Report
 * 
 * This script creates sample report data to test the dashboard visualization
 * without needing to run a full workflow with external APIs.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL and SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Sample data for testing
function generateSampleReport() {
  const workflowId = `sample-workflow-${Date.now()}`;
  // Use a real UUID for the user ID
  const userId = '00000000-0000-0000-0000-000000000001';
  const capturedAt = new Date().toISOString();

  return {
    workflowId,
    userId,
    capturedAt,
    
    // Main report summary
    reportSummary: {
      id: `report-${workflowId}`,
      workflow_id: workflowId,
      user_id: userId,
      captured_at: capturedAt,
      executive_summary: "This is a sample intelligence report demonstrating comprehensive SEO and competitive analysis capabilities. The analysis reveals strong performance opportunities in organic search visibility with specific recommendations for keyword optimization and technical improvements.",
      recommendations: [
        {
          title: "Target High-Volume Keywords",
          description: "Focus on 'digital marketing' and related terms showing 45K monthly searches with medium difficulty",
          confidence: 0.85
        },
        {
          title: "Improve Core Web Vitals",
          description: "Optimize Largest Contentful Paint (LCP) which is currently at 3.2s on mobile devices",
          confidence: 0.92
        },
        {
          title: "Content Strategy Enhancement", 
          description: "Develop comprehensive content around identified keyword opportunities to capture additional market share",
          confidence: 0.78
        }
      ]
    },

    // SERP Timeline Data
    serpTimeline: [
      { captured_at: new Date(Date.now() - 30*24*60*60*1000).toISOString(), share_of_voice: 12.5 },
      { captured_at: new Date(Date.now() - 25*24*60*60*1000).toISOString(), share_of_voice: 14.2 },
      { captured_at: new Date(Date.now() - 20*24*60*60*1000).toISOString(), share_of_voice: 13.8 },
      { captured_at: new Date(Date.now() - 15*24*60*60*1000).toISOString(), share_of_voice: 16.3 },
      { captured_at: new Date(Date.now() - 10*24*60*60*1000).toISOString(), share_of_voice: 18.7 },
      { captured_at: new Date(Date.now() - 5*24*60*60*1000).toISOString(), share_of_voice: 19.4 },
      { captured_at: capturedAt, share_of_voice: 21.2 }
    ],

    // Keyword Opportunities
    keywordOpportunities: [
      { keyword: 'digital marketing', volume: 45000, difficulty: 65, ctrPotential: 0.12 },
      { keyword: 'seo optimization', volume: 28000, difficulty: 58, ctrPotential: 0.15 },
      { keyword: 'content strategy', volume: 18500, difficulty: 42, ctrPotential: 0.18 },
      { keyword: 'social media marketing', volume: 52000, difficulty: 72, ctrPotential: 0.09 },
      { keyword: 'email marketing', volume: 33000, difficulty: 48, ctrPotential: 0.14 },
      { keyword: 'ppc advertising', volume: 22000, difficulty: 67, ctrPotential: 0.11 },
    ],

    // Sentiment Metrics
    sentimentMetrics: [
      { label: 'Brand Awareness', score: 78 },
      { label: 'Customer Satisfaction', score: 82 },
      { label: 'Market Sentiment', score: 65 },
      { label: 'Competitive Position', score: 71 },
      { label: 'Content Quality', score: 86 }
    ],

    // Backlink Metrics
    backlinkMetrics: [
      { source: 'industry-blog.com', authority: 75, anchorText: 'comprehensive guide' },
      { source: 'tech-news.com', authority: 68, anchorText: 'expert analysis' },
      { source: 'marketing-weekly.com', authority: 82, anchorText: 'digital strategy' },
      { source: 'business-insights.com', authority: 59, anchorText: 'market research' },
      { source: 'startup-resources.com', authority: 71, anchorText: 'growth tactics' }
    ],

    // Core Web Vitals
    coreWebVitals: [
      { metric: 'LCP', desktop: 2.1, mobile: 3.2 },
      { metric: 'CLS', desktop: 0.05, mobile: 0.12 },
      { metric: 'FID', desktop: 45, mobile: 89 },
      { metric: 'FCP', desktop: 1.8, mobile: 2.4 }
    ],

    // Tech Stack Analysis
    techStack: [
      { competitor: 'competitor-a.com', categories: ['React', 'AWS', 'Cloudflare', 'Google Analytics'] },
      { competitor: 'competitor-b.com', categories: ['WordPress', 'WooCommerce', 'Google Tag Manager'] },
      { competitor: 'competitor-c.com', categories: ['Next.js', 'Vercel', 'Stripe', 'HubSpot'] },
      { competitor: 'competitor-d.com', categories: ['Vue.js', 'Firebase', 'Mailchimp'] }
    ]
  };
}

async function createSampleReport() {
  console.log('🎯 Creating sample report data for dashboard testing...\n');
  
  try {
    const sampleData = generateSampleReport();
    
    // Note: We'll create the workflow without user validation for testing
    console.log('📊 Creating sample data for testing dashboard display...');
    
    // First create a workflow run
    console.log('📝 Creating workflow run...');
    const { data: workflowRun, error: workflowError } = await supabase
      .from('workflow_runs')
      .insert({
        id: sampleData.workflowId,
        user_id: sampleData.userId,
        website_url: 'https://sample-domain.com',
        status: 'completed',
        metadata: { sample: true },
        triggered_at: sampleData.capturedAt,
        completed_at: sampleData.capturedAt
      })
      .select()
      .single();
    
    if (workflowError) {
      console.error('❌ Failed to create workflow run:', workflowError);
      return;
    }
    
    console.log('✅ Workflow run created');

    // Create the complete report payload
    const reportPayload = {
      summary: {
        id: sampleData.reportSummary.id,
        captured_at: sampleData.capturedAt,
        executive_summary: sampleData.reportSummary.executive_summary,
        recommendations: sampleData.reportSummary.recommendations
      },
      serpTimeline: sampleData.serpTimeline,
      keywordOpportunities: sampleData.keywordOpportunities,
      sentiment: sampleData.sentimentMetrics,
      backlinks: sampleData.backlinkMetrics,
      coreWebVitals: sampleData.coreWebVitals,
      techStack: sampleData.techStack
    };

    // Insert the main report
    console.log('📝 Creating report summary...');
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        id: sampleData.reportSummary.id,
        workflow_id: sampleData.workflowId,
        payload: reportPayload,
        captured_at: sampleData.capturedAt
      })
      .select()
      .single();
    
    if (reportError) {
      console.error('❌ Failed to create report:', reportError);
      return;
    }
    
    console.log('✅ Report with complete payload created!');

    console.log('\n🎉 SUCCESS! Sample report data created successfully!');
    console.log(`📊 Report ID: ${sampleData.reportSummary.id}`);
    console.log(`🔗 Workflow ID: ${sampleData.workflowId}`);
    console.log('\n📱 To view the report:');
    console.log('   1. Make sure the frontend is running: npm run dev');
    console.log('   2. Navigate to http://localhost:3000/dashboard');
    console.log('   3. The sample report should be displayed with all visualizations');
    console.log('\n💡 This sample data demonstrates:');
    console.log('   ✅ SERP share of voice trends over time');
    console.log('   ✅ Keyword opportunity scatter plot');
    console.log('   ✅ Brand sentiment radar chart');
    console.log('   ✅ Core Web Vitals performance metrics');
    console.log('   ✅ Backlink network visualization');
    console.log('   ✅ Competitor tech stack analysis');

  } catch (error) {
    console.error('❌ Failed to create sample report:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  createSampleReport().catch(console.error);
}

module.exports = { createSampleReport };