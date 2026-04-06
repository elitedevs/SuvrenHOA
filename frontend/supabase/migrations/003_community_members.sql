-- 003_community_members.sql — Community membership with roles

create table if not exists public.community_members (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'manager', 'member')),
  joined_at timestamptz not null default now(),

  unique (community_id, profile_id)
);

alter table public.community_members enable row level security;

-- Members can see other members in their communities
create policy "Members can view co-members"
  on public.community_members for select
  to authenticated
  using (
    community_id in (
      select community_id from public.community_members
      where profile_id = auth.uid()
    )
  );

-- Admins can add members
create policy "Admins can add members"
  on public.community_members for insert
  to authenticated
  with check (
    community_id in (
      select community_id from public.community_members
      where profile_id = auth.uid() and role = 'admin'
    )
    -- Also allow self-insert when accepting an invite (handled via RPC)
    or profile_id = auth.uid()
  );

-- Admins can update member roles
create policy "Admins can update member roles"
  on public.community_members for update
  to authenticated
  using (
    community_id in (
      select community_id from public.community_members
      where profile_id = auth.uid() and role = 'admin'
    )
  );

-- Admins can remove members
create policy "Admins can remove members"
  on public.community_members for delete
  to authenticated
  using (
    community_id in (
      select community_id from public.community_members
      where profile_id = auth.uid() and role = 'admin'
    )
    or profile_id = auth.uid() -- members can leave
  );
