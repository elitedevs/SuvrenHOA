'use client';

import { useEffect, useRef } from 'react';
import type { Map as LeafletMap, CircleMarker, Marker } from 'leaflet';
import type { LotData } from '@/hooks/useNeighborhoodMap';
import type { Incident } from '@/hooks/useIncidents';
import { geocodeAddress, NEIGHBORHOOD_CENTER, DEFAULT_ZOOM } from '@/utils/geocoding';

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
// Incident type helpers
// ─────────────────────────────────────────
export const INCIDENT_COLORS: Record<Incident['type'], string> = {
  crime: '#6B3A3A',
  maintenance: '#B09B71',
  'road-closure': '#B09B71',
  'community-event': '#6B7B90',
  hazard: '#eab308',
  noise: '#8b5cf6',
  other: '#6b7280',
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

function incidentDivIcon(L: typeof import('leaflet'), incident: Incident) {
  const color = INCIDENT_COLORS[incident.type];
  const isActive = incident.status === 'active';
  const pulseStyle = isActive
    ? `animation: incidentPulse 2s infinite; box-shadow: 0 0 0 0 ${color}80;`
    : '';

  const svg = `
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow-${incident.id}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      ${isActive
        ? `<circle cx="14" cy="14" r="13" fill="${color}22" stroke="${color}60" stroke-width="1"/>`
        : ''
      }
      <polygon
        points="14,3 25,22 3,22"
        fill="${color}"
        fill-opacity="${isActive ? '0.92' : '0.55'}"
        stroke="${color}"
        stroke-width="1.5"
        stroke-linejoin="round"
        filter="url(#glow-${incident.id})"
      />
      <text x="14" y="17.5" text-anchor="middle" font-size="9" fill="white" font-family="sans-serif" font-weight="700">!</text>
    </svg>
  `;

  return L.divIcon({
    html: `<div style="width:28px;height:28px;${pulseStyle}">${svg}</div>`,
    className: 'incident-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 22],
    popupAnchor: [0, -24],
  });
}

function buildIncidentPopupHTML(incident: Incident): string {
  const color = INCIDENT_COLORS[incident.type];
  const icon = INCIDENT_ICONS[incident.type];
  const label = INCIDENT_LABELS[incident.type];
  const isActive = incident.status === 'active';
  const statusBg = isActive ? 'rgba(201,169,110,0.12)' : 'rgba(34,197,94,0.12)';
  const statusBorder = isActive ? 'rgba(201,169,110,0.35)' : 'rgba(34,197,94,0.35)';
  const statusColor = isActive ? '#c9a96e' : '#2A5D4F';
  const statusText = isActive ? 'Active' : 'Resolved';

  const truncated = incident.description.length > 80
    ? incident.description.slice(0, 80) + '…'
    : incident.description;

  return `
    <div style="min-width:210px;font-family:'Plus Jakarta Sans',sans-serif;color:#e5e7eb;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-size:16px;">${icon}</span>
        <div>
          <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;">${label}</div>
          <div style="font-size:14px;font-weight:700;color:#e5e7eb;line-height:1.2;">${incident.title}</div>
        </div>
        <div style="margin-left:auto;padding:2px 7px;border-radius:999px;font-size:10px;font-weight:600;background:${statusBg};border:1px solid ${statusBorder};color:${statusColor};white-space:nowrap;">${statusText}</div>
      </div>
      <div style="font-size:11px;color:#9ca3af;margin-bottom:6px;">${truncated}</div>
      <div style="display:flex;align-items:center;gap:8px;font-size:10px;color:#6b7280;">
        <span> ${incident.location}</span>
        <span style="margin-left:auto;">${incident.date}</span>
      </div>
      <div style="margin-top:8px;padding-top:7px;border-top:1px solid rgba(255,255,255,0.06);">
        <div style="width:100%;height:2px;border-radius:1px;background:linear-gradient(90deg,${color}60,transparent);"></div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────
// Lot marker color helpers
// ─────────────────────────────────────────
function markerColor(lot: LotData): string {
  if (lot.isDuesCurrent === null) return '#6b7280';
  return lot.isDuesCurrent ? '#2A5D4F' : '#6B3A3A';
}

function markerGlowColor(lot: LotData): string {
  if (lot.isDuesCurrent === null) return 'rgba(107, 114, 128, 0.35)';
  return lot.isDuesCurrent
    ? 'rgba(34, 197, 94, 0.35)'
    : 'rgba(239, 68, 68, 0.35)';
}

function statusLabel(lot: LotData): string {
  if (lot.isDuesCurrent === null) return 'Unknown';
  return lot.isDuesCurrent ? ' Current' : ' Overdue';
}

function buildPopupHTML(lot: LotData, isBoard: boolean): string {
  const color = markerColor(lot);
  const status = statusLabel(lot);
  const statusBg =
    lot.isDuesCurrent === true
      ? 'rgba(34,197,94,0.15)'
      : lot.isDuesCurrent === false
      ? 'rgba(239,68,68,0.15)'
      : 'rgba(107,114,128,0.15)';
  const statusBorder =
    lot.isDuesCurrent === true
      ? 'rgba(34,197,94,0.4)'
      : lot.isDuesCurrent === false
      ? 'rgba(239,68,68,0.4)'
      : 'rgba(107,114,128,0.4)';

  const ownerRow = isBoard
    ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.06);">
        <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px;">Owner</div>
        <div style="font-family:monospace;font-size:11px;color:#9ca3af;word-break:break-all;">${lot.owner}</div>
       </div>`
    : `<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.06);">
        <div style="font-size:11px;color:#4b5563;font-style:italic;"> Owner visible to board only</div>
       </div>`;

  return `
    <div style="min-width:200px;font-family:'Plus Jakarta Sans',sans-serif;color:#e5e7eb;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;">
        <div>
          <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;">Lot</div>
          <div style="font-size:20px;font-weight:700;background:linear-gradient(135deg,#B09B71,#C4B08A);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
            #${lot.lotNumber}
          </div>
        </div>
        <div style="padding:3px 8px;border-radius:999px;font-size:10px;font-weight:600;background:${statusBg};border:1px solid ${statusBorder};color:${color};white-space:nowrap;">${status}</div>
      </div>
      <div style="font-size:12px;color:#d1d5db;font-weight:500;margin-bottom:4px;">${lot.streetAddress}</div>
      ${lot.sqft > 0 ? `<div style="font-size:11px;color:#6b7280;">${lot.sqft.toLocaleString()} sq ft</div>` : ''}
      ${ownerRow}
    </div>
  `;
}

// ─────────────────────────────────────────
// Leaflet CSS injection (once)
// ─────────────────────────────────────────
let cssInjected = false;
function injectLeafletCSS() {
  if (cssInjected || typeof document === 'undefined') return;
  cssInjected = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
  link.crossOrigin = '';
  document.head.appendChild(link);
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
  const mapRef = useRef<LeafletMap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<number, CircleMarker>>(new Map());
  const incidentMarkersRef = useRef<Map<string, Marker>>(new Map());

  // ── Initialize map (once) ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (mapRef.current) return;
    if (!containerRef.current) return;

    injectLeafletCSS();

    import('leaflet').then((L) => {
      if (mapRef.current || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: [NEIGHBORHOOD_CENTER.lat, NEIGHBORHOOD_CENTER.lng],
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20,
        }
      ).addTo(map);

      const attrControl = map.attributionControl.getContainer();
      if (attrControl) {
        attrControl.style.background = 'rgba(10,10,15,0.85)';
        attrControl.style.color = '#6b7280';
        attrControl.style.border = '1px solid rgba(255,255,255,0.06)';
        attrControl.style.borderRadius = '8px';
        attrControl.style.fontSize = '10px';
      }

      mapRef.current = map;
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current.clear();
        incidentMarkersRef.current.clear();
      }
    };
  }, []);

  // ── Update property lot markers ──
  useEffect(() => {
    if (!mapRef.current) return;
    if (typeof window === 'undefined') return;

    import('leaflet').then((L) => {
      const map = mapRef.current;
      if (!map) return;

      // Remove markers not in list or when hidden
      const currentIds = new Set(lots.map((l) => l.tokenId));
      markersRef.current.forEach((marker, tokenId) => {
        if (!currentIds.has(tokenId) || !showLots) {
          marker.remove();
          markersRef.current.delete(tokenId);
        }
      });

      if (!showLots) return;

      lots.forEach((lot, i) => {
        const { lat, lng } = geocodeAddress(lot.streetAddress, i, lots.length);
        const color = markerColor(lot);
        const glowColor = markerGlowColor(lot);

        const existing = markersRef.current.get(lot.tokenId);
        if (existing) {
          existing.setLatLng([lat, lng]);
          existing.setStyle({ color, fillColor: color });
          existing.setPopupContent(buildPopupHTML(lot, isBoard));
          return;
        }

        const marker = L.circleMarker([lat, lng], {
          radius: 10,
          fillColor: color,
          color: glowColor,
          weight: 6,
          opacity: 0.85,
          fillOpacity: 0.92,
          className: 'faircroft-marker',
        });

        const popup = L.popup({
          className: 'faircroft-popup',
          maxWidth: 260,
          closeButton: true,
          autoPan: true,
        }).setContent(buildPopupHTML(lot, isBoard));

        marker.bindPopup(popup);
        marker.on('click', () => onSelectLot(lot));
        marker.on('mouseover', function (this: CircleMarker) {
          this.setStyle({ radius: 13, weight: 8 } as never);
        });
        marker.on('mouseout', function (this: CircleMarker) {
          this.setStyle({ radius: 10, weight: 6 } as never);
        });

        marker.addTo(map);
        markersRef.current.set(lot.tokenId, marker);
      });
    });
  }, [lots, isBoard, onSelectLot, showLots]);

  // ── Update incident markers ──
  useEffect(() => {
    if (!mapRef.current) return;
    if (typeof window === 'undefined') return;

    import('leaflet').then((L) => {
      const map = mapRef.current;
      if (!map) return;

      // Remove all incident markers first (re-render on each update)
      incidentMarkersRef.current.forEach((marker) => marker.remove());
      incidentMarkersRef.current.clear();

      if (!showIncidents) return;

      incidents.forEach((incident) => {
        const icon = incidentDivIcon(L, incident);

        const marker = L.marker([incident.lat, incident.lng], { icon });

        const popup = L.popup({
          className: 'faircroft-popup',
          maxWidth: 280,
          closeButton: true,
          autoPan: true,
        }).setContent(buildIncidentPopupHTML(incident));

        marker.bindPopup(popup);
        marker.on('click', () => {
          if (onSelectIncident) onSelectIncident(incident);
        });

        marker.addTo(map);
        incidentMarkersRef.current.set(incident.id, marker);
      });
    });
  }, [incidents, showIncidents, onSelectIncident]);

  // ── Highlight selected lot ──
  useEffect(() => {
    if (!mapRef.current) return;
    import('leaflet').then(() => {
      markersRef.current.forEach((marker, tokenId) => {
        const lot = lots.find((l) => l.tokenId === tokenId);
        if (!lot) return;
        const isSelected = selectedLot?.tokenId === tokenId;
        const color = markerColor(lot);
        marker.setStyle({
          radius: isSelected ? 14 : 10,
          weight: isSelected ? 10 : 6,
          color: isSelected ? '#c9a96e' : markerGlowColor(lot),
          fillColor: color,
        } as never);

        if (isSelected) {
          marker.openPopup();
          const { lat, lng } = geocodeAddress(lot.streetAddress, lots.indexOf(lot), lots.length);
          mapRef.current?.panTo([lat, lng], { animate: true });
        }
      });
    });
  }, [selectedLot, lots]);

  return (
    <>
      <style>{`
        .faircroft-popup .leaflet-popup-content-wrapper {
          background: rgba(13, 11, 20, 0.96);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(201, 169, 110, 0.18);
          border-radius: 14px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
          padding: 0;
        }
        .faircroft-popup .leaflet-popup-content {
          margin: 14px 16px;
          color: #e5e7eb;
        }
        .faircroft-popup .leaflet-popup-tip-container {
          display: none;
        }
        .faircroft-popup .leaflet-popup-close-button {
          color: #6b7280 !important;
          font-size: 16px !important;
          top: 6px !important;
          right: 8px !important;
          padding: 0 !important;
          width: 20px !important;
          height: 20px !important;
        }
        .faircroft-popup .leaflet-popup-close-button:hover {
          color: #c9a96e !important;
          background: none !important;
        }
        .faircroft-marker {
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .incident-marker {
          cursor: pointer;
          background: transparent !important;
          border: none !important;
        }
        @keyframes incidentPulse {
          0% { box-shadow: 0 0 0 0 currentColor; }
          70% { box-shadow: 0 0 0 8px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
        .leaflet-control-zoom {
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 10px !important;
          overflow: hidden;
        }
        .leaflet-control-zoom a {
          background: rgba(13,11,20,0.9) !important;
          color: #9ca3af !important;
          border-bottom: 1px solid rgba(255,255,255,0.06) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(201,169,110,0.12) !important;
          color: #c9a96e !important;
        }
        .leaflet-control-attribution a {
          color: #6b7280 !important;
        }
        .leaflet-control-attribution a:hover {
          color: #c9a96e !important;
        }
      `}</style>

      <div
        ref={containerRef}
        style={{ minHeight: 520, width: '100%', borderRadius: '16px', overflow: 'hidden' }}
        className="border border-white/[0.08]"
        aria-label="Neighborhood property and incident map"
      />
    </>
  );
}
