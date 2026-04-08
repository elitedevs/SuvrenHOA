-- ═══════════════════════════════════════════════════════════════════════════════
-- SuvrenHOA Production Migration Bundle
-- Migrations: 001, 002, 003, 004, 007, 008, 009
-- Skipped: 005, 006 (do not exist in repo — numbering gap)
-- 
-- IMPORTANT: Run this against your production Supabase instance via the SQL Editor
-- or `supabase db push`. All statements use IF NOT EXISTS / IF EXISTS for safety.
--
-- Generated: 2026-04-07
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 001_profiles.sql — User profiles with RLS, auto-created on auth signup
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'resident' check (role in ('board_member', 'property_manager', 'resident')),
  wallet_address text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select to authenticated using (true);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'resident'));
  return new;
end; $$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 002_communities.sql — Community/HOA table with RLS
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null, address text, city text, state text, zip text,
  unit_count integer not null default 0, logo_url text,
  created_by uuid not null references public.profiles(id),
  plan text not null default 'free' check (plan in ('free', 'starter', 'professional', 'enterprise')),
  status text not null default 'active' check (status in ('active', 'suspended', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.communities enable row level security;

create policy "Community members can view their community"
  on public.communities for select to authenticated
  using (id in (select community_id from public.community_members where profile_id = auth.uid()));

create policy "Authenticated users can create communities"
  on public.communities for insert to authenticated
  with check (created_by = auth.uid());

create policy "Community admins can update their community"
  on public.communities for update to authenticated
  using (id in (select community_id from public.community_members where profile_id = auth.uid() and role = 'admin'));

create trigger communities_updated_at
  before update on public.communities
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 003_community_members.sql — Community membership with roles
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.community_members (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'manager', 'member')),
  joined_at timestamptz not null default now(),
  unique (community_id, profile_id)
);

alter table public.community_members enable row level security;

create policy "Members can view co-members"
  on public.community_members for select to authenticated
  using (community_id in (select community_id from public.community_members where profile_id = auth.uid()));

create policy "Admins can add members"
  on public.community_members for insert to authenticated
  with check (community_id in (select community_id from public.community_members where profile_id = auth.uid() and role = 'admin') or profile_id = auth.uid());

create policy "Admins can update member roles"
  on public.community_members for update to authenticated
  using (community_id in (select community_id from public.community_members where profile_id = auth.uid() and role = 'admin'));

create policy "Admins can remove members"
  on public.community_members for delete to authenticated
  using (community_id in (select community_id from public.community_members where profile_id = auth.uid() and role = 'admin') or profile_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- 004_invitations.sql — Invitation system with tokens, expiry, status tracking
-- ─────────────────────────────────────────────────────────────────────────────

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

create policy "Community admins can view invitations"
  on public.invitations for select to authenticated
  using (community_id in (select community_id from public.community_members where profile_id = auth.uid() and role in ('admin', 'manager')));

create policy "Community admins can create invitations"
  on public.invitations for insert to authenticated
  with check (community_id in (select community_id from public.community_members where profile_id = auth.uid() and role = 'admin') and invited_by = auth.uid());

create policy "Community admins can update invitations"
  on public.invitations for update to authenticated
  using (community_id in (select community_id from public.community_members where profile_id = auth.uid() and role = 'admin'));

create or replace function public.get_invitation_by_token(invite_token text)
returns table (id uuid, community_id uuid, community_name text, email text, role text, status text, expires_at timestamptz)
language sql security definer as $$
  select i.id, i.community_id, c.name, i.email, i.role, i.status, i.expires_at
  from public.invitations i join public.communities c on c.id = i.community_id
  where i.token = invite_token limit 1;
$$;

create or replace function public.accept_invitation(invite_token text)
returns json language plpgsql security definer as $$
declare inv record; usr_id uuid;
begin
  usr_id := auth.uid();
  if usr_id is null then return json_build_object('error', 'Not authenticated'); end if;
  select * into inv from public.invitations where token = invite_token and status = 'pending' and expires_at > now();
  if not found then return json_build_object('error', 'Invitation not found, expired, or already used'); end if;
  insert into public.community_members (community_id, profile_id, role) values (inv.community_id, usr_id, inv.role) on conflict (community_id, profile_id) do nothing;
  update public.invitations set status = 'accepted', accepted_by = usr_id where id = inv.id;
  return json_build_object('success', true, 'community_id', inv.community_id);
end; $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTE: Migrations 005 and 006 do not exist in the repo (numbering gap).
-- Likely reserved for Phase 2 Stripe tables that were folded into 007.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- 007_rls_hardening.sql — Phase 5: RLS audit, subscriptions, property_assignments
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.community_role(p_community_id uuid, p_min_role text default 'member')
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.community_members cm
    where cm.community_id = p_community_id and cm.profile_id = auth.uid()
      and (p_min_role = 'member'
        or (p_min_role = 'manager' and cm.role in ('admin', 'manager'))
        or (p_min_role = 'admin' and cm.role = 'admin'))
  );
$$;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  stripe_customer_id text, stripe_subscription_id text,
  plan text not null default 'free' check (plan in ('free', 'starter', 'professional', 'enterprise')),
  status text not null default 'trialing' check (status in ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  trial_ends_at timestamptz, current_period_start timestamptz, current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (community_id)
);

alter table public.subscriptions enable row level security;
create trigger subscriptions_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();

drop policy if exists "Community admins can view subscription" on public.subscriptions;
create policy "Community admins can view subscription" on public.subscriptions for select to authenticated using (public.community_role(community_id, 'admin'));
drop policy if exists "Community admins can insert subscription" on public.subscriptions;
create policy "Community admins can insert subscription" on public.subscriptions for insert to authenticated with check (public.community_role(community_id, 'admin'));
drop policy if exists "Community admins can update subscription" on public.subscriptions;
create policy "Community admins can update subscription" on public.subscriptions for update to authenticated using (public.community_role(community_id, 'admin')) with check (public.community_role(community_id, 'admin'));

create table if not exists public.property_assignments (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  token_id integer not null, lot_number integer, address_line text, unit text,
  assigned_by uuid references public.profiles(id),
  assigned_at timestamptz not null default now(),
  unique (community_id, token_id), unique (community_id, profile_id)
);

alter table public.property_assignments enable row level security;

drop policy if exists "Members can view property assignments" on public.property_assignments;
create policy "Members can view property assignments" on public.property_assignments for select to authenticated using (public.community_role(community_id, 'member'));
drop policy if exists "Admins can insert property assignments" on public.property_assignments;
create policy "Admins can insert property assignments" on public.property_assignments for insert to authenticated with check (public.community_role(community_id, 'manager'));
drop policy if exists "Admins can update property assignments" on public.property_assignments;
create policy "Admins can update property assignments" on public.property_assignments for update to authenticated using (public.community_role(community_id, 'manager')) with check (public.community_role(community_id, 'manager'));
drop policy if exists "Admins can delete property assignments" on public.property_assignments;
create policy "Admins can delete property assignments" on public.property_assignments for delete to authenticated using (public.community_role(community_id, 'admin'));

-- Hardened profile policies (007 replaces 001 originals)
drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
create policy "Profiles are viewable by authenticated users" on public.profiles for select to authenticated using (true);
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id and role in ('resident', 'property_manager', 'board_member'));

-- Hardened community policies (007 replaces 002 originals)
drop policy if exists "Community members can view their community" on public.communities;
create policy "Community members can view their community" on public.communities for select to authenticated using (public.community_role(id, 'member'));
drop policy if exists "Authenticated users can create communities" on public.communities;
create policy "Authenticated users can create communities" on public.communities for insert to authenticated with check (created_by = auth.uid());
drop policy if exists "Community admins can update their community" on public.communities;
create policy "Community admins can update their community" on public.communities for update to authenticated using (public.community_role(id, 'admin')) with check (public.community_role(id, 'admin'));

-- Hardened community_members policies
drop policy if exists "Members can view co-members" on public.community_members;
create policy "Members can view co-members" on public.community_members for select to authenticated using (public.community_role(community_id, 'member'));
drop policy if exists "Admins can add members" on public.community_members;
create policy "Admins can add members" on public.community_members for insert to authenticated with check (public.community_role(community_id, 'admin') or profile_id = auth.uid());
drop policy if exists "Admins can update member roles" on public.community_members;
create policy "Admins can update member roles" on public.community_members for update to authenticated using (public.community_role(community_id, 'admin')) with check (public.community_role(community_id, 'admin') and role in ('admin', 'manager', 'member'));
drop policy if exists "Admins can remove members" on public.community_members;
create policy "Admins can remove members" on public.community_members for delete to authenticated using (public.community_role(community_id, 'admin') or profile_id = auth.uid());

-- Hardened invitation policies
drop policy if exists "Community admins can view invitations" on public.invitations;
create policy "Community admins can view invitations" on public.invitations for select to authenticated using (public.community_role(community_id, 'manager'));
drop policy if exists "Community admins can create invitations" on public.invitations;
create policy "Community admins can create invitations" on public.invitations for insert to authenticated with check (public.community_role(community_id, 'admin') and invited_by = auth.uid());
drop policy if exists "Community admins can update invitations" on public.invitations;
create policy "Community admins can update invitations" on public.invitations for update to authenticated using (public.community_role(community_id, 'admin')) with check (public.community_role(community_id, 'admin'));

-- Performance indexes
create index if not exists idx_community_members_profile_id on public.community_members (profile_id);
create index if not exists idx_community_members_community_id on public.community_members (community_id);
create index if not exists idx_community_members_role on public.community_members (community_id, profile_id, role);
create index if not exists idx_property_assignments_community_profile on public.property_assignments (community_id, profile_id);
create index if not exists idx_subscriptions_community_id on public.subscriptions (community_id);
create index if not exists idx_invitations_community_id on public.invitations (community_id);
create index if not exists idx_invitations_token on public.invitations (token);

-- ─────────────────────────────────────────────────────────────────────────────
-- 008_founding_program.sql — Founding Community Program applications
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'founding_status') THEN
    CREATE TYPE founding_status AS ENUM ('pending', 'approved', 'rejected', 'waitlisted');
  END IF;
END $$;

create table if not exists public.founding_applications (
  id uuid primary key default gen_random_uuid(),
  community_name text not null, property_count integer not null check (property_count > 0),
  contact_name text not null, contact_email text not null, contact_phone text,
  role text not null check (role in ('board_president', 'board_member', 'property_manager', 'resident', 'other')),
  pain_points text[] not null default '{}', referral_source text, additional_notes text,
  status founding_status not null default 'pending',
  reviewed_by uuid references public.profiles(id), reviewed_at timestamptz, invite_sent_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

alter table public.founding_applications enable row level security;

create policy "Service role can insert founding applications"
  on public.founding_applications for insert to anon, authenticated with check (true);
create policy "Admins can view founding applications"
  on public.founding_applications for select to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('board_member')));
create policy "Admins can update founding applications"
  on public.founding_applications for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('board_member')));

create or replace function update_founding_applications_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create trigger founding_applications_updated_at before update on public.founding_applications for each row execute function update_founding_applications_updated_at();
create index if not exists founding_applications_status_idx on public.founding_applications(status);
create index if not exists founding_applications_created_at_idx on public.founding_applications(created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- 009_launch_signups.sql — Product Hunt launch email signups (BLOCKS NEWSLETTER)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.launch_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  source text default 'launch_page' check (source in ('launch_page', 'press', 'social', 'referral', 'other')),
  referrer text,
  created_at timestamptz not null default now()
);

alter table public.launch_signups enable row level security;

create policy "Anyone can sign up for launch"
  on public.launch_signups for insert to anon, authenticated with check (true);
create policy "Admins can view launch signups"
  on public.launch_signups for select to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('board_member')));
create index if not exists launch_signups_created_at_idx on public.launch_signups(created_at desc);

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION BUNDLE
-- Run order is critical: 001→002→003→004→007→008→009
-- 007 replaces/hardens RLS policies from 001-004, so ordering matters
-- 009 creates launch_signups table needed by /api/newsletter endpoint
-- ═══════════════════════════════════════════════════════════════════════════════
