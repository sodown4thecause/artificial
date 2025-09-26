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

export async function fetchBusinessData(context: WorkflowContext, domainAnalytics: any[]) {
  const { login, password } = getCredentials();
  const domains = domainAnalytics
    .map((item: any) => item?.tasks?.[0]?.result?.[0]?.target)
    .filter(Boolean)
    .slice(0, 5);

  const payload = domains.map((domain: string) => ({ target: domain }));

  const response = await fetchWithRetry(() =>
    fetch(`${DATAFORSEO_BASE_URL}/v3/business_data/business_info/live`, {
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
    const result = task?.result?.[0];
    if (!result) return [];
    return [
      {
        target: result?.target,
        company: result?.company_name,
        revenue: result?.revenue_estimate,
        employees: result?.employee_count,
        locations: result?.locations ?? []
      }
    ];
  });
}

