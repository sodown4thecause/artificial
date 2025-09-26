import type { WorkflowContext } from '../types.ts';
import { fetchWithRetry } from '../utils.ts';

const PAGESPEED_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

export async function fetchPageSpeedMetrics(context: WorkflowContext) {
  const apiKey = Deno.env.get('PAGESPEED_API_KEY');
  if (!apiKey) {
    console.warn('PageSpeed API key missing. Skipping.');
    return null;
  }

  const devices: Array<'DESKTOP' | 'MOBILE'> = ['DESKTOP', 'MOBILE'];

  const results = await Promise.all(
    devices.map(async (strategy) => {
      const url = `${PAGESPEED_URL}?url=${encodeURIComponent(context.websiteUrl)}&strategy=${strategy}&key=${apiKey}`;
      const response = await fetchWithRetry(() => fetch(url));
      const payload = await response.json();
      const lighthouse = payload?.lighthouseResult;
      return {
        strategy,
        payload,
        metrics: {
          lcp: lighthouse?.audits?.['largest-contentful-paint']?.numericValue ?? null,
          fid: lighthouse?.audits?.['max-potential-fid']?.numericValue ?? null,
          cls: lighthouse?.audits?.['cumulative-layout-shift']?.numericValue ?? null
        }
      };
    })
  );

  return results;
}

export function buildCoreWebVitals(results: Awaited<ReturnType<typeof fetchPageSpeedMetrics>> | null) {
  if (!results) return [];
  const desktop = results.find((item) => item.strategy === 'DESKTOP')?.metrics ?? {};
  const mobile = results.find((item) => item.strategy === 'MOBILE')?.metrics ?? {};
  return [
    {
      metric: 'Largest Contentful Paint (ms)',
      desktop: desktop.lcp ?? 0,
      mobile: mobile.lcp ?? 0
    },
    {
      metric: 'First Input Delay (ms)',
      desktop: desktop.fid ?? 0,
      mobile: mobile.fid ?? 0
    },
    {
      metric: 'Cumulative Layout Shift',
      desktop: desktop.cls ?? 0,
      mobile: mobile.cls ?? 0
    }
  ];
}

