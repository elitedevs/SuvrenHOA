-- 008_founding_program.sql — Founding Community Program applications

create type if not exists founding_status as enum ('pending', 'approved', 'rejected', 'waitlisted');

create table if not exists public.founding_applications (
  id uuid primary key default gen_random_uuid(),
  community_name text not null,
  property_count integer not null check (property_count > 0),
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  role text not null check (role in ('board_president', 'board_member', 'property_manager', 'resident', 'other')),
  pain_points text[] not null default '{}',
  referral_source text,
  additional_notes text,
  status founding_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  invite_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.founding_applications enable row level security;

-- Only service role (admin API) can insert
create policy "Service role can insert founding applications"
  on public.founding_applications for insert
  to anon, authenticated
  with check (true);

-- Only authenticated admins can view/update
create policy "Admins can view founding applications"
  on public.founding_applications for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('board_member')
    )
  );

create policy "Admins can update founding applications"
  on public.founding_applications for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('board_member')
    )
  );

-- Auto-update timestamp
create or replace function update_founding_applications_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger founding_applications_updated_at
  before update on public.founding_applications
  for each row execute function update_founding_applications_updated_at();

-- Index for status queries
create index if not exists founding_applications_status_idx on public.founding_applications(status);
create index if not exists founding_applications_created_at_idx on public.founding_applications(created_at desc);
