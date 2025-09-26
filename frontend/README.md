# Artificial Intelligentsia Frontend (Vite + React)

## Quick start

```bash
npm install
npm run dev
```

The dev server runs on `http://localhost:3000` by default.

## Scripts

- `npm run dev` – Start the Vite dev server.
- `npm run build` – Generate a production build in `dist`.
- `npm run preview` – Preview the production build locally.
- `npm test` – Execute unit tests with Vitest.

## Application structure

- `/` — Marketing landing page with CTA directing visitors to authentication.
- `/auth` — Supabase Auth UI (email/password plus optional social providers).
- `/onboarding` — Post-auth business onboarding form collecting name, website, industry, and location.

## Environment variables

Create a `.env` file in the project root to store environment values used at runtime. Prefix keys with `VITE_` so they are exposed to the browser at build-time, for example:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_STRIPE_PRICING_TABLE_ID=
```

Restart the dev server whenever environment variables change.

## Testing

```bash
npm test -- --run
```

Vitest uses a jsdom environment and custom React Testing Library matchers from `@testing-library/jest-dom`. Ensure Supabase environment variables are in place to avoid runtime warning
