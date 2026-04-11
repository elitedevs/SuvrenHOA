/**
 * Geocoding utility for the Faircroft HOA neighborhood map.
 *
 * Resolution strategy (in order):
 *   1. Static lookup   — known Faircroft addresses with hand-placed coords.
 *                        Instant, offline, and survives outages.
 *   2. Session cache   — in-memory Map keyed by normalized address so the
 *                        same address never hits the API twice in one session.
 *   3. /api/geocode    — server-side Nominatim proxy, persistent cache in the
 *                        `geocode_cache` Supabase table, owns the upstream
 *                        rate-limit budget. Only reachable via geocodeAddressAsync.
 *   4. Grid fallback   — deterministic grid around NEIGHBORHOOD_CENTER so the
 *                        map still renders markers for unknown addresses.
 *
 * There are two public entry points:
 *
 *   - geocodeAddress(address, fallbackIndex, totalLots): LatLng
 *       Synchronous. Uses static lookup + grid fallback only. Safe to call
 *       from non-async contexts (e.g. handleSubmit inside a form component
 *       where we need an immediate answer and the user's free-text location
 *       may not be a real address anyway).
 *
 *   - geocodeAddressAsync(address, fallbackIndex, totalLots): Promise<LatLng>
 *       Asynchronous. Walks the full resolution stack. Use this from effects
 *       and map render paths where a real coordinate matters — the difference
 *       between "marker on the actual house" and "marker on the grid" is
 *       worth the extra round trip.
 *
 * Remediation for council finding at this file:7 (placeholder TODO replaced).
 */

export interface LatLng {
  lat: number;
  lng: number;
}

// Default center: Faircroft neighborhood near Raleigh, NC
export const NEIGHBORHOOD_CENTER: LatLng = { lat: 35.84, lng: -78.64 };
export const DEFAULT_ZOOM = 16;

/**
 * Static lookup table for known Faircroft addresses.
 * These represent a realistic grid-style neighborhood near Raleigh, NC.
 * Hand-placed to match a cul-de-sac + two streets layout.
 */
const ADDRESS_LOOKUP: Record<string, LatLng> = {
  // ── Faircroft Drive ──
  '100 faircroft dr':    { lat: 35.8410, lng: -78.6410 },
  '102 faircroft dr':    { lat: 35.8408, lng: -78.6408 },
  '104 faircroft dr':    { lat: 35.8406, lng: -78.6406 },
  '106 faircroft dr':    { lat: 35.8404, lng: -78.6404 },
  '108 faircroft dr':    { lat: 35.8402, lng: -78.6402 },
  '110 faircroft dr':    { lat: 35.8400, lng: -78.6400 },
  '112 faircroft dr':    { lat: 35.8398, lng: -78.6398 },
  '114 faircroft dr':    { lat: 35.8396, lng: -78.6396 },

  // ── Faircroft Lane ──
  '200 faircroft ln':    { lat: 35.8418, lng: -78.6388 },
  '202 faircroft ln':    { lat: 35.8416, lng: -78.6386 },
  '204 faircroft ln':    { lat: 35.8414, lng: -78.6384 },
  '206 faircroft ln':    { lat: 35.8412, lng: -78.6382 },

  // ── Faircroft Court (cul-de-sac) ──
  '300 faircroft ct':    { lat: 35.8420, lng: -78.6414 },
  '302 faircroft ct':    { lat: 35.8422, lng: -78.6416 },
  '304 faircroft ct':    { lat: 35.8424, lng: -78.6412 },
  '306 faircroft ct':    { lat: 35.8422, lng: -78.6408 },
};

// ── Normalization ────────────────────────────────────────────────────────────

/**
 * Normalize an address string for lookup.
 * MUST stay in sync with `normalizeAddress` in /api/geocode/route.ts — the
 * normalized form is used as the persistent cache primary key, so any drift
 * here causes cache misses that hit upstream twice.
 *
 * Rules:
 *   - lowercase, trim, collapse whitespace
 *   - strip punctuation (. ,)
 *   - expand common street-type words to their USPS abbreviation
 */
export function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,]/g, '')
    .replace(/\bstreet\b/g, 'st')
    .replace(/\bavenue\b/g, 'ave')
    .replace(/\bboulevard\b/g, 'blvd')
    .replace(/\bdrive\b/g, 'dr')
    .replace(/\broad\b/g, 'rd')
    .replace(/\bcourt\b/g, 'ct')
    .replace(/\bcircle\b/g, 'cir')
    .replace(/\blane\b/g, 'ln')
    .replace(/\bplace\b/g, 'pl')
    .replace(/\bterrace\b/g, 'ter')
    .replace(/\bparkway\b/g, 'pkwy');
}

// ── Session cache + in-flight dedup ──────────────────────────────────────────

/**
 * Session-scoped cache. Survives component unmounts and route transitions but
 * dies when the tab closes. This sits in front of the persistent Supabase
 * cache so repeated geocodes in the same session don't even make a network
 * round-trip.
 */
const sessionCache = new Map<string, LatLng>();

/**
 * In-flight dedup: if two components request the same address before the
 * first response returns, they share one Promise instead of racing two
 * API calls for the same key.
 */
const inflight = new Map<string, Promise<LatLng | null>>();

/** Test-only: reset the in-memory caches. */
export function __resetGeocodingCaches(): void {
  sessionCache.clear();
  inflight.clear();
}

// ── Grid fallback ────────────────────────────────────────────────────────────

/**
 * Generate a deterministic grid-fallback position for unknown addresses.
 * Spreads markers in a small grid around the neighborhood center so we
 * still render something usable even when both the static lookup and the
 * upstream geocoder come up empty.
 */
export function gridFallbackPosition(index: number, total: number = 16): LatLng {
  const cols = Math.ceil(Math.sqrt(total));
  const row = Math.floor(index / cols);
  const col = index % cols;

  // ~0.0001 degrees ≈ 11 meters spacing
  const spacingLat = 0.0002;
  const spacingLng = 0.0003;

  const offsetLat = (row - (cols - 1) / 2) * spacingLat;
  const offsetLng = (col - (cols - 1) / 2) * spacingLng;

  return {
    lat: NEIGHBORHOOD_CENTER.lat + offsetLat,
    lng: NEIGHBORHOOD_CENTER.lng + offsetLng,
  };
}

// ── Static-lookup helper ─────────────────────────────────────────────────────

/**
 * Walk the static lookup table for exact match, then partial (either
 * direction). Returns null if nothing matches.
 */
function lookupStatic(normalized: string): LatLng | null {
  const exact = ADDRESS_LOOKUP[normalized];
  if (exact) return exact;

  for (const key of Object.keys(ADDRESS_LOOKUP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return ADDRESS_LOOKUP[key];
    }
  }
  return null;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Synchronous resolver. Static lookup + grid fallback only.
 *
 * Use this when you need an immediate, non-async answer — e.g. from a form
 * submit handler where the user is typing free-form text and the grid
 * fallback is perfectly acceptable.
 *
 * @param address        Street address string (e.g. "100 Faircroft Dr")
 * @param fallbackIndex  Index used by gridFallbackPosition if no match found
 * @param totalLots      Total lot count, used by gridFallbackPosition sizing
 */
export function geocodeAddress(
  address: string,
  fallbackIndex: number,
  totalLots: number = 16,
): LatLng {
  const normalized = normalizeAddress(address);
  return lookupStatic(normalized) ?? gridFallbackPosition(fallbackIndex, totalLots);
}

/**
 * Asynchronous resolver. Full stack: static → session cache → /api/geocode → grid fallback.
 *
 * Use this from the map render path where a real coordinate is worth a
 * round-trip. Never throws — upstream failures and 404s both collapse to
 * the grid fallback so the map always renders.
 *
 * @param address        Street address string
 * @param fallbackIndex  Index used by gridFallbackPosition on total miss
 * @param totalLots      Total lot count, used by gridFallbackPosition sizing
 */
export async function geocodeAddressAsync(
  address: string,
  fallbackIndex: number,
  totalLots: number = 16,
): Promise<LatLng> {
  const normalized = normalizeAddress(address);

  // 1. Static first — free and offline.
  const staticHit = lookupStatic(normalized);
  if (staticHit) return staticHit;

  // 2. Session cache.
  const cached = sessionCache.get(normalized);
  if (cached) return cached;

  // 3. In-flight dedup.
  const existing = inflight.get(normalized);
  if (existing) {
    const result = await existing;
    return result ?? gridFallbackPosition(fallbackIndex, totalLots);
  }

  // 4. Hit the API.
  const promise = (async (): Promise<LatLng | null> => {
    try {
      const res = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      if (!res.ok) return null;
      const payload = (await res.json()) as { lat?: number; lng?: number };
      if (
        typeof payload?.lat !== 'number' ||
        typeof payload?.lng !== 'number' ||
        !Number.isFinite(payload.lat) ||
        !Number.isFinite(payload.lng)
      ) {
        return null;
      }
      const coord = { lat: payload.lat, lng: payload.lng };
      sessionCache.set(normalized, coord);
      return coord;
    } catch {
      return null;
    } finally {
      inflight.delete(normalized);
    }
  })();

  inflight.set(normalized, promise);
  const result = await promise;
  return result ?? gridFallbackPosition(fallbackIndex, totalLots);
}
