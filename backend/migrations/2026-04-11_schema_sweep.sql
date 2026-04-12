-- ═══════════════════════════════════════════════════════════════════════════
--  Faircroft / SuvrenHOA — 2026-04-11 Schema Sweep
--  Author: audit pass driven by Ryan (EliteDevs)
--
--  This file is the consolidated history of eleven migrations applied to the
--  live Supabase project `xnilnmwksnahshfmlqqn` on 2026-04-11 during the
--  post-Lux V15 database audit. It is the authoritative reference for every
--  table, policy, and function added on that day and should be treated as
--  append-only history — never edit this file; write a new migration
--  alongside it if further changes are required.
--
--  WHY THIS EXISTS
--  ───────────────
--  Ryan's instinct ("make sure all the tables and connections are there,
--  I feel like a lot has been missed") turned out to be right. Before this
--  sweep, the database had:
--
--    • 7 ghost tables referenced by the frontend but missing from live
--      (profiles, communities, community_members, invitations,
--       founding_applications, launch_signups, geocode_cache).
--    • 7 hoa_* tables with RLS entirely DISABLED (publicly readable/writable).
--    • 1 table (hoa_notifications) with RLS enabled but ZERO policies.
--    • 2 tables (passkey_challenges, passkey_credentials) with USING(true)
--      policies — any authenticated user could read/delete anyone else's
--      passkey credentials. Critical severity.
--    • 6 SECURITY DEFINER functions with mutable search_path — classic
--      privilege-escalation vector.
--    • 2 permissive policies on price_history_cache (legacy XRPBurner
--      portfolio app sharing the same DB).
--
--  After the sweep the security advisor is clean except for two expected
--  noise items:
--    (a) passkey_challenges INFO "RLS enabled, no policy" — intentional,
--        service_role is the only writer, see migration 008.
--    (b) auth_leaked_password_protection WARN — Supabase Auth dashboard
--        toggle, out of scope for schema changes.
--
--  WALLET ↔ AUTH CAVEAT
--  ────────────────────
--  The legacy hoa_* tables identify users by `wallet_address text` (the
--  pre-Supabase-auth on-chain-first design). There is no mapping table
--  linking auth.users.id → wallet_address in the live DB. Until that
--  linkage exists, the RLS on those tables can only enforce
--  "authenticated readers, service_role writers" — the application layer
--  is responsible for wallet↔user matching. Anything stricter would
--  require a migration that extends profiles with a wallet_address column
--  and a verification handshake.
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── 001_create_communities_and_members ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.communities (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  address      text,
  city         text,
  state        text,
  zip          text,
  unit_count   integer NOT NULL DEFAULT 0 CHECK (unit_count >= 0),
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS communities_created_by_idx ON public.communities(created_by);

CREATE TABLE IF NOT EXISTS public.community_members (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id  uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  profile_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          text NOT NULL DEFAULT 'member'
                  CHECK (role IN ('member','admin','board_member','board_president','property_manager')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (community_id, profile_id)
);
CREATE INDEX IF NOT EXISTS community_members_community_idx ON public.community_members(community_id);
CREATE INDEX IF NOT EXISTS community_members_profile_idx   ON public.community_members(profile_id);

ALTER TABLE public.communities       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;


-- ─── 002_create_profiles_with_auth_trigger ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        text,
  full_name    text,
  avatar_url   text,
  role         text NOT NULL DEFAULT 'member'
                 CHECK (role IN ('member','board_member','board_president','admin','property_manager')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(lower(email));
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_self"
  ON public.profiles FOR SELECT  USING (auth.uid() = id);
CREATE POLICY "profiles_update_self"
  ON public.profiles FOR UPDATE  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert_self"
  ON public.profiles FOR INSERT  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup + backfill existing users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, email, full_name, created_at)
SELECT u.id, u.email,
       COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', NULL),
       COALESCE(u.created_at, now())
FROM auth.users u
ON CONFLICT (id) DO NOTHING;


-- ─── 003_create_invitations_and_rpc ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invitations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token         text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  community_id  uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  email         text NOT NULL,
  role          text NOT NULL DEFAULT 'member'
                  CHECK (role IN ('member','admin','board_member','board_president','property_manager')),
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','accepted','expired','revoked')),
  invited_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at    timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at   timestamptz,
  accepted_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invitations_token_idx       ON public.invitations(token);
CREATE INDEX IF NOT EXISTS invitations_community_idx   ON public.invitations(community_id);
CREATE INDEX IF NOT EXISTS invitations_email_lower_idx ON public.invitations(lower(email));
CREATE INDEX IF NOT EXISTS invitations_status_idx      ON public.invitations(status);
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RPC used by /signup gate (see frontend/src/app/signup/page.tsx)
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(invite_token text)
RETURNS TABLE (
  id              uuid,
  token           text,
  community_id    uuid,
  community_name  text,
  email           text,
  role            text,
  status          text,
  expires_at      timestamptz,
  created_at      timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT i.id, i.token, i.community_id, c.name, i.email, i.role, i.status, i.expires_at, i.created_at
  FROM public.invitations i
  JOIN public.communities c ON c.id = i.community_id
  WHERE i.token = invite_token
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(text) TO anon, authenticated;


-- ─── 004_create_founding_applications ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.founding_applications (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_name    text NOT NULL CHECK (char_length(community_name) BETWEEN 2 AND 120),
  property_count    integer NOT NULL CHECK (property_count BETWEEN 1 AND 10000),
  contact_name      text NOT NULL CHECK (char_length(contact_name) BETWEEN 2 AND 100),
  contact_email     text NOT NULL UNIQUE CHECK (char_length(contact_email) <= 254),
  contact_phone     text CHECK (contact_phone IS NULL OR char_length(contact_phone) <= 30),
  role              text NOT NULL
                      CHECK (role IN ('board_president','board_member','property_manager','resident','other')),
  pain_points       text[] NOT NULL DEFAULT '{}'::text[],
  referral_source   text CHECK (referral_source IS NULL OR char_length(referral_source) <= 120),
  additional_notes  text CHECK (additional_notes IS NULL OR char_length(additional_notes) <= 1000),
  status            text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','approved','rejected','waitlisted')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  reviewed_at       timestamptz,
  reviewed_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS founding_applications_status_idx     ON public.founding_applications(status);
CREATE INDEX IF NOT EXISTS founding_applications_created_at_idx ON public.founding_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS founding_applications_email_idx      ON public.founding_applications(lower(contact_email));
ALTER TABLE public.founding_applications ENABLE ROW LEVEL SECURITY;


-- ─── 005_create_launch_signups ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.launch_signups (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text NOT NULL UNIQUE CHECK (char_length(email) <= 254),
  name         text CHECK (name IS NULL OR char_length(name) <= 100),
  source       text NOT NULL DEFAULT 'launch_page'
                 CHECK (source IN ('launch_page','press','social','referral','newsletter','other')),
  referrer     text CHECK (referrer IS NULL OR char_length(referrer) <= 200),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS launch_signups_email_idx      ON public.launch_signups(lower(email));
CREATE INDEX IF NOT EXISTS launch_signups_created_at_idx ON public.launch_signups(created_at DESC);
CREATE INDEX IF NOT EXISTS launch_signups_source_idx     ON public.launch_signups(source);
ALTER TABLE public.launch_signups ENABLE ROW LEVEL SECURITY;


-- ─── 006_create_geocode_cache ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.geocode_cache (
  normalized_address  text PRIMARY KEY,
  original_address    text NOT NULL,
  lat                 double precision NOT NULL,
  lng                 double precision NOT NULL,
  source              text NOT NULL DEFAULT 'nominatim',
  confidence          text,
  raw                 jsonb,
  refreshed_at        timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS geocode_cache_refreshed_idx ON public.geocode_cache(refreshed_at DESC);
ALTER TABLE public.geocode_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "geocode_cache_select_authenticated"
  ON public.geocode_cache FOR SELECT USING (auth.uid() IS NOT NULL);


-- ─── 007_fix_leaky_hoa_rls ───────────────────────────────────────────────────
-- 7 tables had RLS entirely disabled + hoa_notifications had zero policies.
-- All fixed with authenticated-only reads. Writes remain service_role only.
ALTER TABLE public.hoa_amenities          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hoa_board_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hoa_committees         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hoa_committee_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hoa_announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hoa_maintenance_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hoa_post_likes         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hoa_amenities_select_authenticated"
  ON public.hoa_amenities FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "hoa_board_members_select_authenticated"
  ON public.hoa_board_members FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "hoa_committees_select_authenticated"
  ON public.hoa_committees FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "hoa_committee_members_select_authenticated"
  ON public.hoa_committee_members FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "hoa_announcement_reads_select_authenticated"
  ON public.hoa_announcement_reads FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "hoa_maintenance_updates_select_authenticated"
  ON public.hoa_maintenance_updates FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "hoa_post_likes_select_authenticated"
  ON public.hoa_post_likes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "hoa_notifications_select_authenticated"
  ON public.hoa_notifications FOR SELECT USING (auth.uid() IS NOT NULL);


-- ─── 008_fix_passkey_permissive_policies ─────────────────────────────────────
-- CRITICAL: both tables previously had USING(true) policies. Any authenticated
-- user could read/write anyone else's passkey challenges and credentials.
-- passkey_challenges: service_role only (no public policy, RLS stays on).
-- passkey_credentials: users see and delete their own rows only.
DROP POLICY IF EXISTS "Anyone can access passkey challenges" ON public.passkey_challenges;
DROP POLICY IF EXISTS "Users can access own passkey credentials" ON public.passkey_credentials;


-- ─── 009_pin_function_search_paths ───────────────────────────────────────────
-- Mutable search_path on SECURITY DEFINER functions is a classic privilege
-- escalation vector. Pin them all.
ALTER FUNCTION public.check_user_access()                         SET search_path = public;
ALTER FUNCTION public.cleanup_expired_challenges()                SET search_path = public;
ALTER FUNCTION public.generate_invitation_codes(uuid)             SET search_path = public;
ALTER FUNCTION public.get_my_invitation_codes()                   SET search_path = public;
ALTER FUNCTION public.handle_new_user_invitation_codes()          SET search_path = public;
ALTER FUNCTION public.redeem_invitation_code(text, uuid)          SET search_path = public;
ALTER FUNCTION public.trigger_cleanup_expired_challenges()        SET search_path = public;


-- ─── 010_price_history_cache_cleanup (legacy XRPBurner) ─────────────────────
-- The legacy portfolio app shared this DB and had USING(true) / WITH CHECK(true)
-- on price_history_cache. service_role bypasses RLS anyway, so these policies
-- were useless AND dangerous. Drop them — writes still work from the portfolio
-- app via service_role.
DROP POLICY IF EXISTS "Service role updates prices" ON public.price_history_cache;
DROP POLICY IF EXISTS "Service role writes prices"  ON public.price_history_cache;


-- ─── 011_fix_rls_recursion_with_security_definer_helpers ─────────────────────
-- community_members + communities + profiles policies cross-referenced
-- community_members in subqueries, causing Postgres to infinite-loop during
-- policy evaluation. The canonical fix is to run membership lookups through
-- SECURITY DEFINER helpers, which bypass RLS on the lookup and break the cycle.
CREATE OR REPLACE FUNCTION public.is_community_member(cid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = cid AND profile_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_community_admin(cid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = cid AND profile_id = auth.uid()
      AND role IN ('admin','board_president')
  );
$$;

CREATE OR REPLACE FUNCTION public.shares_community_with(other_uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.community_members me
    JOIN public.community_members them USING (community_id)
    WHERE me.profile_id = auth.uid() AND them.profile_id = other_uid
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_community_member(uuid)   TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_community_admin(uuid)    TO authenticated;
GRANT EXECUTE ON FUNCTION public.shares_community_with(uuid) TO authenticated;


-- ─── Policies that use the helpers ───────────────────────────────────────────

-- communities
CREATE POLICY "communities_insert_self"
  ON public.communities FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "communities_select_member"
  ON public.communities FOR SELECT
  USING (auth.uid() = created_by OR public.is_community_member(id));
CREATE POLICY "communities_update_admin"
  ON public.communities FOR UPDATE
  USING (auth.uid() = created_by OR public.is_community_admin(id));

-- community_members
CREATE POLICY "community_members_select_self_or_co_member"
  ON public.community_members FOR SELECT
  USING (profile_id = auth.uid() OR public.is_community_member(community_id));
CREATE POLICY "community_members_insert_self_or_admin"
  ON public.community_members FOR INSERT
  WITH CHECK (
    (profile_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_members.community_id AND c.created_by = auth.uid()
    ))
    OR public.is_community_admin(community_id)
  );
CREATE POLICY "community_members_update_admin"
  ON public.community_members FOR UPDATE
  USING (public.is_community_admin(community_id));
CREATE POLICY "community_members_delete_admin_or_self"
  ON public.community_members FOR DELETE
  USING (profile_id = auth.uid() OR public.is_community_admin(community_id));

-- profiles co-member read
CREATE POLICY "profiles_select_co_member"
  ON public.profiles FOR SELECT
  USING (public.shares_community_with(profiles.id));

-- invitations
CREATE POLICY "invitations_select_community_admin"
  ON public.invitations FOR SELECT
  USING (public.is_community_admin(community_id));
CREATE POLICY "invitations_insert_community_admin"
  ON public.invitations FOR INSERT
  WITH CHECK (auth.uid() = invited_by AND public.is_community_admin(community_id));
CREATE POLICY "invitations_update_community_admin"
  ON public.invitations FOR UPDATE
  USING (public.is_community_admin(community_id));

-- ─── 012_email_based_policies_use_jwt_not_subquery ───────────────────────────
-- Policies that tried to look up the caller's email via
--   SELECT email FROM auth.users WHERE id = auth.uid()
-- fail because the `authenticated` role can't read auth.users. Read the email
-- claim from the JWT instead.

CREATE POLICY "founding_applications_select_own"
  ON public.founding_applications FOR SELECT
  USING (lower(contact_email) = lower(COALESCE(auth.jwt() ->> 'email', '')));

CREATE POLICY "founding_applications_select_board"
  ON public.founding_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('board_member','board_president','admin')
    )
  );

CREATE POLICY "founding_applications_update_board"
  ON public.founding_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('board_member','board_president','admin')
    )
  );

CREATE POLICY "launch_signups_select_admin"
  ON public.launch_signups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('board_member','board_president','admin')
    )
  );

CREATE POLICY "passkey_credentials_select_own"
  ON public.passkey_credentials FOR SELECT
  USING (lower(user_email) = lower(COALESCE(auth.jwt() ->> 'email', '')));
CREATE POLICY "passkey_credentials_delete_own"
  ON public.passkey_credentials FOR DELETE
  USING (lower(user_email) = lower(COALESCE(auth.jwt() ->> 'email', '')));

-- ═══════════════════════════════════════════════════════════════════════════
--  END OF 2026-04-11 SCHEMA SWEEP
-- ═══════════════════════════════════════════════════════════════════════════
