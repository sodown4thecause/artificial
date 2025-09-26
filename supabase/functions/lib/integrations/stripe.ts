import Stripe from 'https://esm.sh/stripe@15.11.0?target=deno';

const stripeApiKey = Deno.env.get('STRIPE_SECRET_KEY');

if (!stripeApiKey) {
  console.warn('Stripe secret key missing. Stripe integration disabled.');
}

export const stripe = stripeApiKey
  ? new Stripe(stripeApiKey, {
      httpClient: Stripe.createFetchHttpClient(),
      apiVersion: '2024-06-20'
    })
  : null;

export const STRIPE_PRICE_ID = Deno.env.get('STRIPE_PRICE_ID');
export const STRIPE_PRICE_LOOKUP_KEY = Deno.env.get('STRIPE_PRICE_LOOKUP_KEY');
export const STRIPE_SUCCESS_URL = Deno.env.get('STRIPE_SUCCESS_URL');
export const STRIPE_CANCEL_URL = Deno.env.get('STRIPE_CANCEL_URL');
export const STRIPE_PORTAL_RETURN_URL = Deno.env.get('STRIPE_PORTAL_RETURN_URL');

export function ensureStripeClient() {
  if (!stripe) {
    throw new Error('Stripe client is not configured. Set STRIPE_SECRET_KEY.');
  }

  return stripe;
}

export async function resolvePriceId(stripeClient: Stripe) {
  if (STRIPE_PRICE_ID) {
    return STRIPE_PRICE_ID;
  }

  if (!STRIPE_PRICE_LOOKUP_KEY) {
    throw new Error('Stripe price identifier missing. Set STRIPE_PRICE_ID or STRIPE_PRICE_LOOKUP_KEY.');
  }

  const prices = await stripeClient.prices.list({
    lookup_keys: [STRIPE_PRICE_LOOKUP_KEY],
    expand: ['data.product'],
    limit: 1
  });

  const price = prices.data[0];
  if (!price) {
    throw new Error(`No active price found for lookup key ${STRIPE_PRICE_LOOKUP_KEY}`);
  }

  return price.id;
}

