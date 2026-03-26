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
export const NEIGHBORHOOD_CENTER: LatLng = { lat: 35.7796, lng: -78.6382 };
export const DEFAULT_ZOOM = 16;

/**
 * Static lookup table for known Faircroft addresses.
 * These represent a realistic grid-style neighborhood near Raleigh, NC.
 * Addresses loosely follow a cul-de-sac + two streets pattern.
 */
const ADDRESS_LOOKUP: Record<string, LatLng> = {
  // ── Faircroft Drive ──
  '100 faircroft dr':    { lat: 35.7810, lng: -78.6390 },
  '102 faircroft dr':    { lat: 35.7808, lng: -78.6388 },
  '104 faircroft dr':    { lat: 35.7806, lng: -78.6386 },
  '106 faircroft dr':    { lat: 35.7804, lng: -78.6384 },
  '108 faircroft dr':    { lat: 35.7802, lng: -78.6382 },
  '110 faircroft dr':    { lat: 35.7800, lng: -78.6380 },
  '112 faircroft dr':    { lat: 35.7798, lng: -78.6378 },
  '114 faircroft dr':    { lat: 35.7796, lng: -78.6376 },

  // ── Faircroft Lane ──
  '200 faircroft ln':    { lat: 35.7818, lng: -78.6370 },
  '202 faircroft ln':    { lat: 35.7816, lng: -78.6368 },
  '204 faircroft ln':    { lat: 35.7814, lng: -78.6366 },
  '206 faircroft ln':    { lat: 35.7812, lng: -78.6364 },

  // ── Faircroft Court (cul-de-sac) ──
  '300 faircroft ct':    { lat: 35.7820, lng: -78.6394 },
  '302 faircroft ct':    { lat: 35.7822, lng: -78.6396 },
  '304 faircroft ct':    { lat: 35.7824, lng: -78.6392 },
  '306 faircroft ct':    { lat: 35.7822, lng: -78.6388 },
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
