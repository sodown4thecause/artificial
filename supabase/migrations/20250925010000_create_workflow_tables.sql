create table if not exists public.onboarding_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  full_name text not null,
  website_url text not null,
  industry text not null,
  location text not null,
  created_at timestamptz default timezone('utc'::text, now())
);

create table if not exists public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  website_url text not null,
  status text not null,
  metadata jsonb,
  triggered_at timestamptz default timezone('utc'::text, now()),
  completed_at timestamptz
);

create table if not exists public.serp_results (
  id bigserial primary key,
  workflow_id uuid references public.workflow_runs on delete cascade,
  search_engine text not null,
  keyword text not null,
  position int,
  url text,
  delta int,
  captured_at timestamptz default timezone('utc'::text, now())
);

create table if not exists public.keyword_metrics (
  id bigserial primary key,
  workflow_id uuid references public.workflow_runs on delete cascade,
  keyword text not null,
  volume numeric,
  cpc numeric,
  difficulty numeric,
  ctr_potential numeric,
  captured_at timestamptz default timezone('utc'::text, now())
);

create table if not exists public.content_sentiment (
  id bigserial primary key,
  workflow_id uuid references public.workflow_runs on delete cascade,
  source text not null,
  sentiment jsonb,
  captured_at timestamptz default timezone('utc'::text, now())
);

create table if not exists public.technical_audits (
  id bigserial primary key,
  workflow_id uuid references public.workflow_runs on delete cascade,
  audit_type text not null,
  payload jsonb,
  captured_at timestamptz default timezone('utc'::text, now())
);

create table if not exists public.backlink_metrics (
  id bigserial primary key,
  workflow_id uuid references public.workflow_runs on delete cascade,
  source_domain text not null,
  authority numeric,
  anchor_text text,
  captured_at timestamptz default timezone('utc'::text, now())
);

create table if not exists public.business_profiles (
  id bigserial primary key,
  workflow_id uuid references public.workflow_runs on delete cascade,
  domain text not null,
  firmographics jsonb,
  captured_at timestamptz default timezone('utc'::text, now())
);

create table if not exists public.ai_insights (
  id bigserial primary key,
  workflow_id uuid references public.workflow_runs on delete cascade,
  provider text not null,
  summary jsonb,
  captured_at timestamptz default timezone('utc'::text, now())
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid references public.workflow_runs on delete cascade,
  payload jsonb not null,
  captured_at timestamptz default timezone('utc'::text, now())
);

create index if not exists idx_workflow_runs_user_id on public.workflow_runs(user_id);
create index if not exists idx_serp_results_workflow on public.serp_results(workflow_id);
create index if not exists idx_keyword_metrics_workflow on public.keyword_metrics(workflow_id);
create index if not exists idx_reports_workflow on public.reports(workflow_id);

