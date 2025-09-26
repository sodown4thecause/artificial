import type { WorkflowContext, SerpResult, KeywordMetric } from '../types.ts';
import { fetchWithRetry } from '../utils.ts';

const DATAFORSEO_BASE_URL = 'https://api.dataforseo.com';

function getCredentials() {
  const login = Deno.env.get('DATAFORSEO_LOGIN');
  const password = Deno.env.get('DATAFORSEO_PASSWORD');

  if (!login || !password) {
    throw new Error('DataForSEO credentials are missing');
  }

  return { login, password };
}

async function fetchDataForSeo<T>(endpoint: string, body: unknown): Promise<T> {
  const { login, password } = getCredentials();
  const response = await fetchWithRetry(() =>
    fetch(`${DATAFORSEO_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(`${login}:${password}`)}`
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

  const response = await fetchDataForSeo<any>('/v3/serp/google/organic/task_post', {
    ...payload,
    search_engine: 'google'
  });

  const results = response?.tasks?.[0]?.result ?? [];
  return results.map((item: any) => ({
    search_engine: 'google',
    keyword: item.keyword,
    position: item.rank_absolute,
    url: item.url,
    delta: item.rank_changes?.absolute
  }));
}

export async function fetchKeywordMetrics(context: WorkflowContext): Promise<KeywordMetric[]> {
  const response = await fetchDataForSeo<any>('/v3/keywords_data/google_ads/search_volume/task_post', {
    location_name: context.location,
    language_name: 'English',
    keywords: [context.industry, `${context.industry} ${context.location}`]
  });

  const results = response?.tasks?.[0]?.result ?? [];
  return results.flatMap((item: any) =>
    (item.search_volume ?? []).map((volume: any) => ({
      keyword: item.keyword,
      volume: volume.search_volume,
      cpc: volume.cpc,
      difficulty: volume.competition,
      ctrPotential: 0.25
    }))
  );
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

