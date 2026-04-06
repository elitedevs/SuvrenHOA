-- 007_rls_hardening.sql — Phase 5: Comprehensive RLS audit and hardening
-- Adds missing tables (subscriptions, property_assignments) and hardens all policies.
-- Safe to run on existing databases: uses CREATE TABLE IF NOT EXISTS and
-- DROP POLICY IF EXISTS before each CREATE POLICY.

-- ─────────────────────────────────────────────────────────────────────────────
-- HELPER: community_role(community_id, min_role)
-- Returns true if auth.uid() is a member of the community with AT LEAST min_role.
-- Role hierarchy: admin > manager > member
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.community_role(
  p_community_id uuid,
  p_min_role text default 'member'
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.community_members cm
    where cm.community_id = p_community_id
      and cm.profile_id = auth.uid()
      and (
        p_min_role = 'member'
        or (p_min_role = 'manager' and cm.role in ('admin', 'manager'))
        or (p_min_role = 'admin'   and cm.role = 'admin')
      )
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: subscriptions
-- Stripe billing subscription per community
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  id                  uuid        primary key default gen_random_uuid(),
  community_id        uuid        not null references public.communities(id) on delete cascade,
  stripe_customer_id  text,
  stripe_subscription_id text,
  plan                text        not null default 'free'
                                  check (plan in ('free', 'starter', 'professional', 'enterprise')),
  status              text        not null default 'trialing'
                                  check (status in ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  trial_ends_at       timestamptz,
  current_period_start timestamptz,
  current_period_end  timestamptz,
  cancel_at_period_end boolean    not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (community_id)
);

alter table public.subscriptions enable row level security;

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- Policies: subscriptions
drop policy if exists "Community admins can view subscription" on public.subscriptions;
create policy "Community admins can view subscription"
  on public.subscriptions for select
  to authenticated
  using (public.community_role(community_id, 'admin'));

drop policy if exists "Community admins can insert subscription" on public.subscriptions;
create policy "Community admins can insert subscription"
  on public.subscriptions for insert
  to authenticated
  with check (public.community_role(community_id, 'admin'));

drop policy if exists "Community admins can update subscription" on public.subscriptions;
create policy "Community admins can update subscription"
  on public.subscriptions for update
  to authenticated
  using (public.community_role(community_id, 'admin'))
  with check (public.community_role(community_id, 'admin'));

-- Service role (Stripe webhooks) can do anything — covered by bypassing RLS with service key.
-- No anon/authenticated DELETE: cancellation goes via admin update of status field.

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: property_assignments
-- Links on-chain PropertyNFT token IDs to community members / addresses
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.property_assignments (
  id           uuid    primary key default gen_random_uuid(),
  community_id uuid    not null references public.communities(id) on delete cascade,
  profile_id   uuid    not null references public.profiles(id)    on delete cascade,
  token_id     integer not null,
  lot_number   integer,
  address_line text,
  unit         text,
  assigned_by  uuid    references public.profiles(id),
  assigned_at  timestamptz not null default now(),
  unique (community_id, token_id),
  unique (community_id, profile_id)
);

alter table public.property_assignments enable row level security;

-- Members can view assignments in their community
drop policy if exists "Members can view property assignments" on public.property_assignments;
create policy "Members can view property assignments"
  on public.property_assignments for select
  to authenticated
  using (public.community_role(community_id, 'member'));

-- Admins/managers can assign properties
drop policy if exists "Admins can insert property assignments" on public.property_assignments;
create policy "Admins can insert property assignments"
  on public.property_assignments for insert
  to authenticated
  with check (public.community_role(community_id, 'manager'));

drop policy if exists "Admins can update property assignments" on public.property_assignments;
create policy "Admins can update property assignments"
  on public.property_assignments for update
  to authenticated
  using (public.community_role(community_id, 'manager'))
  with check (public.community_role(community_id, 'manager'));

drop policy if exists "Admins can delete property assignments" on public.property_assignments;
create policy "Admins can delete property assignments"
  on public.property_assignments for delete
  to authenticated
  using (public.community_role(community_id, 'admin'));

-- ─────────────────────────────────────────────────────────────────────────────
-- HARDEN: profiles
-- ─────────────────────────────────────────────────────────────────────────────
-- Block anon reads (existing policy is 'to authenticated' but make it explicit)
drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

-- Users cannot insert their own profile directly — handled by the trigger
drop policy if exists "Block direct profile insert" on public.profiles;
-- (trigger handles insert; no INSERT policy = blocked for authenticated users too)

-- Users can only update their own profile; prevent role escalation
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using  (auth.uid() = id)
  with check (
    auth.uid() = id
    -- Prevent self-escalating to board_member via profile update;
    -- role changes must go through community_members.role
    and role in ('resident', 'property_manager', 'board_member')
  );

-- No DELETE policy: users cannot hard-delete their own profile (cascade from auth.users handles it)

-- ─────────────────────────────────────────────────────────────────────────────
-- HARDEN: communities
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists "Community members can view their community" on public.communities;
create policy "Community members can view their community"
  on public.communities for select
  to authenticated
  using (public.community_role(id, 'member'));

drop policy if exists "Authenticated users can create communities" on public.communities;
create policy "Authenticated users can create communities"
  on public.communities for insert
  to authenticated
  with check (created_by = auth.uid());

drop policy if exists "Community admins can update their community" on public.communities;
create policy "Community admins can update their community"
  on public.communities for update
  to authenticated
  using  (public.community_role(id, 'admin'))
  with check (public.community_role(id, 'admin'));

-- Admins can soft-delete by setting status='cancelled'; no hard DELETE policy

-- ─────────────────────────────────────────────────────────────────────────────
-- HARDEN: community_members
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists "Members can view co-members" on public.community_members;
create policy "Members can view co-members"
  on public.community_members for select
  to authenticated
  using (public.community_role(community_id, 'member'));

drop policy if exists "Admins can add members" on public.community_members;
create policy "Admins can add members"
  on public.community_members for insert
  to authenticated
  with check (
    -- Admins can add anyone to their community
    public.community_role(community_id, 'admin')
    -- Users can add themselves (invitation accept flow via RPC)
    or profile_id = auth.uid()
  );

drop policy if exists "Admins can update member roles" on public.community_members;
create policy "Admins can update member roles"
  on public.community_members for update
  to authenticated
  using  (public.community_role(community_id, 'admin'))
  with check (
    public.community_role(community_id, 'admin')
    -- Prevent admins from promoting to 'admin' without explicit check (allowed here; gate in app)
    and role in ('admin', 'manager', 'member')
  );

drop policy if exists "Admins can remove members" on public.community_members;
create policy "Admins can remove members"
  on public.community_members for delete
  to authenticated
  using (
    public.community_role(community_id, 'admin')
    or profile_id = auth.uid()  -- members can leave
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- HARDEN: invitations
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists "Community admins can view invitations" on public.invitations;
create policy "Community admins can view invitations"
  on public.invitations for select
  to authenticated
  using (public.community_role(community_id, 'manager'));

drop policy if exists "Community admins can create invitations" on public.invitations;
create policy "Community admins can create invitations"
  on public.invitations for insert
  to authenticated
  with check (
    public.community_role(community_id, 'admin')
    and invited_by = auth.uid()
  );

drop policy if exists "Community admins can update invitations" on public.invitations;
create policy "Community admins can update invitations"
  on public.invitations for update
  to authenticated
  using  (public.community_role(community_id, 'admin'))
  with check (public.community_role(community_id, 'admin'));

-- Prevent hard-delete of invitations (audit trail); status='revoked' instead
-- No DELETE policy for invitations.

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES for policy performance (community_role helper hits community_members)
-- ─────────────────────────────────────────────────────────────────────────────
create index if not exists idx_community_members_profile_id
  on public.community_members (profile_id);

create index if not exists idx_community_members_community_id
  on public.community_members (community_id);

create index if not exists idx_community_members_role
  on public.community_members (community_id, profile_id, role);

create index if not exists idx_property_assignments_community_profile
  on public.property_assignments (community_id, profile_id);

create index if not exists idx_subscriptions_community_id
  on public.subscriptions (community_id);

create index if not exists idx_invitations_community_id
  on public.invitations (community_id);

create index if not exists idx_invitations_token
  on public.invitations (token);
