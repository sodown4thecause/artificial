/**
 * Enhanced Workflow Orchestrator with Better Error Handling
 * 
 * Key Improvements:
 * 1. Comprehensive error logging to database
 * 2. Timeout protection
 * 3. Better error messages
 * 4. Try-catch blocks around each API call
 * 
 * To apply: Replace supabase/functions/lib/workflow-orchestrator.ts with this file
 */

import type { SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2.43.5';

import { fetchBacklinkMetrics } from './integrations/backlinks.ts';
import { fetchBusinessData } from './integrations/business-data.ts';
import { fetchContentAnalysis } from './integrations/content-analysis.ts';
import { 
  fetchKeywordMetrics, 
  fetchSerpResults, 
  fetchEnhancedSerpResults,
  buildSerpShareTimeline, 
  identifyCompetitors,
  analyzeCompetitorKeywords,
  fetchCompetitorBacklinks,
  buildCompetitorInsights
} from './integrations/dataforseo.ts';
import { fetchDomainAnalytics } from './integrations/domain-analytics.ts';
import { fetchFirecrawlInsights } from './integrations/firecrawl.ts';
import { fetchOnPageAudit } from './integrations/onpage.ts';
import { fetchPageSpeedMetrics, buildCoreWebVitals } from './integrations/pagespeed.ts';
import { fetchCustomSearchNews } from './integrations/search.ts';
import { enrichContacts } from './integrations/voilanorbert.ts';
import { generateInsights } from './integrations/llm.ts';
import type {
  KeywordMetric,
  OnboardingPayload,
  WorkflowContext,
  WorkflowTriggerResult
} from './types.ts';

export async function triggerWorkflow(
  supabase: SupabaseClient,
  user: User,
  payload: OnboardingPayload,
  ipAddress?: string
): Promise<WorkflowTriggerResult> {
  // Check daily rate limit before proceeding
  console.log('🚫 Checking daily rate limit...');
  console.log('User ID:', user.id, 'Type:', typeof user.id);
  console.log('IP Address:', ipAddress);
  
  const { data: rateLimitResult, error: rateLimitError } = await supabase
    .rpc('check_and_increment_daily_limit', {
      p_user_id: user.id,
      p_ip_address: ipAddress || 'unknown',
      p_daily_limit: 10
    });

  console.log('Rate limit RPC result:', rateLimitResult);
  console.log('Rate limit RPC error:', rateLimitError);

  if (rateLimitError) {
    console.error('Rate limit check failed:', rateLimitError);
    console.error('Error code:', rateLimitError.code);
    console.error('Error message:', rateLimitError.message);
    console.error('Error details:', rateLimitError.details);
    console.error('Error hint:', rateLimitError.hint);
    throw new Error(`Unable to verify daily usage limits. Please try again. Error: ${rateLimitError.message} (${rateLimitError.code})`);
  }

  if (!rateLimitResult.allowed) {
    console.log(`⚠️ Rate limit exceeded for user ${user.id}: ${rateLimitResult.current_count}/${rateLimitResult.daily_limit}`);
    throw new Error(rateLimitResult.message || 'Daily report generation limit reached. Please try again tomorrow.');
  }

  console.log(`✅ Rate limit check passed: ${rateLimitResult.current_count}/${rateLimitResult.daily_limit} reports used today`);

  const { data: onboardingRecord, error: onboardingError } = await supabase
    .from('onboarding_profiles')
    .upsert(
      {
        user_id: user.id,
        full_name: payload.fullName,
        website_url: payload.websiteUrl,
        industry: payload.industry,
        location: payload.location
      },
      { onConflict: 'user_id' }
    )
    .select('id')
    .single();

  if (onboardingError) {
    throw onboardingError;
  }

  const { data: workflowRecord, error: workflowError } = await supabase
    .from('workflow_runs')
    .insert({
      user_id: user.id,
      website_url: payload.websiteUrl,
      status: 'queued'
    })
    .select('id')
    .single();

  if (workflowError) {
    throw workflowError;
  }

  const context: WorkflowContext = {
    workflowId: workflowRecord.id,
    userId: user.id,
    websiteUrl: payload.websiteUrl,
    industry: payload.industry,
    location: payload.location,
    fullName: payload.fullName
  };

  // IMPROVED: Better error handling in microtask
  queueMicrotask(() => runWorkflow(supabase, context).catch(async (err) => {
    console.error('=== WORKFLOW EXECUTION FAILED ===');
    console.error('Error:', err);
    console.error('Stack:', err.stack);
    console.error('Workflow ID:', context.workflowId);
    console.error('User ID:', context.userId);
    console.error('Website:', context.websiteUrl);
    
    // Persist error to database
    try {
      await supabase
        .from('workflow_runs')
        .update({ 
          status: 'failed', 
          metadata: { 
            error: err.message,
            error_stack: err.stack,
            error_name: err.name,
            failed_at: new Date().toISOString(),
            context: {
              websiteUrl: context.websiteUrl,
              industry: context.industry,
              location: context.location
            }
          } 
        })
        .eq('id', context.workflowId);
    } catch (updateError) {
      console.error('Failed to update workflow status:', updateError);
    }
  }));

  return { workflowId: workflowRecord.id, status: 'queued' };
}

// IMPROVED: Separate function for workflow steps with timeout protection
async function runWorkflow(supabase: SupabaseClient, context: WorkflowContext) {
  const WORKFLOW_TIMEOUT = 120000; // 2 minutes
  
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Workflow timeout exceeded (120 seconds)')), WORKFLOW_TIMEOUT);
  });
  
  try {
    await Promise.race([
      executeWorkflowSteps(supabase, context),
      timeoutPromise
    ]);
  } catch (error) {
    console.error('Workflow execution error', error);
    await supabase
      .from('workflow_runs')
      .update({ 
        status: 'failed', 
        metadata: { 
          error: String(error),
          error_message: error instanceof Error ? error.message : 'Unknown error',
          is_timeout: error instanceof Error && error.message?.includes('timeout'),
          failed_at: new Date().toISOString()
        } 
      })
      .eq('id', context.workflowId);
    throw error;
  }
}

// IMPROVED: Wrapped each API call in try-catch with detailed error messages
async function executeWorkflowSteps(supabase: SupabaseClient, context: WorkflowContext) {
  await supabase
    .from('workflow_runs')
    .update({ status: 'running', metadata: { started_at: new Date().toISOString() } })
    .eq('id', context.workflowId);

  let competitors: string[] = [];
  let serpResults: any[] = [];
  let competitorKeywordAnalysis: any = null;
  let competitorBacklinks: any = null;
  let keywordMetrics: KeywordMetric[] = [];
  let contentSentiment: any[] = [];
  let firecrawlInsights: any = null;
  let domainAnalytics: any = null;
  let backlinkMetrics: any[] = [];
  let onpageAudit: any = null;
  let pagespeed: any = null;
  let coreWebVitals: any[] = [];
  let businessData: any[] = [];
  let newsroomResults: any = null;
  let enrichedContacts: any = null;
  let serpTimeline: any[] = [];
  let competitiveInsights: any = null;

  try {
    // Step 1: Identify competitors through SERP analysis
    console.log('🔍 Step 1: Identifying competitors...');
    try {
      competitors = await identifyCompetitors(context);
      console.log(`✅ Found ${competitors.length} competitors: ${competitors.join(', ')}`);
    } catch (error) {
      console.error('❌ Failed to identify competitors:', error);
      // Continue with empty competitors array
      competitors = [];
    }

    // Step 2: Enhanced SERP analysis including competitors
    console.log('📊 Step 2: Analyzing SERP performance...');
    try {
      serpResults = await fetchEnhancedSerpResults(context, competitors);
      await persistSerpResults(supabase, context.workflowId, serpResults);
      console.log(`✅ Persisted ${serpResults.length} SERP results`);
    } catch (error) {
      console.error('❌ Failed SERP analysis:', error);
      serpResults = [];
    }

    // Step 3: Competitor keyword analysis
    console.log('🎯 Step 3: Analyzing competitor keywords...');
    try {
      competitorKeywordAnalysis = await analyzeCompetitorKeywords(competitors, context);
      console.log('✅ Competitor keyword analysis complete');
    } catch (error) {
      console.error('❌ Failed competitor keyword analysis:', error);
    }
    
    // Step 4: Basic keyword metrics
    console.log('📈 Step 4: Fetching keyword metrics...');
    try {
      keywordMetrics = await fetchKeywordMetrics(context);
      await persistKeywordMetrics(supabase, context.workflowId, keywordMetrics);
      console.log(`✅ Persisted ${keywordMetrics.length} keyword metrics`);
    } catch (error) {
      console.error('❌ Failed keyword metrics:', error);
      keywordMetrics = [];
    }

    // Step 5: Competitor backlink analysis
    console.log('🔗 Step 5: Analyzing competitor backlinks...');
    try {
      competitorBacklinks = await fetchCompetitorBacklinks(competitors);
      console.log('✅ Competitor backlink analysis complete');
    } catch (error) {
      console.error('❌ Failed competitor backlink analysis:', error);
    }

    // Step 6: Content sentiment analysis
    console.log('💭 Step 6: Analyzing content sentiment...');
    try {
      contentSentiment = await fetchContentAnalysis(context, serpResults);
      await supabase.from('content_sentiment').insert(
        contentSentiment.map((item: any) => ({
          workflow_id: context.workflowId,
          source: item?.result?.url ?? context.websiteUrl,
          sentiment: item?.result ?? item
        }))
      );
      console.log(`✅ Persisted ${contentSentiment.length} sentiment analyses`);
    } catch (error) {
      console.error('❌ Failed content sentiment analysis:', error);
      contentSentiment = [];
    }

    // Step 7: Firecrawl insights
    console.log('🔥 Step 7: Fetching Firecrawl insights...');
    try {
      firecrawlInsights = await fetchFirecrawlInsights(context, serpResults);
      console.log('✅ Firecrawl insights complete');
    } catch (error) {
      console.error('❌ Failed Firecrawl insights:', error);
    }

    // Step 8: Domain analytics
    console.log('🌐 Step 8: Fetching domain analytics...');
    try {
      domainAnalytics = await fetchDomainAnalytics(context, serpResults);
      console.log('✅ Domain analytics complete');
    } catch (error) {
      console.error('❌ Failed domain analytics:', error);
    }

    // Step 9: Backlink metrics
    console.log('🔗 Step 9: Fetching backlink metrics...');
    try {
      backlinkMetrics = await fetchBacklinkMetrics(context);
      await persistBacklinks(supabase, context.workflowId, backlinkMetrics);
      console.log(`✅ Persisted ${backlinkMetrics.length} backlinks`);
    } catch (error) {
      console.error('❌ Failed backlink metrics:', error);
      backlinkMetrics = [];
    }

    // Step 10: On-page audit
    console.log('🔍 Step 10: Running on-page audit...');
    try {
      onpageAudit = await fetchOnPageAudit(context);
      await supabase.from('technical_audits').insert({
        workflow_id: context.workflowId,
        audit_type: 'onpage',
        payload: onpageAudit
      });
      console.log('✅ On-page audit complete');
    } catch (error) {
      console.error('❌ Failed on-page audit:', error);
    }

    // Step 11: PageSpeed metrics & Core Web Vitals
    console.log('⚡ Step 11: Fetching PageSpeed metrics...');
    try {
      pagespeed = await fetchPageSpeedMetrics(context);
      coreWebVitals = buildCoreWebVitals(pagespeed);
      await supabase.from('technical_audits').insert(
        (pagespeed ?? []).map((entry: any) => ({
          workflow_id: context.workflowId,
          audit_type: `pagespeed_${entry.strategy.toLowerCase()}`,
          payload: entry.payload
        }))
      );
      console.log('✅ PageSpeed metrics complete');
    } catch (error) {
      console.error('❌ Failed PageSpeed metrics:', error);
      coreWebVitals = [
        { metric: 'LCP', desktop: 0, mobile: 0 },
        { metric: 'FID', desktop: 0, mobile: 0 },
        { metric: 'CLS', desktop: 0, mobile: 0 }
      ];
    }

    // Step 12: Business data
    console.log('🏢 Step 12: Fetching business data...');
    try {
      businessData = await fetchBusinessData(context, domainAnalytics);
      await supabase.from('business_profiles').insert(
        businessData.map((entry: any) => ({
          workflow_id: context.workflowId,
          domain: entry?.result?.target ?? entry?.target ?? context.websiteUrl,
          firmographics: entry
        }))
      );
      console.log(`✅ Persisted ${businessData.length} business profiles`);
    } catch (error) {
      console.error('❌ Failed business data:', error);
      businessData = [];
    }

    // Step 13: News and mentions
    console.log('📰 Step 13: Fetching news and mentions...');
    try {
      newsroomResults = await fetchCustomSearchNews(context);
      console.log('✅ News and mentions complete');
    } catch (error) {
      console.error('❌ Failed news and mentions:', error);
    }

    // Step 14: Contact enrichment
    console.log('👤 Step 14: Enriching contacts...');
    try {
      enrichedContacts = await enrichContacts(context, newsroomResults);
      console.log('✅ Contact enrichment complete');
    } catch (error) {
      console.error('❌ Failed contact enrichment:', error);
    }

    // Step 15: Build SERP timeline & competitive insights
    console.log('📊 Step 15: Building timeline and competitive insights...');
    try {
      serpTimeline = buildSerpShareTimeline(serpResults);
      competitiveInsights = buildCompetitorInsights(serpResults, competitors);
      
      // Store competitive analysis data
      await supabase.from('business_profiles').insert({
        workflow_id: context.workflowId,
        domain: 'competitive_analysis',
        firmographics: {
          competitors,
          competitor_keywords: competitorKeywordAnalysis,
          competitor_backlinks: competitorBacklinks,
          competitive_insights: competitiveInsights
        }
      });
      console.log('✅ Competitive insights persisted');
    } catch (error) {
      console.error('❌ Failed competitive insights:', error);
      serpTimeline = [];
    }

    // Step 16: Generate AI insights
    console.log('🤖 Step 16: Generating AI insights...');
    const insights = await generateInsights({
      context,
      serpResults,
      keywordMetrics,
      contentSentiment,
      firecrawlInsights,
      domainAnalytics,
      backlinkMetrics,
      onpageAudit,
      pagespeed: coreWebVitals,
      businessData,
      newsroomResults,
      enrichedContacts,
      serpTimeline,
      competitors,
      competitorKeywordAnalysis,
      competitorBacklinks,
      competitiveInsights
    });

    await supabase.from('ai_insights').insert({
      workflow_id: context.workflowId,
      provider: insights.provider,
      summary: insights.summary
    });
    console.log('✅ AI insights persisted');

    // Step 17: Save final report
    console.log('💾 Step 17: Saving report...');
    await supabase.from('reports').insert({
      workflow_id: context.workflowId,
      payload: insights.reportPayload
    });
    console.log('✅ Report saved');

    // Mark workflow as completed
    await supabase
      .from('workflow_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        metadata: { completed_at: new Date().toISOString() }
      })
      .eq('id', context.workflowId);
      
    console.log('✅ Workflow completed successfully');
  } catch (error) {
    console.error('Workflow execution error', error);
    throw error; // Re-throw to be caught by runWorkflow
  }
}

async function persistSerpResults(
  supabase: SupabaseClient,
  workflowId: string,
  serpResults: { search_engine: string; keyword: string; position: number; url: string; delta?: number }[]
) {
  if (!serpResults.length) return;

  await supabase.from('serp_results').insert(
    serpResults.map((result) => ({
      workflow_id: workflowId,
      ...result
    }))
  );
}

async function persistKeywordMetrics(
  supabase: SupabaseClient,
  workflowId: string,
  keywordMetrics: KeywordMetric[]
) {
  if (!keywordMetrics.length) return;

  await supabase.from('keyword_metrics').insert(
    keywordMetrics.map((metric) => ({
      workflow_id: workflowId,
      keyword: metric.keyword,
      volume: metric.volume,
      cpc: metric.cpc,
      difficulty: metric.difficulty,
      ctr_potential: metric.ctrPotential
    }))
  );
}

async function persistBacklinks(
  supabase: SupabaseClient,
  workflowId: string,
  backlinks: { source: string; authority: number; anchorText: string }[]
) {
  if (!backlinks.length) return;

  await supabase.from('backlink_metrics').insert(
    backlinks.map((backlink) => ({
      workflow_id: workflowId,
      source_domain: backlink.source,
      authority: backlink.authority,
      anchor_text: backlink.anchorText
    }))
  );
}
