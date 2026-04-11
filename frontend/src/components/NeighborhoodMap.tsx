'use client';

import { useEffect, useRef, useState } from 'react';
import type { LotData } from '@/hooks/useNeighborhoodMap';
import type { Incident } from '@/hooks/useIncidents';
import { geocodeAddressAsync, NEIGHBORHOOD_CENTER, DEFAULT_ZOOM } from '@/utils/geocoding';
import { escapeHtml } from '@/lib/sanitize';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────
interface NeighborhoodMapProps {
  lots: LotData[];
  selectedLot: LotData | null;
  isBoard: boolean;
  onSelectLot: (lot: LotData) => void;
  incidents?: Incident[];
  onSelectIncident?: (incident: Incident) => void;
  showLots?: boolean;
  showIncidents?: boolean;
}

// ─────────────────────────────────────────
// Incident type helpers (exported for page.tsx)
// ─────────────────────────────────────────
export const INCIDENT_COLORS: Record<Incident['type'], string> = {
  crime: '#8B5A5A',
  maintenance: '#b8942e',
  'road-closure': '#b8942e',
  'community-event': '#2C2C2E',
  hazard: '#B09B71',
  noise: '#8B5A5A',
  other: `rgba(245,240,232,0.35)`,
};

export const INCIDENT_ICONS: Record<Incident['type'], string> = {
  crime: '',
  maintenance: '',
  'road-closure': '',
  'community-event': '',
  hazard: '',
  noise: '',
  other: '',
};

export const INCIDENT_LABELS: Record<Incident['type'], string> = {
  crime: 'Crime',
  maintenance: 'Maintenance',
  'road-closure': 'Road Closure',
  'community-event': 'Community Event',
  hazard: 'Hazard',
  noise: 'Noise',
  other: 'Other',
};

// ─────────────────────────────────────────
// Dark map style matching luxury palette
// ─────────────────────────────────────────
const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d2d2d' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#6b6b6b' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d0d0d' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#2a2a2a' }] },
  { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#636363' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
];

// ─────────────────────────────────────────
// Lot marker color helpers
// ─────────────────────────────────────────
function markerColor(lot: LotData): string {
  if (lot.isDuesCurrent === null) return `rgba(245,240,232,0.35)`;
  return lot.isDuesCurrent ? '#2A5D4F' : '#8B5A5A';
}

function statusLabel(lot: LotData): string {
  if (lot.isDuesCurrent === null) return 'Unknown';
  return lot.isDuesCurrent ? ' Current' : ' Overdue';
}

// ─────────────────────────────────────────
// SVG circle marker for lots
// ─────────────────────────────────────────
function lotMarkerSVG(color: string, selected = false): string {
  const radius = selected ? 13 : 10;
  const glowOpacity = selected ? 0.5 : 0.35;
  const strokeColor = selected ? '#B09B71' : color;
  const strokeWidth = selected ? 4 : 3;

  return `
    <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <circle cx="18" cy="18" r="16" fill="${color}" fill-opacity="${glowOpacity * 0.6}" />
      <circle cx="18" cy="18" r="${radius}" fill="${color}" fill-opacity="0.92"
        stroke="${strokeColor}" stroke-width="${strokeWidth}"
        filter="url(#glow)"
      />
    </svg>
  `.trim();
}

// ─────────────────────────────────────────
// SVG triangle marker for incidents
// ─────────────────────────────────────────
function incidentMarkerSVG(incident: Incident): string {
  const color = INCIDENT_COLORS[incident.type];
  const isActive = incident.status === 'active';
  const opacity = isActive ? '0.92' : '0.55';

  return `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="iglow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      ${isActive ? `<circle cx="16" cy="16" r="15" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-opacity="0.4" stroke-width="1"/>` : ''}
      <polygon
        points="16,3 29,26 3,26"
        fill="${color}"
        fill-opacity="${opacity}"
        stroke="${color}"
        stroke-width="1.5"
        stroke-linejoin="round"
        filter="url(#iglow)"
      />
      <text x="16" y="20" text-anchor="middle" font-size="10" fill="white" font-family="sans-serif" font-weight="700">!</text>
    </svg>
  `.trim();
}

// ─────────────────────────────────────────
// Popup HTML for lots
// ─────────────────────────────────────────
function buildLotPopupHTML(lot: LotData, isBoard: boolean): string {
  const color = markerColor(lot);
  const status = statusLabel(lot);
  const statusBg =
    lot.isDuesCurrent === true ? 'rgba(34,197,94,0.15)' :
    lot.isDuesCurrent === false ? 'rgba(239,68,68,0.15)' : 'rgba(107,114,128,0.15)';
  const statusBorder =
    lot.isDuesCurrent === true ? 'rgba(34,197,94,0.4)' :
    lot.isDuesCurrent === false ? 'rgba(239,68,68,0.4)' : 'rgba(107,114,128,0.4)';

  const ownerRow = isBoard
    ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.07);">
        <div style="font-size:10px;color:rgba(245,240,232,0.35);text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px;">Owner</div>
        <div style="font-family:monospace;font-size:11px;color:rgba(245,240,232,0.45);word-break:break-all;">${escapeHtml(lot.owner)}</div>
       </div>`
    : `<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.07);">
        <div style="font-size:11px;color:rgba(245,240,232,0.30);font-style:italic;"> Owner visible to board only</div>
       </div>`;

  return `
    <div style="min-width:210px;max-width:250px;font-family:'Plus Jakarta Sans',sans-serif;color:#F5F0E8;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;">
        <div>
          <div style="font-size:10px;color:rgba(245,240,232,0.35);text-transform:uppercase;letter-spacing:.08em;">Lot</div>
          <div style="font-size:20px;font-weight:700;background:linear-gradient(135deg,#B09B71,#D4C4A0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">#${escapeHtml(String(lot.lotNumber))}</div>
        </div>
        <div style="padding:3px 8px;border-radius:999px;font-size:10px;font-weight:600;background:${statusBg};border:1px solid ${statusBorder};color:${color};white-space:nowrap;margin-top:2px;">${escapeHtml(status)}</div>
      </div>
      <div style="font-size:12px;color:rgba(245,240,232,0.75);font-weight:500;margin-bottom:4px;">${escapeHtml(lot.streetAddress)}</div>
      ${lot.sqft > 0 ? `<div style="font-size:11px;color:rgba(245,240,232,0.35);">${lot.sqft.toLocaleString()} sq ft</div>` : ''}
      ${ownerRow}
    </div>
  `;
}

// ─────────────────────────────────────────
// Popup HTML for incidents
// ─────────────────────────────────────────
function buildIncidentPopupHTML(incident: Incident): string {
  const color = INCIDENT_COLORS[incident.type];
  const icon = INCIDENT_ICONS[incident.type];
  const label = INCIDENT_LABELS[incident.type];
  const isActive = incident.status === 'active';
  const statusBg = isActive ? 'rgba(201,169,110,0.12)' : 'rgba(34,197,94,0.12)';
  const statusBorder = isActive ? 'rgba(201,169,110,0.35)' : 'rgba(34,197,94,0.35)';
  const statusColor = isActive ? '#B09B71' : '#2A5D4F';
  const statusText = isActive ? 'Active' : 'Resolved';

  const truncated = incident.description.length > 80
    ? incident.description.slice(0, 80) + '…'
    : incident.description;

  return `
    <div style="min-width:210px;max-width:260px;font-family:'Plus Jakarta Sans',sans-serif;color:#F5F0E8;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-size:16px;">${icon}</span>
        <div style="flex:1;min-width:0;">
          <div style="font-size:10px;color:rgba(245,240,232,0.35);text-transform:uppercase;letter-spacing:.08em;">${escapeHtml(label)}</div>
          <div style="font-size:13px;font-weight:700;color:#F5F0E8;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(incident.title)}</div>
        </div>
        <div style="padding:2px 7px;border-radius:999px;font-size:10px;font-weight:600;background:${statusBg};border:1px solid ${statusBorder};color:${statusColor};white-space:nowrap;flex-shrink:0;">${statusText}</div>
      </div>
      <div style="font-size:11px;color:rgba(245,240,232,0.45);margin-bottom:6px;">${escapeHtml(truncated)}</div>
      <div style="display:flex;align-items:center;gap:8px;font-size:10px;color:rgba(245,240,232,0.35);">
        <span> ${escapeHtml(incident.location)}</span>
        <span style="margin-left:auto;">${escapeHtml(incident.date)}</span>
      </div>
      <div style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.06);">
        <div style="width:100%;height:2px;border-radius:1px;background:linear-gradient(90deg,${color}60,transparent);"></div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────
// Google Maps loader (singleton)
// ─────────────────────────────────────────
declare global {
  interface Window {
    google: typeof google;
    _gmapsLoading?: Promise<void>;
  }
}

function loadGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.maps) return Promise.resolve();
  if (window._gmapsLoading) return window._gmapsLoading;

  window._gmapsLoading = new Promise<void>((resolve, reject) => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });

  return window._gmapsLoading;
}

// ─────────────────────────────────────────
// Inline InfoWindow popup styles (injected once)
// ─────────────────────────────────────────
let popupStylesInjected = false;
function injectPopupStyles() {
  if (popupStylesInjected || typeof document === 'undefined') return;
  popupStylesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    /* Google Maps InfoWindow — luxury dark theme */
    .gm-style .gm-style-iw-c {
      background: rgba(13,11,20,0.97) !important;
      border: 1px solid rgba(201,169,110,0.2) !important;
      border-radius: 14px !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) !important;
      padding: 0 !important;
      backdrop-filter: blur(16px);
    }
    .gm-style .gm-style-iw-d {
      overflow: hidden !important;
      padding: 14px 16px !important;
    }
    .gm-style .gm-style-iw-t::after {
      display: none !important;
    }
    .gm-style .gm-style-iw-tc {
      display: none !important;
    }
    .gm-ui-hover-effect {
      opacity: 0.6 !important;
      filter: invert(1) !important;
      top: 4px !important;
      right: 4px !important;
    }
    .gm-ui-hover-effect:hover {
      opacity: 1 !important;
    }
    /* Zoom controls */
    .gm-bundled-control .gmnoprint,
    .gm-bundled-control-on-bottom .gmnoprint {
      background: rgba(13,11,20,0.92) !important;
      border: 1px solid rgba(255,255,255,0.1) !important;
      border-radius: 10px !important;
      overflow: hidden;
    }
    .gm-control-active {
      background: rgba(13,11,20,0.92) !important;
      color: rgba(245,240,232,0.45) !important;
    }
    .gm-control-active:hover {
      background: rgba(201,169,110,0.12) !important;
    }
    /* Attribution */
    .gm-style-cc {
      opacity: 0.5;
    }
    a[href^="https://maps.google.com"],
    a[href^="https://www.google.com/maps"] {
      color: rgba(245,240,232,0.35) !important;
    }
  `;
  document.head.appendChild(style);
}

// ─────────────────────────────────────────
// Main component
// ─────────────────────────────────────────
export default function NeighborhoodMap({
  lots,
  selectedLot,
  isBoard,
  onSelectLot,
  incidents = [],
  onSelectIncident,
  showLots = true,
  showIncidents = true,
}: NeighborhoodMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const lotMarkersRef = useRef<Map<number, google.maps.Marker>>(new Map());
  const incidentMarkersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  // FE-02: mapReady triggers re-render of marker effects after async map init.
  // Without this, marker effects run once with mapRef.current=null and never re-run
  // because their deps (lots, incidents) haven't changed since the map loaded.
  const [mapReady, setMapReady] = useState(false);

  // ── Initialize map once ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (mapRef.current) return;

    injectPopupStyles();

    loadGoogleMaps().then(() => {
      if (mapRef.current || !containerRef.current) return;

      const map = new window.google.maps.Map(containerRef.current, {
        center: { lat: NEIGHBORHOOD_CENTER.lat, lng: NEIGHBORHOOD_CENTER.lng },
        zoom: DEFAULT_ZOOM,
        styles: DARK_MAP_STYLES,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        gestureHandling: 'greedy',
      });

      const infoWindow = new window.google.maps.InfoWindow({
        maxWidth: 280,
      });

      mapRef.current = map;
      infoWindowRef.current = infoWindow;
      // FE-02: signal that the map is ready so marker effects can run
      setMapReady(true);
    });

    return () => {
      // Cleanup markers on unmount
      lotMarkersRef.current.forEach((m) => m.setMap(null));
      incidentMarkersRef.current.forEach((m) => m.setMap(null));
      lotMarkersRef.current.clear();
      incidentMarkersRef.current.clear();
      // Note: Google Maps doesn't expose a map.destroy() — we just null the ref
      mapRef.current = null;
      infoWindowRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Update lot markers ──
  // FE-02: mapReady in deps ensures this runs once the async map init completes,
  // even if lots/isBoard/showLots haven't changed since component mount.
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || typeof window === 'undefined' || !window.google?.maps) return;

    // Remove stale markers
    const currentIds = new Set(lots.map((l) => l.tokenId));
    lotMarkersRef.current.forEach((marker, tokenId) => {
      if (!currentIds.has(tokenId) || !showLots) {
        marker.setMap(null);
        lotMarkersRef.current.delete(tokenId);
      }
    });

    if (!showLots) return;

    // Resolve all lot coordinates in parallel through the full geocoding stack
    // (static lookup → session cache → /api/geocode → grid fallback). The async
    // util never throws — any upstream failure collapses to the grid fallback
    // so the map always renders. We guard against setting state after unmount
    // with a local `cancelled` flag; if the effect re-fires mid-flight we drop
    // the stale results on the floor.
    let cancelled = false;

    (async () => {
      const coords = await Promise.all(
        lots.map((lot, i) =>
          geocodeAddressAsync(lot.streetAddress, i, lots.length),
        ),
      );
      if (cancelled) return;

      lots.forEach((lot, i) => {
        const { lat, lng } = coords[i];
        const isSelected = selectedLot?.tokenId === lot.tokenId;
        const color = markerColor(lot);
        const svg = lotMarkerSVG(color, isSelected);

        const existing = lotMarkersRef.current.get(lot.tokenId);
        if (existing) {
          // Update icon if selection changed
          existing.setIcon({
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
            scaledSize: new window.google.maps.Size(36, 36),
            anchor: new window.google.maps.Point(18, 18),
          });
          existing.setPosition({ lat, lng });
          return;
        }

        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map,
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
            scaledSize: new window.google.maps.Size(36, 36),
            anchor: new window.google.maps.Point(18, 18),
          },
          title: `Lot #${lot.lotNumber}`,
          cursor: 'pointer',
          zIndex: isSelected ? 100 : 10,
        });

        marker.addListener('click', () => {
          if (!infoWindowRef.current) return;
          infoWindowRef.current.setContent(buildLotPopupHTML(lot, isBoard));
          infoWindowRef.current.open(map, marker);
          onSelectLot(lot);
        });

        marker.addListener('mouseover', () => {
          const hoveredSvg = lotMarkerSVG(color, true);
          marker.setIcon({
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(hoveredSvg)}`,
            scaledSize: new window.google.maps.Size(40, 40),
            anchor: new window.google.maps.Point(20, 20),
          });
        });

        marker.addListener('mouseout', () => {
          const sel = selectedLot?.tokenId === lot.tokenId;
          const normalSvg = lotMarkerSVG(color, sel);
          marker.setIcon({
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(normalSvg)}`,
            scaledSize: new window.google.maps.Size(36, 36),
            anchor: new window.google.maps.Point(18, 18),
          });
        });

        lotMarkersRef.current.set(lot.tokenId, marker);
      });
    })();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lots, isBoard, showLots, mapReady]);

  // ── Update incident markers ──
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || typeof window === 'undefined' || !window.google?.maps) return;

    // Remove all and re-render
    incidentMarkersRef.current.forEach((m) => m.setMap(null));
    incidentMarkersRef.current.clear();

    if (!showIncidents) return;

    incidents.forEach((incident) => {
      const svg = incidentMarkerSVG(incident);

      const marker = new window.google.maps.Marker({
        position: { lat: incident.lat, lng: incident.lng },
        map,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 26),
        },
        title: incident.title,
        cursor: 'pointer',
        zIndex: 20,
      });

      marker.addListener('click', () => {
        if (!infoWindowRef.current) return;
        infoWindowRef.current.setContent(buildIncidentPopupHTML(incident));
        infoWindowRef.current.open(map, marker);
        if (onSelectIncident) onSelectIncident(incident);
      });

      incidentMarkersRef.current.set(incident.id, marker);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidents, showIncidents, mapReady]);

  // ── Highlight selected lot ──
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || typeof window === 'undefined' || !window.google?.maps) return;

    lotMarkersRef.current.forEach((marker, tokenId) => {
      const lot = lots.find((l) => l.tokenId === tokenId);
      if (!lot) return;
      const isSelected = selectedLot?.tokenId === tokenId;
      const color = markerColor(lot);
      const svg = lotMarkerSVG(color, isSelected);

      marker.setIcon({
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
        scaledSize: new window.google.maps.Size(isSelected ? 40 : 36, isSelected ? 40 : 36),
        anchor: new window.google.maps.Point(isSelected ? 20 : 18, isSelected ? 20 : 18),
      });
      marker.setZIndex(isSelected ? 100 : 10);

      if (isSelected) {
        // Pan to the marker's own position — this is the coordinate resolved
        // by the render effect above (static / session-cache / API / fallback)
        // and mirrored into marker.setPosition(), so it's always current.
        // No need to re-run geocoding here.
        const position = marker.getPosition();
        if (position) {
          map.panTo(position);
        }
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(buildLotPopupHTML(lot, isBoard));
          infoWindowRef.current.open(map, marker);
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLot, lots, mapReady]);

  return (
    <div
      ref={containerRef}
      style={{ minHeight: 520, width: '100%', borderRadius: '16px', overflow: 'hidden' }}
      className="border border-[rgba(245,240,232,0.08)]"
      aria-label="Neighborhood property and incident map"
    />
  );
}
