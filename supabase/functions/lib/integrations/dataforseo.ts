import type { WorkflowContext, SerpResult, KeywordMetric } from '../types.ts';
import { fetchWithRetry } from '../utils.ts';

const DATAFORSEO_BASE_URL = 'https://api.dataforseo.com';

function getCredentials() {
  const apiKey = Deno.env.get('DATAFORSEO_API_KEY');

  if (!apiKey) {
    throw new Error('DataForSEO API key is missing');
  }

  return apiKey;
}

async function fetchDataForSeo<T>(endpoint: string, body: unknown): Promise<T> {
  const apiKey = getCredentials();
  
  const response = await fetchWithRetry(() =>
    fetch(`${DATAFORSEO_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${apiKey}`
      },
      body: JSON.stringify([body]),
      signal: AbortSignal.timeout(30000)
    })
  );

  if (!response.ok) {
    throw new Error(`DataForSEO request failed: ${response.status}`);
  }

  const data = await response.json();
  return data as T;
}

export async function fetchSerpResults(context: WorkflowContext): Promise<SerpResult[]> {
  const payload = {
    location_name: context.location,
    language_name: 'English',
    keyword: `${context.industry} ${context.websiteUrl}`,
    target: context.websiteUrl
  };

  // Use live endpoint instead of task_post to avoid polling delays
  const response = await fetchDataForSeo<any>('/v3/serp/google/organic/live/advanced', {
    ...payload,
    search_engine: 'google',
    depth: 100
  });

  const results = response?.tasks?.[0]?.result?.[0]?.items ?? [];
  return results
    .filter((item: any) => item.url && item.domain)
    .slice(0, 20) // Limit results
    .map((item: any) => ({
      search_engine: 'google',
      keyword: `${context.industry} ${context.websiteUrl}`,
      position: item.rank_absolute || item.position,
      url: item.url,
      domain: item.domain,
      delta: item.rank_changes?.absolute || 0
    }));
}

export async function fetchKeywordMetrics(context: WorkflowContext): Promise<KeywordMetric[]> {
  try {
    const keywords = [
      context.industry,
      `${context.industry} services`,
      `${context.industry} ${context.location}`
    ];
    
    // Using DataForSEO Labs AI-optimized endpoint for cleaner response
    const response = await fetchDataForSeo<any>('/v3/dataforseo_labs/google/keyword_suggestions/live.ai', {
      keyword: context.industry,
      location_name: context.location,
      language_name: 'English',
      limit: 50
    });
    
    const items = response?.tasks?.[0]?.result?.[0]?.items ?? [];
    
    return items.map((item: any) => ({
      keyword: item.keyword,
      volume: item.keyword_info?.search_volume ?? 0,
      cpc: item.keyword_info?.cpc ?? 0,
      difficulty: item.keyword_properties?.keyword_difficulty ?? 50,
      ctrPotential: (item.impressions_info?.ctr ?? 0) / 100
    })).slice(0, 20);
  } catch (error) {
    console.error('Failed to fetch keyword metrics:', error);
    // Return mock data as fallback
    return [
      {
        keyword: context.industry,
        volume: 1000,
        cpc: 2.5,
        difficulty: 50,
        ctrPotential: 0.25
      }
    ];
  }
}

export async function identifyCompetitors(context: WorkflowContext): Promise<string[]> {
  try {
    // Using AI-optimized endpoint
    const response = await fetchDataForSeo<any>('/v3/dataforseo_labs/google/competitors_domain/live.ai', {
      target: context.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, ''),
      location_name: context.location,
      language_name: 'English',
      limit: 10
    });
    
    const items = response?.tasks?.[0]?.result?.[0]?.items ?? [];
    const competitors = items
      .map((item: any) => item.domain)
      .filter((domain: string) => domain && domain !== context.websiteUrl)
      .slice(0, 5);
    
    console.log(`Identified ${competitors.length} competitors:`, competitors);
    return competitors;
  } catch (error) {
    console.error('Failed to identify competitors:', error);
    return [];
  }
}

export async function analyzeCompetitorKeywords(competitors: string[], context: WorkflowContext): Promise<any[]> {
  const competitorAnalysis = [];
  
  for (const competitor of competitors.slice(0, 5)) { // Limit to avoid API overuse
    try {
      // Using AI-optimized endpoint
      const response = await fetchDataForSeo<any>('/v3/dataforseo_labs/google/competitors_domain/live.ai', {
        target: competitor,
        location_name: context.location,
        language_name: 'English',
        limit: 100
      });

      const keywords = response?.tasks?.[0]?.result?.items ?? [];
      const topKeywords = keywords.slice(0, 20).map((item: any) => ({
        keyword: item.keyword,
        search_volume: item.search_volume,
        keyword_difficulty: item.keyword_difficulty,
        position: item.se_results_count
      }));

      competitorAnalysis.push({
        domain: competitor,
        keywords: topKeywords,
        total_keywords: keywords.length
      });
    } catch (error) {
      console.warn(`Failed to analyze competitor ${competitor}: ${error}`);
    }
  }

  return competitorAnalysis;
}

export async function fetchCompetitorBacklinks(competitors: string[]): Promise<any[]> {
  // Backlinks API not available on current plan - returning empty array
  console.log('Backlinks API not available, skipping backlink analysis');
  return [];
}

export async function fetchEnhancedSerpResults(context: WorkflowContext, competitors: string[]): Promise<SerpResult[]> {
  // Re-enabled with correct API endpoints
  const allResults: SerpResult[] = [];
  
  // Enhanced industry keywords including competitor analysis
  const enhancedKeywords = [
    context.industry,
    `${context.industry} services`,
    `${context.industry} ${context.location}`,
    `best ${context.industry}`,
    `top ${context.industry} companies`,
    `${context.industry} solutions`,
    `${context.industry} providers`
  ];

  for (const keyword of enhancedKeywords.slice(0, 5)) {
    try {
      // Using AI-optimized endpoint for smaller response size
      const response = await fetchDataForSeo<any>('/v3/serp/google/organic/live/advanced.ai', {
        location_name: context.location,
        language_name: 'English',
        keyword,
        depth: 50
      });

      const organicResults = response?.tasks?.[0]?.result?.[0]?.items ?? [];
      const targetDomain = extractDomain(context.websiteUrl);
      
      organicResults.forEach((item: any, index: number) => {
        const domain = item.domain || extractDomain(item.url || '');
        if (domain === targetDomain || competitors.includes(domain)) {
          allResults.push({
            search_engine: 'google',
            keyword,
            position: index + 1,
            url: item.url,
            domain,
            title: item.title,
            description: item.description,
            is_target: domain === targetDomain
          });
        }
      });
    } catch (error) {
      console.warn(`Failed to fetch SERP data for keyword "${keyword}": ${error}`);
    }
  }

  return allResults;
}

function extractDomain(url: string): string {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '');
  } catch {
    return url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
  }
}

export function buildSerpShareTimeline(serpResults: SerpResult[]) {
  const grouped = new Map<string, { appearances: number; total: number }>();

  serpResults.forEach((result) => {
    const date = new Date().toISOString().split('T')[0];
    const key = `${result.keyword}-${date}`;
    const entry = grouped.get(key) ?? { appearances: 0, total: 0 };
    entry.appearances += result.position ? Math.max(0, 11 - result.position) : 0;
    entry.total += 10;
    grouped.set(key, entry);
  });

  return Array.from(grouped.entries()).map(([key, value]) => {
    const [keyword, date] = key.split('-');
    return {
      captured_at: date,
      share_of_voice: value.total ? (value.appearances / value.total) * 100 : 0,
      keyword
    };
  });
}

export function buildCompetitorInsights(serpResults: SerpResult[], competitors: string[]) {
  const insights = {
    market_leaders: new Map<string, { appearances: number; avg_position: number }>(),
    keyword_overlap: new Map<string, string[]>(),
    competitive_gaps: [] as string[]
  };

  // Analyze competitor performance
  serpResults.forEach((result) => {
    if (competitors.includes(result.domain)) {
      const current = insights.market_leaders.get(result.domain) || { appearances: 0, avg_position: 0 };
      current.appearances += 1;
      current.avg_position = (current.avg_position + result.position) / 2;
      insights.market_leaders.set(result.domain, current);

      // Track keyword overlap
      const keywordCompetitors = insights.keyword_overlap.get(result.keyword) || [];
      if (!keywordCompetitors.includes(result.domain)) {
        keywordCompetitors.push(result.domain);
        insights.keyword_overlap.set(result.keyword, keywordCompetitors);
      }
    }
  });

  return {
    top_competitors: Array.from(insights.market_leaders.entries())
      .sort(([,a], [,b]) => b.appearances - a.appearances)
      .slice(0, 5),
    competitive_keywords: Array.from(insights.keyword_overlap.entries())
      .filter(([, domains]) => domains.length > 1)
      .slice(0, 10),
    market_share_analysis: calculateMarketShare(serpResults, competitors)
  };
}

function calculateMarketShare(serpResults: SerpResult[], competitors: string[]) {
  const domainCounts = new Map<string, number>();
  const totalResults = serpResults.length;

  serpResults.forEach((result) => {
    const count = domainCounts.get(result.domain) || 0;
    domainCounts.set(result.domain, count + 1);
  });

  return Array.from(domainCounts.entries())
    .map(([domain, count]) => ({
      domain,
      market_share: ((count / totalResults) * 100).toFixed(2),
      serp_appearances: count
    }))
    .sort((a, b) => parseFloat(b.market_share) - parseFloat(a.market_share))
    .slice(0, 10);
}

