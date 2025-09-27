import type {
  KeywordMetric,
  SerpResult,
  WorkflowContext,
  IntelligenceReportPayload,
  SerpTimelinePoint
} from '../types.ts';

interface GenerateInsightsInput {
  context: WorkflowContext;
  serpResults: SerpResult[];
  keywordMetrics: KeywordMetric[];
  contentSentiment: any;
  firecrawlInsights: any;
  domainAnalytics: any;
  backlinkMetrics: any;
  onpageAudit: any;
  pagespeed: any;
  businessData: any;
  newsroomResults: any;
  enrichedContacts: any;
  serpTimeline: SerpTimelinePoint[];
  // Enhanced competitive intelligence
  competitors?: string[];
  competitorKeywordAnalysis?: any[];
  competitorBacklinks?: any[];
  competitiveInsights?: any;
}

function buildCompetitiveIntelligenceSection(input: GenerateInsightsInput): string {
  if (!input.competitors || input.competitors.length === 0) {
    return '## Competitive Intelligence\n- No competitors identified - opportunity for market research';
  }

  let section = `## Competitive Intelligence\n### Identified Competitors (${input.competitors.length})\n`;
  section += input.competitors.slice(0, 5).map(comp => `- ${comp}`).join('\n');
  
  if (input.competitiveInsights?.top_competitors) {
    section += '\n\n### Market Leaders by SERP Performance\n';
    section += input.competitiveInsights.top_competitors.slice(0, 3).map(([domain, stats]: [string, any]) => 
      `- ${domain}: ${stats.appearances} SERP appearances, avg position ${stats.avg_position.toFixed(1)}`
    ).join('\n');
  }
  
  if (input.competitorKeywordAnalysis && input.competitorKeywordAnalysis.length > 0) {
    section += '\n\n### Competitor Keyword Strengths\n';
    section += input.competitorKeywordAnalysis.slice(0, 3).map(comp => 
      `- ${comp.domain}: ${comp.total_keywords} keywords tracked, top keywords include ${comp.keywords.slice(0, 3).map((k: any) => k.keyword).join(', ')}`
    ).join('\n');
  }
  
  if (input.competitorBacklinks && input.competitorBacklinks.length > 0) {
    section += '\n\n### Competitor Backlink Authority\n';
    section += input.competitorBacklinks.slice(0, 3).map(comp => 
      `- ${comp.domain}: ${comp.backlinks_count} backlinks from ${comp.referring_domains} domains (Domain Rank: ${comp.domain_rank})`
    ).join('\n');
  }
  
  return section;
}

export async function generateInsights(input: GenerateInsightsInput) {
  const structuredPayload = buildStructuredPayload(input);
  const perplexityInsights = await callPerplexityInsights(structuredPayload);
  const { reportPayload, summary } = await callPrimaryModel(structuredPayload, perplexityInsights, input);

  return {
    provider: 'claude',
    summary,
    reportPayload
  };
}

function buildStructuredPayload(input: GenerateInsightsInput): IntelligenceReportPayload {
  const now = new Date().toISOString();
  
  // Safely transform data with proper fallbacks
  const keywordOpportunities = Array.isArray(input.keywordMetrics) 
    ? input.keywordMetrics.map((metric) => ({
        keyword: metric.keyword || 'Unknown keyword',
        volume: Number(metric.volume) || 0,
        difficulty: Number(metric.difficulty) || 0,
        ctrPotential: Number(metric.ctrPotential) || 0
      }))
    : [];

  const sentiment = Array.isArray(input.contentSentiment)
    ? input.contentSentiment.map((item: any) => ({
        label: item?.categories?.[0]?.name || item?.source || item?.url || 'Content Analysis',
        score: Math.max(0, Math.min(100, Number(item?.sentiment?.score) || 50))
      }))
    : [];

  const backlinks = Array.isArray(input.backlinkMetrics)
    ? input.backlinkMetrics.map((item: any) => ({
        source: item?.source || item?.domain || 'Unknown source',
        authority: Math.max(0, Math.min(100, Number(item?.authority) || 0)),
        anchorText: item?.anchorText || item?.anchor_text || 'N/A'
      }))
    : [];

  const coreWebVitals = Array.isArray(input.pagespeed)
    ? input.pagespeed.map((item: any) => ({
        metric: item?.metric || 'Unknown metric',
        desktop: Number(item?.desktop) || 0,
        mobile: Number(item?.mobile) || 0
      }))
    : [];

  const techStack = Array.isArray(input.domainAnalytics)
    ? input.domainAnalytics.map((item: any) => ({
        competitor: item?.tasks?.[0]?.result?.[0]?.target || item?.domain || input.context.websiteUrl,
        categories: Array.isArray(item?.tasks?.[0]?.result?.[0]?.technologies)
          ? item.tasks[0].result[0].technologies.map((tech: any) => tech.name || tech).filter(Boolean)
          : []
      }))
    : [];

  const serpTimeline = Array.isArray(input.serpTimeline)
    ? input.serpTimeline.map((point) => ({
        captured_at: point.captured_at || now,
        share_of_voice: Number(point.share_of_voice) || 0,
        keyword: point.keyword || undefined
      }))
    : [];

  return {
    summary: {
      id: crypto.randomUUID(),
      captured_at: now,
      executive_summary: '',
      recommendations: []
    },
    serpTimeline,
    keywordOpportunities,
    sentiment,
    backlinks,
    coreWebVitals,
    techStack
  };
}

async function callPrimaryModel(payload: IntelligenceReportPayload, perplexityInsights: string, input: GenerateInsightsInput) {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error('Anthropic API key missing');
  }

  // Create a structured analysis prompt with better data handling
  const analysisPrompt = `Analyze this marketing intelligence data and provide actionable business insights:

## Website Overview
- Analysis Date: ${payload.summary.captured_at}
- Data Points Collected: ${payload.keywordOpportunities.length} keywords, ${payload.backlinks.length} backlinks, ${payload.coreWebVitals.length} performance metrics

## SERP Performance Analysis
${payload.serpTimeline.length > 0 
  ? payload.serpTimeline.map(point => 
      `- ${new Date(point.captured_at).toLocaleDateString()}: ${point.share_of_voice.toFixed(1)}% share of voice${point.keyword ? ` for "${point.keyword}"` : ''}`
    ).join('\n')
  : '- No SERP timeline data available - opportunity for baseline establishment'}

## Keyword Opportunity Analysis
${payload.keywordOpportunities.length > 0
  ? payload.keywordOpportunities.slice(0, 6).map(kw => 
      `- "${kw.keyword}": ${kw.volume.toLocaleString()} monthly searches, ${kw.difficulty}% difficulty, ${(kw.ctrPotential * 100).toFixed(1)}% CTR potential`
    ).join('\n')
  : '- No keyword opportunity data available - recommend keyword research audit'}

## Backlink Profile Insights  
${payload.backlinks.length > 0
  ? payload.backlinks.slice(0, 5).map(bl => 
      `- ${bl.source} (Domain Authority: ${bl.authority}/100) - Anchor: "${bl.anchorText}"`
    ).join('\n')
  : '- No backlink data available - opportunity for link building strategy'}

## Technical Performance Metrics
${payload.coreWebVitals.length > 0
  ? payload.coreWebVitals.map(cwv => 
      `- ${cwv.metric}: Desktop ${cwv.desktop}, Mobile ${cwv.mobile}`
    ).join('\n')
  : '- No technical performance data - recommend technical SEO audit'}

## Brand Sentiment Analysis
${payload.sentiment.length > 0
  ? payload.sentiment.slice(0, 4).map(s => 
      `- ${s.label}: ${s.score}/100 sentiment score`
    ).join('\n')
  : '- No sentiment data available - opportunity for brand monitoring'}

## Competitive Technology Stack
${payload.techStack.length > 0
  ? payload.techStack.slice(0, 3).map(tech => 
      `- ${tech.competitor}: ${tech.categories.length > 0 ? tech.categories.join(', ') : 'Technology stack not identified'}`
    ).join('\n')
  : '- No competitor tech data available - recommend competitive intelligence audit'}

${buildCompetitiveIntelligenceSection(input)}

${perplexityInsights ? `## Market Intelligence\n${perplexityInsights}` : ''}

Based on this comprehensive analysis, provide strategic insights in JSON format with:

1. **executive_summary**: A detailed 3-4 paragraph executive summary that:
   - Highlights the most significant findings and opportunities
   - Identifies the biggest growth potential areas
   - Provides strategic context for decision-making
   - Quantifies potential impact where possible

2. **recommendations**: Array of 4-6 prioritized, actionable recommendations with:
   - **title**: Clear, specific recommendation title
   - **description**: Detailed explanation with expected outcomes and implementation approach
   - **confidence**: Confidence level (0.75-1.0) based on data strength and impact potential

Prioritize recommendations that can drive measurable business results within 90 days.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: Deno.env.get('WORKFLOW_REPORT_LLM_MODEL') ?? 'claude-3-haiku-20240307',
      max_tokens: 2000,
      system: 'You are a senior marketing intelligence analyst. Analyze the provided data and respond with well-structured JSON containing executive_summary (string) and recommendations (array of objects with title, description, and confidence fields). Ensure your response is valid JSON.',
      messages: [
        {
          role: 'user',
          content: analysisPrompt
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic request failed ${response.status}`);
  }

  const data = await response.json();
  const contentBlock = Array.isArray(data?.content)
    ? data.content.find((block: any) => block.type === 'text')
    : null;
  const content = contentBlock?.text ?? '';

  let parsed: { executive_summary: string; recommendations: Array<{ title: string; description: string; confidence: number }> };
  try {
    parsed = JSON.parse(content);
  } catch (_error) {
    parsed = {
      executive_summary: content,
      recommendations: []
    };
  }

  const reportPayload: IntelligenceReportPayload = {
    ...payload,
    summary: {
      ...payload.summary,
      executive_summary: parsed.executive_summary,
      recommendations: parsed.recommendations ?? []
    }
  };

  return {
    summary: parsed.executive_summary,
    reportPayload
  };
}

async function callPerplexityInsights(payload: IntelligenceReportPayload) {
  const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
  if (!perplexityKey) {
    console.warn('Perplexity API key missing. Skipping live enrichment.');
    return '';
  }

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${perplexityKey}`
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        {
          role: 'user',
          content: `Research recent developments, competitive moves, and news relevant to this marketing intelligence data. Focus on: ${payload.summary.executive_summary || 'competitive intelligence'}. Respond with concise JSON containing keys "breaking_insights" (array of strings) and "sources" (array of URLs).`
        }
      ]
    })
  });

  if (!response.ok) {
    console.warn('Perplexity enrichment failed', response.status);
    return '';
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content ?? '';

  try {
    JSON.parse(content);
    return content;
  } catch (error) {
    console.warn('Perplexity response was not valid JSON', error);
    return content;
  }
}

