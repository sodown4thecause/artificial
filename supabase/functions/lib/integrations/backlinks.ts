import type { WorkflowContext } from '../types.ts';
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

export async function fetchBacklinkMetrics(context: WorkflowContext) {
  const { login, password } = getCredentials();
  const response = await fetchWithRetry(() =>
    fetch(`${DATAFORSEO_BASE_URL}/v3/backlinks/backlink_summary/live`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(`${login}:${password}`)}`
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

