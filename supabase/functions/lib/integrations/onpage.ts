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

// On-page audit uses task_post which requires polling - commenting out for now
// to avoid workflow delays. Can be re-enabled later if needed.
export async function fetchOnPageAudit(context: WorkflowContext) {
  console.log('On-page audit disabled - uses task_post endpoint that requires polling');
  return {
    audit_type: 'onpage',
    payload: {
      status: 'disabled',
      message: 'On-page audit temporarily disabled to avoid workflow delays'
    }
  };
}

