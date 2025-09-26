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
}

export async function generateInsights(input: GenerateInsightsInput) {
  const structuredPayload = buildStructuredPayload(input);
  const perplexityInsights = await callPerplexityInsights(structuredPayload);
  const { reportPayload, summary } = await callPrimaryModel(structuredPayload, perplexityInsights);

  return {
    provider: 'claude',
    summary,
    reportPayload
  };
}

function buildStructuredPayload(input: GenerateInsightsInput): IntelligenceReportPayload {
  const now = new Date().toISOString();
  return {
    summary: {
      id: crypto.randomUUID(),
      captured_at: now,
      executive_summary: '',
      recommendations: []
    },
    serpTimeline: input.serpTimeline,
    keywordOpportunities: input.keywordMetrics.map((metric) => ({
      keyword: metric.keyword,
      volume: metric.volume,
      difficulty: metric.difficulty,
      ctrPotential: metric.ctrPotential
    })),
    sentiment: input.contentSentiment.map((item: any) => ({
      label: item.categories?.[0]?.name ?? item.url ?? 'unknown',
      score: item.sentiment?.score ?? 0
    })),
    backlinks: input.backlinkMetrics,
    coreWebVitals: input.pagespeed,
    techStack: (input.domainAnalytics ?? []).map((item: any) => ({
      competitor: item?.tasks?.[0]?.result?.[0]?.target ?? 'unknown',
      categories: item?.tasks?.[0]?.result?.[0]?.technologies?.map((tech: any) => tech.name) ?? []
    }))
  };
}

async function callPrimaryModel(payload: IntelligenceReportPayload, perplexityInsights: string) {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error('Anthropic API key missing');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: Deno.env.get('WORKFLOW_REPORT_LLM_MODEL') ?? 'claude-3-opus-20240229',
      max_tokens: 1500,
      system:
        'You are an AI analyst producing marketing intelligence reports. Respond strictly in JSON with keys executive_summary (string) and recommendations (array of {title, description, confidence between 0 and 1}).',
      messages: [
        {
          role: 'user',
          content: JSON.stringify({ payload, perplexityInsights })
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
      model: 'llama-3.1-sonar-large-128k-online',
      messages: [
        {
          role: 'system',
          content:
            'You have live web access. Research recent developments, competitive moves, and news relevant to the provided marketing intelligence payload. Respond with concise JSON containing keys `breaking_insights` (array of strings) and `sources` (array of URLs).'
        },
        {
          role: 'user',
          content: JSON.stringify(payload)
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

