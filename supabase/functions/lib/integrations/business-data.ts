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

export async function fetchBusinessData(context: WorkflowContext, domainAnalytics: any[]) {
  const base64Auth = getCredentials();
  const domains = domainAnalytics
    .map((item: any) => item?.tasks?.[0]?.result?.[0]?.target)
    .filter(Boolean)
    .slice(0, 5);

  const payload = domains.map((domain: string) => ({ target: domain }));

  const response = await fetchWithRetry(() =>
    fetch(`${DATAFORSEO_BASE_URL}/v3/business_data/google/my_business_info/live`, {
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

