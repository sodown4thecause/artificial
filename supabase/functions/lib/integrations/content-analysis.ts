import type { WorkflowContext, SerpResult } from '../types.ts';
import { fetchWithRetry } from '../utils.ts';

const DATAFORSEO_BASE_URL = 'https://api.dataforseo.com';

function getCredentials(): string {
  // Try DATAFORSEO_BASE64 first (preferred)
  let base64Auth = Deno.env.get('DATAFORSEO_BASE64');
  
  // Fallback to manual encoding if LOGIN and PASSWORD are provided
  if (!base64Auth) {
    const login = Deno.env.get('DATAFORSEO_LOGIN');
    const password = Deno.env.get('DATAFORSEO_PASSWORD');
    
    if (login && password) {
      base64Auth = btoa(`${login}:${password}`);
    }
  }

  if (!base64Auth) {
    throw new Error('DataForSEO credentials are missing. Set DATAFORSEO_BASE64 or DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD');
  }

  return base64Auth;
}

export async function fetchContentAnalysis(context: WorkflowContext, serpResults: SerpResult[]) {
  const base64Auth = getCredentials();
  const payload = serpResults.slice(0, 10).map((result) => ({
    url: result.url,
    tags: ['sentiment', 'topics']
  }));

  if (!payload.length) {
    return [];
  }

  // Use live endpoint instead of task_post to avoid polling delays
  const response = await fetchWithRetry(() =>
    fetch(`${DATAFORSEO_BASE_URL}/v3/content_analysis/sentiment_analysis/live`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${base64Auth}`
      },
      body: JSON.stringify(payload)
    })
  );

  const data = await response.json();
  const tasks = data?.tasks ?? [];

  return tasks.flatMap((task: any) => {
    // Handle both task_post (polling) and live endpoint responses
    const results = task?.result ?? (task?.items ? [task] : []);
    return results.map((entry: any) => ({
      url: entry?.url,
      sentiment: entry?.sentiment ?? {},
      categories: entry?.categories ?? []
    }));
  });
}

