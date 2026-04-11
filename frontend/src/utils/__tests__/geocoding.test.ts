/**
 * Unit tests for utils/geocoding.ts
 *
 * Runner: Node's built-in test runner with experimental TS type stripping.
 *
 *   node --experimental-strip-types --test src/utils/__tests__/geocoding.test.ts
 *
 * Zero dev-dep cost: Node 22 can strip TypeScript types natively via
 * --experimental-strip-types, and the `node:test` module ships with the
 * runtime. No vitest, no jest, no tsx, no ts-node.
 *
 * Coverage:
 *   - normalizeAddress()       — clean addresses, abbreviation expansion,
 *                                 punctuation stripping, idempotency
 *   - gridFallbackPosition()   — determinism, center-relative spread
 *   - geocodeAddress() (sync)  — static hit, partial match, fallback miss
 *   - geocodeAddressAsync()    — API success, API 404, API error, session
 *                                 cache hit, in-flight dedup
 *
 * The async tests stub global.fetch so nothing actually calls Nominatim.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeAddress,
  gridFallbackPosition,
  geocodeAddress,
  geocodeAddressAsync,
  NEIGHBORHOOD_CENTER,
  __resetGeocodingCaches,
  type LatLng,
} from '../geocoding.ts';

// ─── normalizeAddress ────────────────────────────────────────────────────────

describe('normalizeAddress', () => {
  it('lowercases and trims', () => {
    assert.equal(normalizeAddress('  100 MAIN ST  '), '100 main st');
  });

  it('expands street-type words to USPS abbreviations', () => {
    assert.equal(normalizeAddress('100 Maple Drive'),    '100 maple dr');
    assert.equal(normalizeAddress('200 Oak Lane'),       '200 oak ln');
    assert.equal(normalizeAddress('300 Elm Street'),     '300 elm st');
    assert.equal(normalizeAddress('400 Pine Avenue'),    '400 pine ave');
    assert.equal(normalizeAddress('500 Cedar Court'),    '500 cedar ct');
    assert.equal(normalizeAddress('600 Birch Boulevard'), '600 birch blvd');
    assert.equal(normalizeAddress('700 Ash Circle'),     '700 ash cir');
    assert.equal(normalizeAddress('800 Fir Place'),      '800 fir pl');
    assert.equal(normalizeAddress('900 Willow Terrace'), '900 willow ter');
    assert.equal(normalizeAddress('1000 Hickory Parkway'), '1000 hickory pkwy');
  });

  it('strips commas and periods', () => {
    assert.equal(normalizeAddress('100 Main St., Apt 2'), '100 main st apt 2');
  });

  it('collapses runs of whitespace', () => {
    assert.equal(normalizeAddress('100    Main\t\tSt'), '100 main st');
  });

  it('is idempotent — running twice produces the same result', () => {
    const once  = normalizeAddress('200 Faircroft Lane');
    const twice = normalizeAddress(once);
    assert.equal(once, twice);
  });

  it('does not mangle addresses that are already normalized', () => {
    assert.equal(normalizeAddress('100 faircroft dr'), '100 faircroft dr');
  });
});

// ─── gridFallbackPosition ────────────────────────────────────────────────────

describe('gridFallbackPosition', () => {
  it('is deterministic — same inputs → same outputs', () => {
    const a = gridFallbackPosition(3, 16);
    const b = gridFallbackPosition(3, 16);
    assert.deepEqual(a, b);
  });

  it('centers the grid around NEIGHBORHOOD_CENTER', () => {
    // With total=16 → 4 cols; index 6 lands at row 1, col 2, which for
    // cols=4 is offset ((1 - 1.5)*0.0002, (2 - 1.5)*0.0003).
    const result = gridFallbackPosition(6, 16);
    const expectedLat = NEIGHBORHOOD_CENTER.lat + (1 - 1.5) * 0.0002;
    const expectedLng = NEIGHBORHOOD_CENTER.lng + (2 - 1.5) * 0.0003;
    assert.ok(Math.abs(result.lat - expectedLat) < 1e-9);
    assert.ok(Math.abs(result.lng - expectedLng) < 1e-9);
  });

  it('produces distinct positions for distinct indices', () => {
    const positions = Array.from({ length: 16 }, (_, i) => gridFallbackPosition(i, 16));
    const uniqueKeys = new Set(positions.map((p) => `${p.lat.toFixed(6)}:${p.lng.toFixed(6)}`));
    assert.equal(uniqueKeys.size, 16);
  });
});

// ─── geocodeAddress (sync path) ──────────────────────────────────────────────

describe('geocodeAddress (sync)', () => {
  it('returns the static coord for a known Faircroft address', () => {
    const result = geocodeAddress('100 Faircroft Dr', 0, 16);
    assert.equal(result.lat, 35.8410);
    assert.equal(result.lng, -78.6410);
  });

  it('normalizes before lookup — case-insensitive and handles "Drive"', () => {
    const result = geocodeAddress('100 FAIRCROFT DRIVE', 0, 16);
    assert.equal(result.lat, 35.8410);
    assert.equal(result.lng, -78.6410);
  });

  it('falls back to the grid for an unknown address', () => {
    const result = geocodeAddress('999 Nowhere Road', 5, 16);
    const expected = gridFallbackPosition(5, 16);
    assert.deepEqual(result, expected);
  });
});

// ─── geocodeAddressAsync (full stack) ────────────────────────────────────────

type FetchImpl = typeof globalThis.fetch;

function installFetchMock(impl: FetchImpl): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = impl;
  return () => {
    globalThis.fetch = original;
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('geocodeAddressAsync', () => {
  beforeEach(() => {
    __resetGeocodingCaches();
  });

  it('short-circuits to static lookup and never calls fetch', async () => {
    let calls = 0;
    const restore = installFetchMock(async () => {
      calls++;
      return jsonResponse({});
    });

    try {
      const result = await geocodeAddressAsync('100 Faircroft Dr', 0, 16);
      assert.equal(result.lat, 35.8410);
      assert.equal(calls, 0, 'static lookup must not hit the network');
    } finally {
      restore();
    }
  });

  it('calls /api/geocode on miss and returns the upstream coord', async () => {
    const restore = installFetchMock(async () =>
      jsonResponse({ lat: 40.0, lng: -75.0, source: 'nominatim', cached: false }),
    );

    try {
      const result = await geocodeAddressAsync('1600 Pennsylvania Ave', 7, 16);
      assert.equal(result.lat, 40.0);
      assert.equal(result.lng, -75.0);
    } finally {
      restore();
    }
  });

  it('caches the API result in-session — second call does not re-fetch', async () => {
    let calls = 0;
    const restore = installFetchMock(async () => {
      calls++;
      return jsonResponse({ lat: 41.0, lng: -72.0, source: 'nominatim', cached: false });
    });

    try {
      await geocodeAddressAsync('50 Unknown Way', 0, 16);
      await geocodeAddressAsync('50 unknown way', 0, 16);  // same, different case
      await geocodeAddressAsync('50 Unknown Way', 0, 16);
      assert.equal(calls, 1, 'session cache must prevent duplicate API calls');
    } finally {
      restore();
    }
  });

  it('deduplicates concurrent in-flight requests for the same address', async () => {
    let calls = 0;
    let resolveFetch!: (r: Response) => void;
    const gate = new Promise<Response>((r) => { resolveFetch = r; });
    const restore = installFetchMock(async () => {
      calls++;
      return gate;
    });

    try {
      // Fire two concurrent lookups for the same address
      const p1 = geocodeAddressAsync('200 Rural Rd', 0, 16);
      const p2 = geocodeAddressAsync('200 rural rd', 1, 16);
      // Give the microtask queue a tick to register both before resolving
      await Promise.resolve();
      resolveFetch(jsonResponse({ lat: 42.0, lng: -71.0, source: 'nominatim', cached: false }));
      const [r1, r2] = await Promise.all([p1, p2]);
      assert.deepEqual(r1, r2);
      assert.equal(calls, 1, 'in-flight dedup must collapse concurrent fetches to one');
    } finally {
      restore();
    }
  });

  it('falls back to grid when the API returns 404', async () => {
    const restore = installFetchMock(async () =>
      new Response(JSON.stringify({ error: 'address not found' }), { status: 404 }),
    );

    try {
      const result = await geocodeAddressAsync('xyz nonexistent address', 4, 16);
      assert.deepEqual(result, gridFallbackPosition(4, 16));
    } finally {
      restore();
    }
  });

  it('falls back to grid when the API throws', async () => {
    const restore = installFetchMock(async () => {
      throw new Error('network down');
    });

    try {
      const result = await geocodeAddressAsync('typo addrs', 2, 16);
      assert.deepEqual(result, gridFallbackPosition(2, 16));
    } finally {
      restore();
    }
  });

  it('falls back to grid when the API returns malformed coordinates', async () => {
    const restore = installFetchMock(async () =>
      jsonResponse({ lat: 'not-a-number', lng: null }),
    );

    try {
      const result = await geocodeAddressAsync('corrupt response road', 9, 16);
      assert.deepEqual(result, gridFallbackPosition(9, 16));
    } finally {
      restore();
    }
  });

  it('never throws, even under pathological upstream behavior', async () => {
    const restore = installFetchMock(async () =>
      new Response('not valid json', { status: 200 }),
    );

    try {
      const result = await geocodeAddressAsync('mystery lane', 11, 16);
      // Type guard — if we got here without throwing, fallback kicked in
      const coord: LatLng = result;
      assert.equal(typeof coord.lat, 'number');
      assert.equal(typeof coord.lng, 'number');
    } finally {
      restore();
    }
  });
});
