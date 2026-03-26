/**
 * Geocoding utility for Faircroft HOA neighborhood map.
 *
 * Uses a static lookup table for known Faircroft addresses.
 * Falls back to a grid pattern around the center point for unknown addresses.
 *
 * TODO: Integrate a real geocoding API (e.g., Nominatim, Google Maps Geocoding,
 *       Mapbox Geocoding) for production use.
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
 * These represent a realistic grid-style neighborhood near Raleigh, NC (35.84, -78.64).
 * Addresses loosely follow a cul-de-sac + two streets pattern.
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

/**
 * Normalize an address string for lookup.
 * - Lowercase
 * - Trim whitespace
 * - Expand common abbreviations
 */
function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .trim()
    .replace(/\bdrive\b/g, 'dr')
    .replace(/\blane\b/g, 'ln')
    .replace(/\bcourt\b/g, 'ct')
    .replace(/\bstreet\b/g, 'st')
    .replace(/\bavenue\b/g, 'ave')
    .replace(/\bblvd\b/g, 'blvd')
    .replace(/\bplace\b/g, 'pl')
    .replace(/\bway\b/g, 'way')
    .replace(/\s+/g, ' ');
}

/**
 * Generate a grid-fallback position for unknown addresses.
 * Spreads markers in a small grid around the neighborhood center.
 *
 * @param index - The position index in the fallback sequence
 * @param total - Total number of fallback items (for grid sizing)
 */
export function gridFallbackPosition(index: number, total: number = 16): LatLng {
  const cols = Math.ceil(Math.sqrt(total));
  const row = Math.floor(index / cols);
  const col = index % cols;

  // ~0.0001 degrees ≈ 11 meters spacing
  const spacingLat = 0.0002;
  const spacingLng = 0.0003;

  // Center the grid around the neighborhood center
  const offsetLat = (row - (cols - 1) / 2) * spacingLat;
  const offsetLng = (col - (cols - 1) / 2) * spacingLng;

  return {
    lat: NEIGHBORHOOD_CENTER.lat + offsetLat,
    lng: NEIGHBORHOOD_CENTER.lng + offsetLng,
  };
}

/**
 * Get lat/lng for a street address.
 * Returns a known coordinate from the lookup table, or a grid-fallback position.
 *
 * @param address - Street address string (e.g. "100 Faircroft Dr")
 * @param fallbackIndex - Used for grid placement if address is unknown
 * @param totalLots - Total number of lots (for grid sizing)
 */
export function geocodeAddress(
  address: string,
  fallbackIndex: number,
  totalLots: number = 16
): LatLng {
  const normalized = normalizeAddress(address);

  // Try direct lookup
  if (ADDRESS_LOOKUP[normalized]) {
    return ADDRESS_LOOKUP[normalized];
  }

  // Try partial match on the normalized address
  const match = Object.keys(ADDRESS_LOOKUP).find((key) =>
    normalized.includes(key) || key.includes(normalized)
  );
  if (match) {
    return ADDRESS_LOOKUP[match];
  }

  // Fallback: place in grid
  return gridFallbackPosition(fallbackIndex, totalLots);
}
