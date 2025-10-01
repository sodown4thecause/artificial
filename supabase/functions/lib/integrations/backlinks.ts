import type { WorkflowContext } from '../types.ts';
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

export async function fetchBacklinkMetrics(context: WorkflowContext) {
  const base64Auth = getCredentials();
  const response = await fetchWithRetry(() =>
    fetch(`${DATAFORSEO_BASE_URL}/v3/backlinks/summary/live`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${base64Auth}`
      },
      body: JSON.stringify([
        {
          target: context.websiteUrl,
          limit: 100
        }
      ])
    })
  );

  const data = await response.json();
  const backlinks = data?.tasks?.[0]?.result?.[0]?.items ?? [];

  return backlinks.map((item: any) => ({
    source: item.source_domain,
    authority: item.source_trust_score ?? 0,
    anchorText: item.anchor_text ?? ''
  }));
}

