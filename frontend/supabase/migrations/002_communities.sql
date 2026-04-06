-- 002_communities.sql — Community/HOA table with RLS

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text,
  state text,
  zip text,
  unit_count integer not null default 0,
  logo_url text,
  created_by uuid not null references public.profiles(id),
  plan text not null default 'free' check (plan in ('free', 'starter', 'professional', 'enterprise')),
  status text not null default 'active' check (status in ('active', 'suspended', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.communities enable row level security;

-- Members can view their communities
create policy "Community members can view their community"
  on public.communities for select
  to authenticated
  using (
    id in (
      select community_id from public.community_members
      where profile_id = auth.uid()
    )
  );

-- Any authenticated user can create a community
create policy "Authenticated users can create communities"
  on public.communities for insert
  to authenticated
  with check (created_by = auth.uid());

-- Only community admins can update
create policy "Community admins can update their community"
  on public.communities for update
  to authenticated
  using (
    id in (
      select community_id from public.community_members
      where profile_id = auth.uid() and role = 'admin'
    )
  );

create trigger communities_updated_at
  before update on public.communities
  for each row execute function public.set_updated_at();
