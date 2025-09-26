import type { WorkflowContext, SerpResult } from '../types.ts';
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

export async function fetchContentAnalysis(context: WorkflowContext, serpResults: SerpResult[]) {
  const { login, password } = getCredentials();
  const payload = serpResults.slice(0, 10).map((result) => ({
    url: result.url,
    tags: ['sentiment', 'topics']
  }));

  if (!payload.length) {
    return [];
  }

  const response = await fetchWithRetry(() =>
    fetch(`${DATAFORSEO_BASE_URL}/v3/content_analysis/sentiment_analysis/task_post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(`${login}:${password}`)}`
      },
      body: JSON.stringify(payload)
    })
  );

  const data = await response.json();
  const tasks = data?.tasks ?? [];

  return tasks.flatMap((task: any) => {
    const results = task?.result ?? [];
    return results.map((entry: any) => ({
      url: entry?.url,
      sentiment: entry?.sentiment ?? {},
      categories: entry?.categories ?? []
    }));
  });
}

