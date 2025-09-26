import type { WorkflowContext, SerpResult } from '../types.ts';
import { fetchWithRetry } from '../utils.ts';

const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v1/crawl';

export async function fetchFirecrawlInsights(
  context: WorkflowContext,
  serpResults: SerpResult[]
) {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) {
    console.warn('Firecrawl API key missing. Skipping crawl.');
    return [];
  }

  const competitorUrls = Array.from(
    new Set(
      serpResults
        .filter((result) => !result.url.includes(context.websiteUrl))
        .map((result) => result.url)
        .slice(0, 5)
    )
  );

  const responses = await Promise.allSettled(
    competitorUrls.map((url) =>
      fetchWithRetry(() =>
        fetch(FIRECRAWL_BASE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({ url, depth: 1 })
        })
      ).then((response) => response.json())
    )
  );

  return responses
    .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled' && result.value)
    .map((result) => ({
      url: result.value?.url,
      headings: result.value?.headings ?? [],
      ctas: result.value?.ctas ?? [],
      tech: result.value?.technologies ?? []
    }));
}

