export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchWithRetry(
  request: () => Promise<Response>,
  retries = 2,
  backoffMs = 500
) {
  let attempt = 0;
  while (attempt <= retries) {
    const response = await request();
    if (response.status === 429 && attempt < retries) {
      await sleep(backoffMs * (attempt + 1));
      attempt += 1;
      continue;
    }

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return response;
  }

  throw new Error('Exceeded retry attempts');
}

