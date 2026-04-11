-- 012_geocode_cache.sql — Persistent geocoding cache
--
-- Backs frontend/src/utils/geocoding.ts. Every successful Nominatim (or other
-- upstream) lookup is cached keyed by a normalized address string so we never
-- hit the upstream API twice for the same address, and so map rendering stays
-- fast even under load.
--
-- The cache is populated lazily from a server action that owns the upstream
-- rate-limit budget — the client never calls upstream directly.

create table if not exists public.geocode_cache (
  normalized_address text primary key,
  original_address   text not null,
  lat                double precision not null,
  lng                double precision not null,
  source             text not null check (source in ('nominatim', 'google', 'mapbox', 'manual')),
  confidence         text,                       -- upstream-provided quality hint
  raw                jsonb,                      -- full upstream response for debugging
  created_at         timestamptz not null default now(),
  refreshed_at       timestamptz not null default now()
);

-- Lookups are primary-key hits, but we also want a recency index for eviction.
create index if not exists geocode_cache_refreshed_idx
  on public.geocode_cache(refreshed_at desc);

alter table public.geocode_cache enable row level security;

-- Server-side roles only — the browser must never touch the cache directly.
-- Reads and writes go through a signed API route that rate-limits upstream
-- calls and sanitizes user input. No anon or authenticated policies.
-- (Service role bypasses RLS by design.)

comment on table public.geocode_cache is
  'Cached upstream geocoding results keyed by normalized address. Populated by /api/geocode.';
