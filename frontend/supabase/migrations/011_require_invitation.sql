-- 011_require_invitation.sql
--
-- Close the signup loophole: the /signup page is a gated door, but the
-- underlying supabase.auth.signUp() call is initiated from the browser with
-- the anon key, which means a motivated attacker could bypass the page and
-- call signUp() directly from devtools or a script. This migration adds a
-- database-level enforcement so that an auth.users row cannot be created
-- unless the caller presents either:
--
--   1) `invite_token` in raw_user_meta_data that matches a pending,
--      non-expired row in public.invitations, OR
--   2) `founding_flow = true` in raw_user_meta_data AND the caller's email
--      matches an approved row in public.founding_applications.
--
-- If neither condition holds we RAISE EXCEPTION inside a BEFORE INSERT
-- trigger on auth.users. Supabase surfaces the exception message back to
-- the client as an auth error, so the attacker just sees "Signup is invite
-- only" instead of a new account.
--
-- IMPORTANT ESCAPE HATCHES
-- -----------------------
-- - supabase_auth_admin is the only role expected to insert into auth.users
--   through the normal signup API. For admin-initiated user creation (i.e.
--   supabase.auth.admin.createUser from a service-role context) we still
--   want that to work, so we allow any caller that sets a truthy
--   `admin_created = true` flag in raw_app_meta_data. raw_app_meta_data is
--   writable only by the service role, so the browser cannot forge this.
-- - Email confirmations and password resets do NOT go through INSERT on
--   auth.users — they go through UPDATE — so this trigger does not affect
--   those flows.
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Guard function: returns NEW on success, raises exception otherwise.
-- ---------------------------------------------------------------------------
create or replace function public.require_invitation_on_signup()
returns trigger
language plpgsql
security definer
-- Empty search_path forces fully qualified identifiers and matches the
-- hardening pattern from 001/010.
set search_path = ''
as $$
declare
  v_invite_token text;
  v_founding_flow text;
  v_admin_created text;
  v_email text;
  v_invitation record;
  v_founding record;
begin
  -- Admin-created users (service role) get a free pass. raw_app_meta_data
  -- is gated behind the service role, so the browser cannot set this.
  v_admin_created := coalesce(new.raw_app_meta_data ->> 'admin_created', '');
  if v_admin_created = 'true' then
    return new;
  end if;

  v_invite_token := nullif(coalesce(new.raw_user_meta_data ->> 'invite_token', ''), '');
  v_founding_flow := coalesce(new.raw_user_meta_data ->> 'founding_flow', '');
  v_email := lower(coalesce(new.email, ''));

  -- Path 1 — invitation token
  if v_invite_token is not null then
    select i.id, i.email, i.status, i.expires_at
      into v_invitation
      from public.invitations i
      where i.token = v_invite_token
      limit 1;

    if not found then
      raise exception 'Signup is invite only — the invitation code is not recognized.'
        using errcode = 'P0001';
    end if;

    if v_invitation.status <> 'pending' then
      raise exception 'Signup is invite only — this invitation is no longer valid (status: %).',
        v_invitation.status using errcode = 'P0001';
    end if;

    if v_invitation.expires_at <= now() then
      raise exception 'Signup is invite only — this invitation has expired.'
        using errcode = 'P0001';
    end if;

    -- Lock the email: the account being created must match the invited
    -- email. This prevents an attacker who phishes a valid token from
    -- using it to create an account under a different address.
    if lower(coalesce(v_invitation.email, '')) <> v_email then
      raise exception 'Signup is invite only — the invitation was issued to a different email address.'
        using errcode = 'P0001';
    end if;

    return new;
  end if;

  -- Path 2 — founding program approval
  if v_founding_flow = 'true' then
    select f.id, f.contact_email, f.status
      into v_founding
      from public.founding_applications f
      where lower(f.contact_email) = v_email
      order by f.reviewed_at desc nulls last
      limit 1;

    if not found then
      raise exception 'Signup is invite only — no founding application on file for this email.'
        using errcode = 'P0001';
    end if;

    if v_founding.status <> 'approved' then
      raise exception 'Signup is invite only — your founding application is not yet approved (status: %).',
        v_founding.status using errcode = 'P0001';
    end if;

    return new;
  end if;

  -- No invitation marker at all: closed door.
  raise exception 'Signup is invite only. Please reserve your seat at /waitlist.'
    using errcode = 'P0001';
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Grant so supabase_auth_admin can invoke the function.
-- ---------------------------------------------------------------------------
grant execute on function public.require_invitation_on_signup() to supabase_auth_admin;

-- ---------------------------------------------------------------------------
-- 3. BEFORE INSERT trigger on auth.users. This fires *before* 010's
--    on_auth_user_created AFTER INSERT trigger, so a failed invitation
--    check aborts the insert entirely and no auth row or profile row is
--    ever created.
-- ---------------------------------------------------------------------------
drop trigger if exists require_invitation_before_signup on auth.users;
create trigger require_invitation_before_signup
  before insert on auth.users
  for each row execute function public.require_invitation_on_signup();
