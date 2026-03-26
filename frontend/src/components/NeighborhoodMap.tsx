'use client';

import { useEffect, useRef } from 'react';
import type { Map as LeafletMap, CircleMarker } from 'leaflet';
import type { LotData } from '@/hooks/useNeighborhoodMap';
import { geocodeAddress, NEIGHBORHOOD_CENTER, DEFAULT_ZOOM } from '@/utils/geocoding';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────
interface NeighborhoodMapProps {
  lots: LotData[];
  selectedLot: LotData | null;
  isBoard: boolean;
  onSelectLot: (lot: LotData) => void;
}

// ─────────────────────────────────────────
// Marker color helpers
// ─────────────────────────────────────────
function markerColor(lot: LotData): string {
  if (lot.isDuesCurrent === null) return '#6b7280'; // gray-500
  return lot.isDuesCurrent ? '#22c55e' : '#ef4444';  // green-500 / red-500
}

function markerGlowColor(lot: LotData): string {
  if (lot.isDuesCurrent === null) return 'rgba(107, 114, 128, 0.35)';
  return lot.isDuesCurrent
    ? 'rgba(34, 197, 94, 0.35)'
    : 'rgba(239, 68, 68, 0.35)';
}

function statusLabel(lot: LotData): string {
  if (lot.isDuesCurrent === null) return 'Unknown';
  return lot.isDuesCurrent ? '✓ Current' : '✗ Overdue';
}

// ─────────────────────────────────────────
// Custom popup HTML
// ─────────────────────────────────────────
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
        <div style="font-size:11px;color:#4b5563;font-style:italic;">🔒 Owner visible to board only</div>
       </div>`;

  return `
    <div style="
      min-width:200px;
      font-family:'Plus Jakarta Sans',sans-serif;
      color:#e5e7eb;
    ">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;">
        <div>
          <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;">Lot</div>
          <div style="font-size:20px;font-weight:700;background:linear-gradient(135deg,#c9a96e,#e8d5a3);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
            #${lot.lotNumber}
          </div>
        </div>
        <div style="
          padding:3px 8px;
          border-radius:999px;
          font-size:10px;
          font-weight:600;
          background:${statusBg};
          border:1px solid ${statusBorder};
          color:${color};
          white-space:nowrap;
        ">${status}</div>
      </div>

      <div style="font-size:12px;color:#d1d5db;font-weight:500;margin-bottom:4px;">
        ${lot.streetAddress}
      </div>

      ${lot.sqft > 0
        ? `<div style="font-size:11px;color:#6b7280;">${lot.sqft.toLocaleString()} sq ft</div>`
        : ''
      }

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
}: NeighborhoodMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<number, CircleMarker>>(new Map());

  // ── Initialize map (once) ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (mapRef.current) return;
    if (!containerRef.current) return;

    injectLeafletCSS();

    // Dynamic import to avoid SSR issues
    import('leaflet').then((L) => {
      if (mapRef.current || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: [NEIGHBORHOOD_CENTER.lat, NEIGHBORHOOD_CENTER.lng],
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
        attributionControl: true,
      });

      // ── Dark tile layer (CartoDB Dark Matter) ──
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20,
        }
      ).addTo(map);

      // Style the attribution control to match dark theme
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
      }
    };
  }, []);

  // ── Update markers when lots change ──
  useEffect(() => {
    if (!mapRef.current) return;
    if (typeof window === 'undefined') return;

    import('leaflet').then((L) => {
      const map = mapRef.current;
      if (!map) return;

      // Remove old markers that are no longer in the list
      const currentIds = new Set(lots.map((l) => l.tokenId));
      markersRef.current.forEach((marker, tokenId) => {
        if (!currentIds.has(tokenId)) {
          marker.remove();
          markersRef.current.delete(tokenId);
        }
      });

      // Add/update markers
      lots.forEach((lot, i) => {
        const { lat, lng } = geocodeAddress(lot.streetAddress, i, lots.length);
        const color = markerColor(lot);
        const glowColor = markerGlowColor(lot);

        const existing = markersRef.current.get(lot.tokenId);
        if (existing) {
          existing.setLatLng([lat, lng]);
          existing.setStyle({
            color,
            fillColor: color,
          });
          existing.setPopupContent(buildPopupHTML(lot, isBoard));
          return;
        }

        // Custom circle marker with glow ring
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

        marker.on('click', () => {
          onSelectLot(lot);
        });

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
  }, [lots, isBoard, onSelectLot]);

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
      {/* Leaflet popup custom styles */}
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
        aria-label="Neighborhood property map"
      />
    </>
  );
}
