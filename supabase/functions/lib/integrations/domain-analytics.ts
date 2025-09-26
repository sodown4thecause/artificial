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

export async function fetchDomainAnalytics(context: WorkflowContext, serpResults: SerpResult[]) {
  const competitors = Array.from(
    new Set(
      serpResults
        .map((result) => new URL(result.url).hostname)
        .filter((hostname) => !hostname.includes(new URL(context.websiteUrl).hostname))
        .slice(0, 5)
    )
  );

  const { login, password } = getCredentials();

  const responses = await Promise.allSettled(
    competitors.map((domain) =>
      fetchWithRetry(() =>
        fetch(`${DATAFORSEO_BASE_URL}/v3/dataforseo_labs/domain_metrics/domain_overview/live`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${btoa(`${login}:${password}`)}`
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

