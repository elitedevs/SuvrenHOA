/**
 * POST /api/geocode
 *
 * Resolves a street address to (lat, lng) via Nominatim (OpenStreetMap),
 * persisting every successful upstream lookup to the `geocode_cache` table
 * so the same address is never requested twice. The browser never calls
 * Nominatim directly — this route owns the upstream rate-limit budget and
 * enforces the usage policy (User-Agent, 1 req/s soft cap via rateLimit).
 *
 * Request:  { address: string }
 * Response: { lat: number, lng: number, source: string, cached: boolean }
 *
 * Remediation for council finding: `frontend/src/utils/geocoding.ts:7`
 * (placeholder TODO replaced with a real geocoder + persistent cache).
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ── Config ────────────────────────────────────────────────────────────────────

const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/search';

// Nominatim usage policy requires a descriptive User-Agent that identifies
// the application and a contact email. See:
//   https://operations.osmfoundation.org/policies/nominatim/
const NOMINATIM_USER_AGENT =
  process.env.NOMINATIM_USER_AGENT ||
  'Faircroft-DAO/1.0 (+https://faircroft.suvren.co; contact: ops@suvren.co)';

// Bias the query toward the neighbourhood so "123 Maple" doesn't resolve to
// a Maple Street on the other side of the country. Center matches
// geocoding.ts NEIGHBORHOOD_CENTER.
const VIEWBOX = '-78.700,35.800,-78.580,35.880'; // left,bottom,right,top
const COUNTRY_CODES = 'us';

// ── Validation ────────────────────────────────────────────────────────────────

const GeocodeRequest = z.object({
  address: z
    .string()
    .min(3, 'address too short')
    .max(256, 'address too long')
    .transform((s) => s.trim()),
});

// ── Normalization (mirrors utils/geocoding.ts so cache keys line up) ──────────

function normalizeAddress(raw: string): string {
  return raw
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

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  // Strict limit — this is an abuse-prone surface that hits a public API.
  const rl = await applyRateLimit(request, 'geocode', RATE_LIMITS.strict);
  if (rl) return rl;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }

  const parsed = GeocodeRequest.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid request', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { address } = parsed.data;
  const normalized = normalizeAddress(address);

  // ── 1. Cache lookup ─────────────────────────────────────────────────────────

  const { data: cached, error: cacheError } = await supabaseAdmin
    .from('geocode_cache')
    .select('normalized_address, lat, lng, source')
    .eq('normalized_address', normalized)
    .maybeSingle();

  if (cacheError) {
    // Fall through to upstream — a cache miss is recoverable.
  }

  if (cached) {
    return NextResponse.json({
      lat: cached.lat,
      lng: cached.lng,
      source: cached.source,
      cached: true,
    });
  }

  // ── 2. Upstream call ────────────────────────────────────────────────────────

  const url = new URL(NOMINATIM_ENDPOINT);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('q', address);
  url.searchParams.set('limit', '1');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('countrycodes', COUNTRY_CODES);
  url.searchParams.set('viewbox', VIEWBOX);
  url.searchParams.set('bounded', '0'); // bias, not hard limit

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(url.toString(), {
      headers: {
        'User-Agent': NOMINATIM_USER_AGENT,
        Accept: 'application/json',
      },
      // 8s hard cap — Nominatim is usually <500ms; anything slower than 8s
      // is effectively a failure for an interactive map render.
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'upstream geocoder unavailable' },
      { status: 502 },
    );
  }

  if (!upstreamResponse.ok) {
    return NextResponse.json(
      { error: 'upstream geocoder error' },
      { status: 502 },
    );
  }

  interface NominatimResult {
    lat: string;
    lon: string;
    importance?: number;
    place_id?: number;
    display_name?: string;
    type?: string;
    class?: string;
  }

  let results: NominatimResult[];
  try {
    results = (await upstreamResponse.json()) as NominatimResult[];
  } catch (err) {
    return NextResponse.json(
      { error: 'upstream geocoder returned invalid data' },
      { status: 502 },
    );
  }

  if (!Array.isArray(results) || results.length === 0) {
    return NextResponse.json(
      { error: 'address not found', cached: false },
      { status: 404 },
    );
  }

  const top = results[0];
  const lat = Number.parseFloat(top.lat);
  const lng = Number.parseFloat(top.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: 'upstream returned non-numeric coordinates' },
      { status: 502 },
    );
  }

  // ── 3. Persist to cache ─────────────────────────────────────────────────────

  const { error: insertError } = await supabaseAdmin
    .from('geocode_cache')
    .upsert(
      {
        normalized_address: normalized,
        original_address: address,
        lat,
        lng,
        source: 'nominatim',
        confidence:
          typeof top.importance === 'number'
            ? top.importance.toFixed(4)
            : null,
        raw: top as unknown as Record<string, unknown>,
        refreshed_at: new Date().toISOString(),
      },
      { onConflict: 'normalized_address' },
    );

  if (insertError) {
    // Cache failure is non-critical — the caller still gets a usable answer.
  }

  return NextResponse.json({
    lat,
    lng,
    source: 'nominatim',
    cached: false,
  });
}
