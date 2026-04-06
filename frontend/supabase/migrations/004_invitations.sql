-- 004_invitations.sql — Invitation system with tokens, expiry, status tracking

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'manager', 'member')),
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'revoked')),
  invited_by uuid not null references public.profiles(id),
  accepted_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),

  unique (community_id, email)
);

alter table public.invitations enable row level security;

-- Admins/managers can view invitations for their communities
create policy "Community admins can view invitations"
  on public.invitations for select
  to authenticated
  using (
    community_id in (
      select community_id from public.community_members
      where profile_id = auth.uid() and role in ('admin', 'manager')
    )
  );

-- Admins can create invitations
create policy "Community admins can create invitations"
  on public.invitations for insert
  to authenticated
  with check (
    community_id in (
      select community_id from public.community_members
      where profile_id = auth.uid() and role = 'admin'
    )
    and invited_by = auth.uid()
  );

-- Admins can update invitations (revoke, etc.)
create policy "Community admins can update invitations"
  on public.invitations for update
  to authenticated
  using (
    community_id in (
      select community_id from public.community_members
      where profile_id = auth.uid() and role = 'admin'
    )
  );

-- Anyone can read an invitation by token (for accept flow) — via RPC function
create or replace function public.get_invitation_by_token(invite_token text)
returns table (
  id uuid,
  community_id uuid,
  community_name text,
  email text,
  role text,
  status text,
  expires_at timestamptz
)
language sql
security definer
as $$
  select
    i.id,
    i.community_id,
    c.name as community_name,
    i.email,
    i.role,
    i.status,
    i.expires_at
  from public.invitations i
  join public.communities c on c.id = i.community_id
  where i.token = invite_token
  limit 1;
$$;

-- Accept invitation RPC
create or replace function public.accept_invitation(invite_token text)
returns json
language plpgsql
security definer
as $$
declare
  inv record;
  usr_id uuid;
begin
  usr_id := auth.uid();
  if usr_id is null then
    return json_build_object('error', 'Not authenticated');
  end if;

  select * into inv from public.invitations
  where token = invite_token and status = 'pending' and expires_at > now();

  if not found then
    return json_build_object('error', 'Invitation not found, expired, or already used');
  end if;

  -- Add user to community
  insert into public.community_members (community_id, profile_id, role)
  values (inv.community_id, usr_id, inv.role)
  on conflict (community_id, profile_id) do nothing;

  -- Mark invitation as accepted
  update public.invitations
  set status = 'accepted', accepted_by = usr_id
  where id = inv.id;

  return json_build_object('success', true, 'community_id', inv.community_id);
end;
$$;
