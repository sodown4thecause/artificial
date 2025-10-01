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

export async function fetchDomainAnalytics(context: WorkflowContext, serpResults: SerpResult[]) {
  const competitors = Array.from(
    new Set(
      serpResults
        .map((result) => new URL(result.url).hostname)
        .filter((hostname) => !hostname.includes(new URL(context.websiteUrl).hostname))
        .slice(0, 5)
    )
  );

  const base64Auth = getCredentials();

  const responses = await Promise.allSettled(
    competitors.map((domain) =>
      fetchWithRetry(() =>
        fetch(`${DATAFORSEO_BASE_URL}/v3/dataforseo_labs/google/domain_rank_overview/live`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${base64Auth}`
          },
          body: JSON.stringify([
            {
              target: domain
            }
          ])
        })
      ).then((response) => response.json())
    )
  );

  return responses
    .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled' && result.value)
    .flatMap((result) => {
      const task = result.value?.tasks?.[0]?.result?.[0];
      if (!task) return [];
      return [
        {
          target: task.target,
          traffic: task.organic_traffic ?? 0,
          technologies: task.technologies ?? []
        }
      ];
    });
}

