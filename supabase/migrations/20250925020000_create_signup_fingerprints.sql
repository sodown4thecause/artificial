create table if not exists public.signup_fingerprints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  ip_address text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (user_id)
);

create index if not exists idx_signup_fingerprints_ip on public.signup_fingerprints(ip_address);

alter table public.signup_fingerprints enable row level security;

drop policy if exists "Users can view their signup fingerprint" on public.signup_fingerprints;
create policy "Users can view their signup fingerprint"
on public.signup_fingerprints
for select
using ((select auth.uid()) = user_id);


