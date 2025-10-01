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

