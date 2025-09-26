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

export async function fetchOnPageAudit(context: WorkflowContext) {
  const { login, password } = getCredentials();

  const response = await fetchWithRetry(() =>
    fetch(`${DATAFORSEO_BASE_URL}/v3/on_page/audit/task_post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(`${login}:${password}`)}`
      },
      body: JSON.stringify([
        {
          target: context.websiteUrl,
          max_pages: 200
        }
      ])
    })
  );

  const data = await response.json();
  return data?.tasks ?? [];
}

