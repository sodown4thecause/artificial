import type { WorkflowContext } from '../types.ts';

const VOILA_API_URL = 'https://api.voilanorbert.com/v2/search/person';

export async function enrichContacts(context: WorkflowContext, newsroomResults: any[]) {
  const apiKey = Deno.env.get('VOILANORBERT_API_KEY');
  if (!apiKey) {
    console.warn('VoilaNorbert API key missing.');
    return [];
  }

  const leads = newsroomResults
    .map((item) => item.title)
    .filter(Boolean)
    .slice(0, 3);

  const responses = await Promise.allSettled(
    leads.map(async (lead) => {
      const response = await fetch(VOILA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey
        },
        body: JSON.stringify({
          company: context.websiteUrl,
          name: lead
        })
      });

      if (!response.ok) {
        return null;
      }

      return response.json();
    })
  );

  return responses
    .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled' && result.value)
    .map((result) => result.value);
}

