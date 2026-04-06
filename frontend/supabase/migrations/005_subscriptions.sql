-- ============================================================
-- Migration 005: Subscriptions (Stripe billing)
-- Phase 2 — Billing & Community Polish
-- ============================================================

-- Subscription status enum
create type subscription_status as enum (
  'trialing',
  'active',
  'past_due',
  'canceled',
  'expired'
);

-- Billing cycle enum
create type billing_cycle as enum (
  'monthly',
  'annual'
);

-- Plan tier enum (extends the existing plan type on communities)
-- Note: communities.plan already uses text enum 'free/starter/professional/enterprise'

-- Subscriptions table
create table public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  community_id uuid not null references public.communities(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text unique,
  plan text not null check (plan in ('starter', 'professional', 'enterprise')),
  billing_cycle billing_cycle not null default 'monthly',
  status subscription_status not null default 'trialing',
  trial_end timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for quick lookups
create index idx_subscriptions_community on public.subscriptions(community_id);
create index idx_subscriptions_stripe_customer on public.subscriptions(stripe_customer_id);
create index idx_subscriptions_stripe_sub on public.subscriptions(stripe_subscription_id);
create index idx_subscriptions_status on public.subscriptions(status);

-- Updated_at trigger
create or replace function update_subscription_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row
  execute function update_subscription_timestamp();

-- ── Row Level Security ──────────────────────────────────────

alter table public.subscriptions enable row level security;

-- Community admins can view their subscription
create policy "Community admins can view subscription"
  on public.subscriptions
  for select
  using (
    exists (
      select 1 from public.community_members
      where community_members.community_id = subscriptions.community_id
        and community_members.profile_id = auth.uid()
        and community_members.role = 'admin'
    )
  );

-- Only service role (webhooks) can insert/update/delete
-- No insert/update/delete policies for regular users —
-- all writes go through API routes using supabaseAdmin (service role)

-- ── Sync plan to communities table ──────────────────────────

create or replace function sync_community_plan()
returns trigger as $$
begin
  update public.communities
  set plan = new.plan,
      status = case
        when new.status in ('trialing', 'active') then 'active'
        when new.status = 'canceled' then 'cancelled'
        else 'suspended'
      end
  where id = new.community_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger sync_plan_on_subscription_change
  after insert or update on public.subscriptions
  for each row
  execute function sync_community_plan();
