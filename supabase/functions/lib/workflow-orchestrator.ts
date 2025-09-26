import type { SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2.43.5';

import { fetchBacklinkMetrics } from './integrations/backlinks.ts';
import { fetchBusinessData } from './integrations/business-data.ts';
import { fetchContentAnalysis } from './integrations/content-analysis.ts';
import { fetchKeywordMetrics, fetchSerpResults, buildSerpShareTimeline } from './integrations/dataforseo.ts';
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
  payload: OnboardingPayload
): Promise<WorkflowTriggerResult> {
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

  queueMicrotask(() => runWorkflow(supabase, context).catch((err) => {
    console.error('Workflow failure', err);
  }));

  return { workflowId: workflowRecord.id, status: 'queued' };
}

async function runWorkflow(supabase: SupabaseClient, context: WorkflowContext) {
  await supabase
    .from('workflow_runs')
    .update({ status: 'running', metadata: { started_at: new Date().toISOString() } })
    .eq('id', context.workflowId);

  try {
    const serpResults = await fetchSerpResults(context);
    await persistSerpResults(supabase, context.workflowId, serpResults);

    const keywordMetrics = await fetchKeywordMetrics(context);
    await persistKeywordMetrics(supabase, context.workflowId, keywordMetrics);

    const contentSentiment = await fetchContentAnalysis(context, serpResults);
    await supabase.from('content_sentiment').insert(
      contentSentiment.map((item: any) => ({
        workflow_id: context.workflowId,
        source: item?.result?.url ?? context.websiteUrl,
        sentiment: item?.result ?? item
      }))
    );

    const firecrawlInsights = await fetchFirecrawlInsights(context, serpResults);
    const domainAnalytics = await fetchDomainAnalytics(context, serpResults);
    const backlinkMetrics = await fetchBacklinkMetrics(context);
    await persistBacklinks(supabase, context.workflowId, backlinkMetrics);

    const onpageAudit = await fetchOnPageAudit(context);
    await supabase.from('technical_audits').insert({
      workflow_id: context.workflowId,
      audit_type: 'onpage',
      payload: onpageAudit
    });

    const pagespeed = await fetchPageSpeedMetrics(context);
    const coreWebVitals = buildCoreWebVitals(pagespeed);
    await supabase.from('technical_audits').insert(
      (pagespeed ?? []).map((entry: any) => ({
        workflow_id: context.workflowId,
        audit_type: `pagespeed_${entry.strategy.toLowerCase()}`,
        payload: entry.payload
      }))
    );

    const businessData = await fetchBusinessData(context, domainAnalytics);
    await supabase.from('business_profiles').insert(
      businessData.map((entry: any) => ({
        workflow_id: context.workflowId,
        domain: entry?.result?.target ?? entry?.target ?? context.websiteUrl,
        firmographics: entry
      }))
    );

    const newsroomResults = await fetchCustomSearchNews(context);
    const enrichedContacts = await enrichContacts(context, newsroomResults);

    const serpTimeline = buildSerpShareTimeline(serpResults);

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
      serpTimeline
    });

    await supabase.from('ai_insights').insert({
      workflow_id: context.workflowId,
      provider: insights.provider,
      summary: insights.summary
    });

    await supabase.from('reports').insert({
      workflow_id: context.workflowId,
      payload: insights.reportPayload
    });

    await supabase
      .from('workflow_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        metadata: { completed_at: new Date().toISOString() }
      })
      .eq('id', context.workflowId);
  } catch (error) {
    console.error('Workflow execution error', error);
    await supabase
      .from('workflow_runs')
      .update({ status: 'failed', metadata: { error: String(error) } })
      .eq('id', context.workflowId);
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

