-- 009_launch_signups.sql — Product Hunt launch email signups

create table if not exists public.launch_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  source text default 'launch_page' check (source in ('launch_page', 'press', 'social', 'referral', 'other')),
  referrer text,
  created_at timestamptz not null default now()
);

alter table public.launch_signups enable row level security;

-- Anyone can sign up (anon insert)
create policy "Anyone can sign up for launch"
  on public.launch_signups for insert
  to anon, authenticated
  with check (true);

-- Admins can view signups
create policy "Admins can view launch signups"
  on public.launch_signups for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('board_member')
    )
  );

-- Index for email uniqueness queries
create index if not exists launch_signups_created_at_idx on public.launch_signups(created_at desc);
