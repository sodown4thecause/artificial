# Supabase SQL Checklist

Use this guide to apply the SQL changes required for the BI Dashboard project. Run the statements in the Supabase SQL editor (or `psql`). Execute each block in order. Anything commented with `--` is explanatory and does not need to be typed.

> **Tip:** Always back up your data and test in a non-production environment before running destructive commands.

---

## 1. Enable Extensions

```sql
-- Enable pg_cron (needed for weekly refresh scheduling)
create extension if not exists pg_cron;

-- Optional: if http_post is not yet available, ensure the supabase_api extension is enabled
create extension if not exists supabase_api;
```

## 2. Schedule Weekly Workflow Refresh

1. Confirm you set the `SCHEDULER_SECRET` environment variable and added the same value under **Project Settings → Edge Functions → Secrets**.
2. Replace `<your-project-ref>` with your actual Supabase project ref (e.g. `efynkraanhjwfjetnccp`).
3. Adjust the cron expression as needed (example here runs every Monday at 03:00 UTC).

```sql
-- Remove an existing job with the same name, if it exists
select cron.unschedule(jobid)
from cron.job
where jobname = 'weekly_intelligence_refresh';

-- Schedule weekly refresh
select cron.schedule(
  'weekly_intelligence_refresh',
  '0 3 * * 1',
  $$
  select
    http_post(
      'https://<your-project-ref>.supabase.co/functions/v1/scheduler/run-weekly',
      '{}'::jsonb,
      jsonb_build_object(
        'Content-Type', 'application/json',
        'x-scheduler-secret', 'nf2837hd283hd28'
      )
    );
  $$
);
```

## 3. Apply Row Level Security (RLS)

### 3.1 Onboarding Profiles

```sql
alter table public.onboarding_profiles enable row level security;

drop policy if exists "Users can manage their own onboarding profile"
on public.onboarding_profiles;

create policy "Users can manage their own onboarding profile"
on public.onboarding_profiles
for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
```

### 3.2 Workflow Runs

```sql
alter table public.workflow_runs enable row level security;

drop policy if exists "Users can see their workflow runs" on public.workflow_runs;
create policy "Users can see their workflow runs"
on public.workflow_runs
for select
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their workflow runs" on public.workflow_runs;
create policy "Users can insert their workflow runs"
on public.workflow_runs
for insert
with check ((select auth.uid()) = user_id);
```

### 3.3 Downstream Tables (SERP/Keyword/etc.)

Repeat this pattern for each table that references `workflow_id`. Replace `<table>` with the actual table name.

```sql
-- Example for keyword_metrics
alter table public.keyword_metrics enable row level security;

drop policy if exists "Users can view keyword_metrics via their workflows"
on public.keyword_metrics;

create policy "Users can view keyword_metrics via their workflows"
on public.keyword_metrics
for select
using (
  exists (
    select 1 from public.workflow_runs wr
    where wr.id = keyword_metrics.workflow_id
      and wr.user_id = (select auth.uid())
  )
);

-- Apply the same structure for:
--   public.serp_results
--   public.content_sentiment
--   public.technical_audits
--   public.backlink_metrics
--   public.business_profiles
--   public.ai_insights
--   public.reports
```

## 4. Legacy / Previous-Project Tables

If you have tables from an old project, identify them and drop what you no longer need.

### 4.1 List All Tables

```sql
select schemaname, tablename
from pg_tables
where schemaname = 'public'
order by tablename;
```

Review the output. The dashboard project primarily uses:

- `onboarding_profiles`
- `workflow_runs`
- `serp_results`
- `keyword_metrics`
- `content_sentiment`
- `technical_audits`
- `backlink_metrics`
- `business_profiles`
- `ai_insights`
- `reports`

Any additional tables (e.g., `profiles`, `website_analyses`, `workflow_results`, old auth side tables) can be dropped if you’re sure they aren’t required.

### 4.2 Drop Unused Tables

```sql
-- Example: drop unused legacy tables (make sure you really want to delete them!)
drop table if exists public.website_analyses cascade;
drop table if exists public.workflow_results cascade;
drop table if exists public.profiles cascade;

-- Repeat for any other legacy tables you confirm are safe to remove
```

> **Warning:** Dropping tables destroys data permanently. Double-check before executing.

## 5. Helpful Verification Queries

After applying policies and dropping tables, verify that only the expected tables remain and that policies are in place:

```sql
-- Confirm policies
select schemaname, tablename, policyname
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- Confirm pg_cron job exists
select jobid, jobname, schedule
from cron.job
order by jobid desc;
```

---

### Next Steps

1. Ensure environment variables (including `SCHEDULER_SECRET`, `ANTHROPIC_API_KEY`, `PERPLEXITY_API_KEY`, etc.) are set both locally (`supabase/example.env`) and in Supabase Edge Function secrets.
2. Deploy edge functions: `run-intelligence-workflow`, `reports/latest`, and `scheduler/run-weekly`.
3. Test the cron endpoint manually before relying on pg_cron (trigger the scheduler function via `http_post` to confirm it enqueues workflows).

Keeping this markdown file in the repository ensures you can reproduce the database configuration quickly on new environments.
