-- Simplified Clerk Auth Migration
-- This replaces the previous migration with a simpler approach

-- 1. Drop all existing RLS policies
do $$ 
declare
    r record;
begin
    for r in (select schemaname, tablename, policyname from pg_policies where schemaname = 'public') loop
        execute 'drop policy if exists "' || r.policyname || '" on ' || r.schemaname || '.' || r.tablename;
    end loop;
end $$;

-- 2. Temporarily disable RLS on all affected tables
alter table public.onboarding_profiles disable row level security;
alter table public.workflow_runs disable row level security;
alter table public.signup_fingerprints disable row level security;
alter table billing_customers disable row level security;
alter table billing_events disable row level security;
alter table if exists public.daily_report_limits disable row level security;

-- 3. Create users table for Clerk
create table if not exists public.users (
  id text primary key,
  email text unique not null,
  full_name text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_users_email on public.users(email);

-- 4. Drop all foreign keys and alter columns
alter table public.onboarding_profiles drop constraint if exists onboarding_profiles_user_id_fkey cascade;
alter table public.workflow_runs drop constraint if exists workflow_runs_user_id_fkey cascade;
alter table public.signup_fingerprints drop constraint if exists signup_fingerprints_user_id_fkey cascade;
alter table billing_customers drop constraint if exists billing_customers_user_id_fkey cascade;
alter table billing_customers drop constraint if exists billing_customers_pkey cascade;
alter table billing_events drop constraint if exists billing_events_user_id_fkey cascade;
alter table if exists public.daily_report_limits drop constraint if exists daily_report_limits_user_id_fkey cascade;

-- 5. Convert columns to TEXT
alter table public.onboarding_profiles alter column user_id type text using user_id::text;
alter table public.workflow_runs alter column user_id type text using user_id::text;
alter table public.signup_fingerprints alter column user_id type text using user_id::text;
alter table billing_customers alter column user_id type text using user_id::text;
alter table billing_events alter column user_id type text using user_id::text;
alter table if exists public.daily_report_limits alter column user_id type text using user_id::text;

-- 6. Add new foreign keys
alter table public.onboarding_profiles 
  add constraint onboarding_profiles_user_id_fkey 
  foreign key (user_id) references public.users(id) on delete cascade;

alter table public.workflow_runs 
  add constraint workflow_runs_user_id_fkey 
  foreign key (user_id) references public.users(id) on delete cascade;

alter table public.signup_fingerprints 
  add constraint signup_fingerprints_user_id_fkey 
  foreign key (user_id) references public.users(id) on delete cascade;

alter table billing_customers 
  add constraint billing_customers_pkey primary key (user_id);

alter table billing_customers 
  add constraint billing_customers_user_id_fkey 
  foreign key (user_id) references public.users(id) on delete cascade;

alter table billing_events 
  add constraint billing_events_user_id_fkey 
  foreign key (user_id) references public.users(id) on delete set null;

alter table if exists public.daily_report_limits 
  add constraint daily_report_limits_user_id_fkey 
  foreign key (user_id) references public.users(id) on delete cascade;

-- 7. Re-enable RLS with new Clerk-compatible policies
alter table public.users enable row level security;

create policy "Users can view their own profile"
  on public.users for select
  using (id = current_setting('request.jwt.claim.sub', true));

create policy "Users can update their own profile"
  on public.users for update
  using (id = current_setting('request.jwt.claim.sub', true));

alter table public.signup_fingerprints enable row level security;

create policy "Users can view their signup fingerprint"
  on public.signup_fingerprints for select
  using (user_id = current_setting('request.jwt.claim.sub', true));

alter table if exists public.daily_report_limits enable row level security;

create policy "Users can view own daily limits" 
  on public.daily_report_limits for select 
  using (user_id = current_setting('request.jwt.claim.sub', true));

create policy "Service role can manage daily limits" 
  on public.daily_report_limits for all 
  using (auth.role() = 'service_role');

-- 8. Helper functions
create or replace function public.current_user_id()
returns text as $$
begin
  return current_setting('request.jwt.claim.sub', true);
exception
  when others then
    return null;
end;
$$ language plpgsql security definer;

-- 9. Grant permissions
grant usage on schema public to anon, authenticated;
grant select on public.users to anon, authenticated;
grant insert, update on public.users to authenticated;
grant select, insert, update on public.onboarding_profiles to authenticated;
grant select, insert, update on public.workflow_runs to authenticated;
grant select, insert on public.signup_fingerprints to authenticated;
grant select, insert, update on billing_customers to authenticated;
grant select on billing_events to authenticated;