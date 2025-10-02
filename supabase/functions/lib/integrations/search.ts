import type { WorkflowContext } from '../types.ts';

const CUSTOM_SEARCH_URL = 'https://www.googleapis.com/customsearch/v1';

export async function fetchCustomSearchNews(context: WorkflowContext) {
  const apiKey = Deno.env.get('CUSTOM_SEARCH_KEY');
  const cseId = Deno.env.get('CUSTOM_SEARCH_CSE_ID');

  if (!apiKey || !cseId) {
    console.warn('⚠️ Custom search credentials missing - skipping news search');
    return [];
  }

  const query = `${context.industry} news site:${context.websiteUrl}`;
  const response = await fetch(
    `${CUSTOM_SEARCH_URL}?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(query)}&num=5`
  );

  if (!response.ok) {
    throw new Error(`Custom search failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.items ?? [];
}

