-- ============================================================================
-- 006_property_assignments.sql
-- Property assignment tracking — links lots to residents and NFT minting status
-- ============================================================================

create table if not exists public.property_assignments (
  id            uuid primary key default gen_random_uuid(),
  community_id  uuid not null references public.communities(id) on delete cascade,
  lot_number    integer not null,
  profile_id    uuid references public.profiles(id) on delete set null,
  wallet_address text,
  nft_token_id  integer,
  status        text not null default 'unassigned'
                check (status in ('unassigned', 'pending_wallet', 'assigned', 'minted')),
  assigned_by   uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Unique constraint: one lot per community
alter table public.property_assignments
  add constraint property_assignments_community_lot_unique
  unique (community_id, lot_number);

-- Index for lookups by profile
create index if not exists idx_property_assignments_profile
  on public.property_assignments(profile_id);

-- Index for lookups by community
create index if not exists idx_property_assignments_community
  on public.property_assignments(community_id);

-- Auto-update updated_at
create or replace function public.update_property_assignment_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_property_assignments_updated
  before update on public.property_assignments
  for each row
  execute function public.update_property_assignment_timestamp();

-- ── RLS ──────────────────────────────────────────────────────────────────────

alter table public.property_assignments enable row level security;

-- Anyone authenticated can view assignments in their community
create policy "Members can view community assignments"
  on public.property_assignments for select
  using (
    exists (
      select 1 from public.community_members cm
      where cm.community_id = property_assignments.community_id
        and cm.profile_id = auth.uid()
    )
  );

-- Only admins/managers can insert assignments
create policy "Admins can insert assignments"
  on public.property_assignments for insert
  with check (
    exists (
      select 1 from public.community_members cm
      where cm.community_id = property_assignments.community_id
        and cm.profile_id = auth.uid()
        and cm.role in ('admin', 'manager')
    )
  );

-- Only admins/managers can update assignments
create policy "Admins can update assignments"
  on public.property_assignments for update
  using (
    exists (
      select 1 from public.community_members cm
      where cm.community_id = property_assignments.community_id
        and cm.profile_id = auth.uid()
        and cm.role in ('admin', 'manager')
    )
  );

-- Only admins can delete assignments
create policy "Admins can delete assignments"
  on public.property_assignments for delete
  using (
    exists (
      select 1 from public.community_members cm
      where cm.community_id = property_assignments.community_id
        and cm.profile_id = auth.uid()
        and cm.role = 'admin'
    )
  );
