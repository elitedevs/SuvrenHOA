-- 010_fix_signup_trigger.sql
--
-- Fix "Database error saving new user" when users sign up.
--
-- Root cause: the handle_new_user() trigger from 001_profiles.sql is fired
-- when supabase_auth_admin inserts a row into auth.users. In recent Supabase
-- releases, that role needs an explicit EXECUTE grant on any trigger
-- function living in the `public` schema. Without the grant, Postgres
-- refuses to invoke the function and the entire auth.users insert is
-- rolled back, surfacing the "Database error saving new user" message to
-- the client.
--
-- Additional hardening in this migration:
--   1. Validate the role coming from raw_user_meta_data against the CHECK
--      constraint on profiles.role. If the metadata role isn't one of the
--      three allowed values, fall back to 'resident' instead of aborting.
--   2. Wrap the insert in a begin/exception block so a profile-creation
--      failure downgrades to a warning instead of blocking auth.signUp().
--      Users should always be able to create an auth account; a missing
--      profile row can be backfilled by the app on first login.
--   3. Grant INSERT on public.profiles to supabase_auth_admin as a
--      belt-and-suspenders measure (the security-definer pattern already
--      elevates privileges, but this removes any ambiguity around owner
--      permissions after future owner changes).
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Recreate the trigger function with validation + exception safety.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
-- Empty search_path forces every identifier to be fully qualified, which
-- matches 001 and avoids search_path injection.
set search_path = ''
as $$
declare
  v_role text;
begin
  -- Normalize/validate the role so we never violate the CHECK constraint
  -- on public.profiles.role. Anything unexpected falls back to 'resident'.
  v_role := coalesce(new.raw_user_meta_data ->> 'role', 'resident');
  if v_role not in ('board_member', 'property_manager', 'resident') then
    v_role := 'resident';
  end if;

  begin
    insert into public.profiles (id, email, full_name, role)
    values (
      new.id,
      coalesce(new.email, ''),
      coalesce(new.raw_user_meta_data ->> 'full_name', ''),
      v_role
    );
  exception when others then
    -- Never block auth.signUp() on a profile-creation failure. Log a
    -- warning and let the app backfill the profile on first login.
    raise warning
      'handle_new_user: profile insert failed for user %: % (%)',
      new.id, sqlerrm, sqlstate;
  end;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Grant privileges so supabase_auth_admin can fire the trigger and
--    the trigger can insert into public.profiles.
-- ---------------------------------------------------------------------------
grant usage on schema public to supabase_auth_admin;
grant execute on function public.handle_new_user() to supabase_auth_admin;
grant insert, select on public.profiles to supabase_auth_admin;

-- ---------------------------------------------------------------------------
-- 3. Re-create the trigger to make sure it points at the new function body.
--    (create or replace function above already updates the body, but the
--    trigger definition itself is idempotent with "create or replace".)
-- ---------------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
