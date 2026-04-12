'use client';

import { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useAccount } from 'wagmi';
import { useNeighborhoodMap, LotData } from '@/hooks/useNeighborhoodMap';
import { useIncidents, Incident } from '@/hooks/useIncidents';
import {
  INCIDENT_COLORS,
  INCIDENT_ICONS,
  INCIDENT_LABELS,
} from '@/components/NeighborhoodMap';
import { geocodeAddress, NEIGHBORHOOD_CENTER } from '@/utils/geocoding';

// ─────────────────────────────────────────
// Dynamic import of map (no SSR — Leaflet requires window)
// ─────────────────────────────────────────
const NeighborhoodMap = dynamic(() => import('@/components/NeighborhoodMap'), {
  ssr: false,
  loading: () => (
    <div
      className="w-full flex items-center justify-center border border-[rgba(245,240,232,0.08)] rounded-xl bg-[rgba(245,240,232,0.02)]"
      style={{ minHeight: 520 }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[rgba(176,155,113,0.40)] border-t-[#B09B71] animate-spin" />
        <span className="text-sm text-[var(--text-disabled)]">Loading map…</span>
      </div>
    </div>
  ),
});

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────
type StatusFilter = 'all' | 'current' | 'overdue';
type ViewMode = 'map' | 'grid';
type LayerMode = 'both' | 'properties' | 'incidents';

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────
function statusColor(lot: LotData) {
  if (lot.isDuesCurrent === null) return 'gray';
  return lot.isDuesCurrent ? 'green' : 'red';
}

function statusLabel(lot: LotData) {
  if (lot.isDuesCurrent === null) return 'Unknown';
  return lot.isDuesCurrent ? 'Current' : 'Overdue';
}

// ─────────────────────────────────────────
// Lot Card
// ─────────────────────────────────────────
function LotCard({ lot, isSelected, onClick }: { lot: LotData; isSelected: boolean; onClick: () => void }) {
  const color = statusColor(lot);
  const borderClass =
    color === 'green' ? 'border-l-[#2A5D4F]' : color === 'red' ? 'border-l-[#8B5A5A]' : 'border-l-[rgba(245,240,232,0.10)]';
  const badgeClass =
    color === 'green'
      ? 'bg-[rgba(42,93,79,0.15)] text-[#2A5D4F] border border-[rgba(42,93,79,0.25)]'
      : color === 'red'
      ? 'bg-[rgba(107,58,58,0.12)] text-[#8B5A5A] border border-[rgba(107,58,58,0.25)]'
      : 'bg-[rgba(245,240,232,0.06)] text-[var(--text-muted)] border border-[rgba(245,240,232,0.10)]';

  return (
    <button
      onClick={onClick}
      className={[
        'relative glass-card rounded-xl hover-lift p-4 text-left cursor-pointer border-l-4',
        borderClass,
        isSelected ? 'ring-2 ring-[rgba(176,155,113,0.50)] bg-[rgba(176,155,113,0.05)]' : 'hover:bg-[rgba(245,240,232,0.06)]',
        'hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-[rgba(176,155,113,0.50)] w-full',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span className="text-[11px] text-[var(--text-disabled)] uppercase tracking-wider font-medium">Lot</span>
          <div className="text-xl font-medium gradient-text leading-none">{'#' + lot.lotNumber}</div>
        </div>
        <span className={'text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 mt-1 ' + badgeClass}>
          {statusLabel(lot)}
        </span>
      </div>
      <div className="text-[12px] text-[var(--text-body)] font-medium truncate">{lot.streetAddress}</div>
      {lot.sqft > 0 && <div className="text-[11px] text-[var(--text-disabled)] mt-1">{lot.sqft.toLocaleString()} sq ft</div>}
    </button>
  );
}

// ─────────────────────────────────────────
// Detail Panel (Lot)
// ─────────────────────────────────────────
function LotDetailPanel({ lot, isBoard, onClose }: { lot: LotData; isBoard: boolean; onClose: () => void }) {
  const color = statusColor(lot);
  const statusBadgeClass =
    color === 'green'
      ? 'bg-[rgba(42,93,79,0.15)] text-[#2A5D4F] border border-[rgba(42,93,79,0.30)]'
      : color === 'red'
      ? 'bg-[rgba(107,58,58,0.15)] text-[#8B5A5A] border border-[rgba(107,58,58,0.30)]'
      : 'bg-[rgba(245,240,232,0.08)] text-[var(--text-body)] border border-[rgba(245,240,232,0.12)]';
  const dotClass =
    color === 'green' ? 'bg-[#2A5D4F] animate-pulse' : color === 'red' ? 'bg-[#8B5A5A] animate-pulse' : 'bg-[var(--text-muted)]';

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} aria-hidden="true" />
      <div
        className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 glass border-l border-[rgba(176,155,113,0.15)] flex flex-col overflow-y-auto"
        role="dialog"
        aria-label={'Lot #' + lot.lotNumber + ' details'}
      >
        <div className="flex items-center justify-between p-6 border-b border-[rgba(245,240,232,0.06)]">
          <div>
            <p className="text-[11px] text-[var(--text-disabled)] uppercase tracking-wider font-medium">Property Detail</p>
            <h2 className="text-2xl font-medium gradient-text">{'Lot #' + lot.lotNumber}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-[rgba(245,240,232,0.05)] hover:bg-[rgba(245,240,232,0.10)] text-[var(--text-muted)] hover:text-[var(--text-heading)] flex items-center justify-center transition-all"
          ></button>
        </div>
        <div className="p-6 space-y-5">
          <div className={'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ' + statusBadgeClass}>
            <span className={'w-2 h-2 rounded-full ' + dotClass} />
            {'Dues ' + statusLabel(lot)}
          </div>
          <div className="glass-card rounded-xl hover-lift p-4 space-y-3">
            <h3 className="text-[11px] text-[var(--text-disabled)] uppercase tracking-wider font-medium">Location</h3>
            <p className="text-[var(--parchment)] font-medium">{lot.streetAddress}</p>
            {lot.sqft > 0 && <p className="text-[var(--text-muted)] text-sm">{lot.sqft.toLocaleString() + ' sq ft'}</p>}
          </div>
          <div className="glass-card rounded-xl hover-lift p-4 space-y-3">
            <h3 className="text-[11px] text-[var(--text-disabled)] uppercase tracking-wider font-medium">NFT Details</h3>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-disabled)]">Token ID</span>
              <span className="text-[var(--parchment)] font-mono">{'#' + lot.tokenId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-disabled)]">Lot Number</span>
              <span className="text-[var(--parchment)] font-mono">{'#' + lot.lotNumber}</span>
            </div>
          </div>
          {isBoard ? (
            <div className="glass-card rounded-xl hover-lift p-4 space-y-3">
              <h3 className="text-[11px] text-[var(--text-disabled)] uppercase tracking-wider font-medium">Owner</h3>
              <p className="text-[var(--parchment)] font-mono text-sm break-all">{lot.owner}</p>
            </div>
          ) : (
            <div className="glass-card rounded-xl hover-lift p-4">
              <p className="text-[var(--text-disabled)] text-sm italic"> Owner details visible to board members only</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────
// Detail Panel (Incident)
// ─────────────────────────────────────────
function IncidentDetailPanel({
  incident,
  onClose,
  onResolve,
}: {
  incident: Incident;
  onClose: () => void;
  onResolve: (id: string) => void;
}) {
  const color = INCIDENT_COLORS[incident.type];
  const icon = INCIDENT_ICONS[incident.type];
  const label = INCIDENT_LABELS[incident.type];
  const isActive = incident.status === 'active';

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} aria-hidden="true" />
      <div
        className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 glass border-l border-[rgba(176,155,113,0.15)] flex flex-col overflow-y-auto"
        role="dialog"
        aria-label={'Incident: ' + incident.title}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[rgba(245,240,232,0.06)]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
              style={{ background: color + '20', border: `1px solid ${color}40` }}
            >
              {icon}
            </div>
            <div>
              <p className="text-[11px] text-[var(--text-disabled)] uppercase tracking-wider font-medium">{label}</p>
              <h2 className="text-lg font-medium text-[var(--parchment)] leading-tight">{incident.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-[rgba(245,240,232,0.05)] hover:bg-[rgba(245,240,232,0.10)] text-[var(--text-muted)] hover:text-[var(--text-heading)] flex items-center justify-center transition-all"
          ></button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 flex-1">
          {/* Status */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{
              background: isActive ? 'rgba(201,169,110,0.1)' : 'rgba(42,93,79,0.10)',
              border: `1px solid ${isActive ? 'rgba(201,169,110,0.3)' : 'rgba(34,197,94,0.3)'}`,
              color: isActive ? '#B09B71' : '#2A5D4F',
            }}
          >
            <span className={`w-2 h-2 rounded-full ${isActive ? 'animate-pulse' : ''}`} style={{ background: isActive ? '#B09B71' : '#2A5D4F' }} />
            {isActive ? 'Active' : 'Resolved'}
          </div>

          {/* Description */}
          <div className="glass-card rounded-xl hover-lift p-4 space-y-2">
            <h3 className="text-[11px] text-[var(--text-disabled)] uppercase tracking-wider font-medium">Description</h3>
            <p className="text-[var(--parchment)] text-sm leading-relaxed">{incident.description}</p>
          </div>

          {/* Details grid */}
          <div className="glass-card rounded-xl hover-lift p-4 space-y-3">
            <h3 className="text-[11px] text-[var(--text-disabled)] uppercase tracking-wider font-medium">Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-disabled)]">Location</span>
                <span className="text-[var(--parchment)]"> {incident.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-disabled)]">Date</span>
                <span className="text-[var(--parchment)]">{incident.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-disabled)]">Reported by</span>
                <span className="text-[var(--parchment)] font-mono text-xs">
                  {incident.anonymous ? 'Anonymous' : incident.reportedBy}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-disabled)]">Submitted</span>
                <span className="text-[var(--parchment)]">{new Date(incident.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer — resolve action */}
        {isActive && (
          <div className="p-6 border-t border-[rgba(245,240,232,0.06)]">
            <button
              onClick={() => { onResolve(incident.id); onClose(); }}
              className="w-full py-3 rounded-xl text-sm font-medium transition-all bg-[rgba(42,93,79,0.15)] border border-[rgba(42,93,79,0.25)] text-[#2A5D4F] hover:bg-[rgba(42,93,79,0.25)] hover:border-[rgba(42,93,79,0.50)]"
            >
               Mark as Resolved
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────
// Report Incident Modal
// ─────────────────────────────────────────
const INCIDENT_TYPES: { type: Incident['type']; label: string; icon: string }[] = [
  { type: 'crime', label: 'Crime', icon: '' },
  { type: 'maintenance', label: 'Maintenance', icon: '' },
  { type: 'road-closure', label: 'Road Closure', icon: '' },
  { type: 'community-event', label: 'Community Event', icon: '' },
  { type: 'hazard', label: 'Hazard', icon: '' },
  { type: 'noise', label: 'Noise', icon: '' },
  { type: 'other', label: 'Other', icon: '' },
];

function ReportIncidentModal({
  onClose,
  onSubmit,
  walletAddress,
}: {
  onClose: () => void;
  onSubmit: (data: Omit<Incident, 'id' | 'createdAt' | 'status'>) => void;
  walletAddress: string;
}) {
  const today = new Date().toISOString().split('T')[0];
  const [type, setType] = useState<Incident['type']>('maintenance');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(today);
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim() || !description.trim()) return;

    setSubmitting(true);

    // Try to geocode the location; fall back to neighborhood center + small random offset
    const coords = geocodeAddress(location, Math.floor(Math.random() * 16), 16);
    const isExact = coords.lat !== NEIGHBORHOOD_CENTER.lat && coords.lng !== NEIGHBORHOOD_CENTER.lng;
    const lat = isExact ? coords.lat : NEIGHBORHOOD_CENTER.lat + (Math.random() - 0.5) * 0.003;
    const lng = isExact ? coords.lng : NEIGHBORHOOD_CENTER.lng + (Math.random() - 0.5) * 0.004;

    onSubmit({
      type,
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      lat,
      lng,
      date,
      reportedBy: walletAddress || '0x0000',
      anonymous,
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} aria-hidden="true" />
      <div
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto z-50 glass border border-[rgba(245,240,232,0.10)] rounded-xl overflow-hidden max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-label="Report Incident"
      >
        <div className="flex items-center justify-between p-6 border-b border-[rgba(245,240,232,0.06)]">
          <div>
            <p className="text-[11px] text-[var(--text-disabled)] uppercase tracking-wider font-medium">Community Report</p>
            <h2 className="text-xl font-medium gradient-text">Report Incident</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-[rgba(245,240,232,0.05)] hover:bg-[rgba(245,240,232,0.10)] text-[var(--text-muted)] hover:text-[var(--text-heading)] flex items-center justify-center transition-all"
          ></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Type selector */}
          <div>
            <label className="block text-[11px] text-[var(--text-disabled)] uppercase tracking-wider font-medium mb-3">
              Incident Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {INCIDENT_TYPES.map(({ type: t, label, icon }) => {
                const color = INCIDENT_COLORS[t];
                const isSelected = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all duration-150"
                    style={{
                      background: isSelected ? color + '18' : 'rgba(255,255,255,0.02)',
                      borderColor: isSelected ? color + '60' : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <span className="text-xl">{icon}</span>
                    <span className="text-[10px] font-medium text-center leading-tight" style={{ color: isSelected ? color : `rgba(245,240,232,0.35)` }}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] text-[var(--text-disabled)] uppercase tracking-wider font-medium mb-2">
              Title <span className="text-[#8B5A5A]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of the incident"
              className="w-full bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.08)] rounded-lg px-4 py-2.5 text-sm text-[var(--parchment)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:border-[rgba(176,155,113,0.50)] focus:bg-[rgba(245,240,232,0.06)] transition-all"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-[11px] text-[var(--text-disabled)] uppercase tracking-wider font-medium mb-2">
              Location <span className="text-[#8B5A5A]">*</span>
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Address or landmark (e.g. 100 Faircroft Dr)"
              className="w-full bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.08)] rounded-lg px-4 py-2.5 text-sm text-[var(--parchment)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:border-[rgba(176,155,113,0.50)] focus:bg-[rgba(245,240,232,0.06)] transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] text-[var(--text-disabled)] uppercase tracking-wider font-medium mb-2">
              Description <span className="text-[#8B5A5A]">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened or what you observed…"
              className="w-full bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.08)] rounded-lg px-4 py-2.5 text-sm text-[var(--parchment)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:border-[rgba(176,155,113,0.50)] focus:bg-[rgba(245,240,232,0.06)] transition-all resize-none"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-[11px] text-[var(--text-disabled)] uppercase tracking-wider font-medium mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.08)] rounded-lg px-4 py-2.5 text-sm text-[var(--parchment)] focus:outline-none focus:border-[rgba(176,155,113,0.50)] transition-all"
            />
          </div>

          {/* Anonymous */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="w-4 h-4 rounded border-[rgba(245,240,232,0.20)] bg-[rgba(245,240,232,0.04)] accent-[#B09B71]"
            />
            <span className="text-sm text-[var(--text-body)]">Submit anonymously</span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !title.trim() || !location.trim() || !description.trim()}
            className="w-full py-3 rounded-xl text-sm font-medium transition-all bg-[rgba(176,155,113,0.15)] border border-[rgba(176,155,113,0.30)] text-[#B09B71] hover:bg-[rgba(176,155,113,0.25)] hover:border-[rgba(176,155,113,0.50)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting…' : ' Submit Report'}
          </button>
        </form>
      </div>
    </>
  );
}

// ─────────────────────────────────────────
// Stats Bar
// ─────────────────────────────────────────
function StatsBar({ lots, incidents, layerMode }: { lots: LotData[]; incidents: Incident[]; layerMode: LayerMode }) {
  const total = lots.length;
  const current = lots.filter((l) => l.isDuesCurrent === true).length;
  const overdue = lots.filter((l) => l.isDuesCurrent === false).length;
  const unknown = lots.filter((l) => l.isDuesCurrent === null).length;
  const paidPct = total > 0 ? Math.round((current / total) * 100) : 0;
  const overduePct = total > 0 ? Math.round((overdue / total) * 100) : 0;
  const activeIncidents = incidents.filter((i) => i.status === 'active').length;

  const showIncidentStat = layerMode === 'both' || layerMode === 'incidents';

  const stats = [
    { label: 'Total Lots', value: String(total), color: 'text-[#B09B71]' },
    { label: 'Dues Current', value: current + ' (' + paidPct + '%)', color: 'text-[#2A5D4F]' },
    { label: 'Overdue', value: overdue + ' (' + overduePct + '%)', color: 'text-[#8B5A5A]' },
    ...(showIncidentStat
      ? [{ label: 'Active Incidents', value: String(activeIncidents), color: 'text-[#B09B71]' }]
      : [{ label: 'Unknown', value: String(unknown), color: 'text-[var(--text-muted)]' }]),
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {stats.map(({ label, value, color }) => (
        <div key={label} className="glass-card rounded-xl hover-lift p-4 text-center">
          <div className={'text-xl font-medium ' + color}>{value}</div>
          <div className="text-[11px] text-[var(--text-disabled)] uppercase tracking-wider mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// View Toggle
// ─────────────────────────────────────────
function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="flex gap-1 p-1 rounded-xl bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.08)]">
      {(['map', 'grid'] as ViewMode[]).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
            view === v
              ? 'bg-[rgba(176,155,113,0.15)] text-[#B09B71] border border-[rgba(176,155,113,0.30)]'
              : 'text-[var(--text-disabled)] hover:text-[var(--text-body)]',
          ].join(' ')}
          aria-pressed={view === v}
        >
          <span>{v === 'map' ? '' : '⊞'}</span>
          <span>{v === 'map' ? 'Map' : 'Grid'}</span>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// Layer Toggle
// ─────────────────────────────────────────
function LayerToggle({ layer, onChange }: { layer: LayerMode; onChange: (l: LayerMode) => void }) {
  const options: { key: LayerMode; label: string }[] = [
    { key: 'both', label: 'Both' },
    { key: 'properties', label: 'Properties' },
    { key: 'incidents', label: 'Incidents' },
  ];
  return (
    <div className="flex gap-1 p-1 rounded-xl bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.08)]">
      {options.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={[
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
            layer === key
              ? 'bg-[rgba(176,155,113,0.15)] text-[#B09B71] border border-[rgba(176,155,113,0.30)]'
              : 'text-[var(--text-disabled)] hover:text-[var(--text-body)]',
          ].join(' ')}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// Map Legend
// ─────────────────────────────────────────
function MapLegend({ showProperties, showIncidents }: { showProperties: boolean; showIncidents: boolean }) {
  const propertyItems = [
    { color: '#2A5D4F', label: 'Dues Current' },
    { color: '#8B5A5A', label: 'Overdue' },
    { color: `rgba(245,240,232,0.35)`, label: 'Unknown' },
  ];

  const incidentItems = Object.entries(INCIDENT_COLORS).map(([type, color]) => ({
    color,
    label: INCIDENT_LABELS[type as Incident['type']],
  }));

  return (
    <div className="flex flex-wrap gap-4 px-4 py-3 rounded-xl bg-[rgba(245,240,232,0.03)] border border-[rgba(245,240,232,0.06)]">
      {showProperties && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] text-[var(--text-disabled)] uppercase tracking-wider font-medium">Lots:</span>
          {propertyItems.map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full inline-block" style={{ background: color, boxShadow: `0 0 6px ${color}80` }} />
              <span className="text-[11px] text-[var(--text-muted)] font-medium">{label}</span>
            </div>
          ))}
        </div>
      )}
      {showIncidents && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] text-[var(--text-disabled)] uppercase tracking-wider font-medium">Incidents:</span>
          {incidentItems.map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span
                className="inline-block"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderBottom: `8px solid ${color}`,
                  filter: `drop-shadow(0 0 3px ${color}80)`,
                }}
              />
              <span className="text-[11px] text-[var(--text-muted)] font-medium">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Incidents Panel (list below map)
// ─────────────────────────────────────────
function IncidentsPanel({
  incidents,
  onSelect,
}: {
  incidents: Incident[];
  onSelect: (i: Incident) => void;
}) {
  const active = incidents.filter((i) => i.status === 'active');

  if (active.length === 0) {
    return (
      <div className="glass-card rounded-xl hover-lift p-6 text-center mt-6">
        <div className="text-3xl mb-2"></div>
        <p className="text-[var(--text-muted)] text-sm">No active incidents in the neighborhood</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] text-[var(--text-disabled)] uppercase tracking-wider font-medium">
          Active Incidents <span className="text-[#B09B71] ml-1">{active.length}</span>
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {active.map((incident) => {
          const color = INCIDENT_COLORS[incident.type];
          const icon = INCIDENT_ICONS[incident.type];
          const label = INCIDENT_LABELS[incident.type];
          return (
            <button
              key={incident.id}
              onClick={() => onSelect(incident)}
              className="glass-card rounded-xl hover-lift p-4 text-left transition-all duration-200 hover:bg-[rgba(245,240,232,0.06)] focus:outline-none focus:ring-2 focus:ring-[rgba(176,155,113,0.50)]"
              style={{ borderLeft: `3px solid ${color}60` }}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider font-medium mb-0.5" style={{ color }}>
                    {label}
                  </div>
                  <div className="text-sm font-medium text-[var(--parchment)] truncate">{incident.title}</div>
                  <div className="text-[11px] text-[var(--text-disabled)] mt-1 truncate"> {incident.location}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────
export default function MapPage() {
  const { lots, loading, error, refresh } = useNeighborhoodMap();
  const { incidents, addIncident, resolveIncident } = useIncidents();
  const { address } = useAccount();

  const isBoard = !!address;

  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedLot, setSelectedLot] = useState<LotData | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [layerMode, setLayerMode] = useState<LayerMode>('both');
  const [showReportModal, setShowReportModal] = useState(false);

  const handleSelectLot = useCallback((lot: LotData) => {
    setSelectedIncident(null);
    setSelectedLot(lot);
  }, []);

  const handleSelectIncident = useCallback((incident: Incident) => {
    setSelectedLot(null);
    setSelectedIncident(incident);
  }, []);

  const filteredLots = useMemo(() => {
    let result = lots;
    if (filter === 'current') result = result.filter((l) => l.isDuesCurrent === true);
    else if (filter === 'overdue') result = result.filter((l) => l.isDuesCurrent === false);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (l) => l.lotNumber.toString().includes(q) || l.streetAddress.toLowerCase().includes(q)
      );
    }
    return result;
  }, [lots, filter, search]);

  const showLots = layerMode === 'both' || layerMode === 'properties';
  const showIncidents = layerMode === 'both' || layerMode === 'incidents';

  const handleReportSubmit = useCallback(
    (data: Omit<Incident, 'id' | 'createdAt' | 'status'>) => {
      addIncident(data);
      setShowReportModal(false);
    },
    [addIncident]
  );

  const filterButtons: { key: StatusFilter; label: string; activeClass: string }[] = [
    { key: 'all', label: 'All', activeClass: 'bg-[rgba(176,155,113,0.12)] text-[#B09B71] border border-[rgba(176,155,113,0.40)]' },
    { key: 'current', label: ' Current', activeClass: 'bg-[rgba(42,93,79,0.15)] text-[#2A5D4F] border border-[rgba(42,93,79,0.30)]' },
    { key: 'overdue', label: ' Overdue', activeClass: 'bg-[rgba(107,58,58,0.15)] text-[#8B5A5A] border border-[rgba(107,58,58,0.30)]' },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0c0c0e] via-[#0c0c0e] to-[#141416]">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
        {/* Page header */}
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl sm:text-4xl font-medium gradient-text sm: mb-2">Neighborhood Map</h1>
            <p className="text-[var(--text-muted)] text-sm">Community lot overview and incident reports</p>
          </div>
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all bg-[rgba(176,155,113,0.15)] border border-[rgba(176,155,113,0.30)] text-[#B09B71] hover:bg-[rgba(176,155,113,0.25)] hover:border-[rgba(176,155,113,0.50)] hover-lift"
          >
            <span></span>
            <span>Report Incident</span>
          </button>
        </div>

        {/* Stats — show empty state when error */}
        {!loading && (
          <StatsBar lots={error ? [] : lots} incidents={incidents} layerMode={layerMode} />
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex gap-2 flex-wrap">
            {filterButtons.map(({ key, label, activeClass }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ' +
                  (filter === key
                    ? activeClass
                    : 'bg-[rgba(245,240,232,0.04)] text-[var(--text-muted)] border border-[rgba(245,240,232,0.08)] hover:text-[var(--parchment)] hover:bg-[rgba(245,240,232,0.07)]')
                }
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search lot # or address…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.08)] rounded-lg px-4 py-2 text-sm text-[var(--parchment)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:border-[rgba(176,155,113,0.50)] focus:bg-[rgba(245,240,232,0.06)] transition-all"
            />
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.08)] text-[var(--text-muted)] hover:text-[var(--parchment)] hover:bg-[rgba(245,240,232,0.07)] transition-all disabled:opacity-50"
          >
            {loading ? '⟳ Loading…' : '⟳ Refresh'}
          </button>
        </div>

        {/* View/layer toggles + legend */}
        {!loading && !error && lots.length > 0 && ( 
          <div className="flex flex-col gap-3 mb-5">
            <div className="flex items-center gap-3 flex-wrap">
              <ViewToggle view={viewMode} onChange={setViewMode} />
              {viewMode === 'map' && <LayerToggle layer={layerMode} onChange={setLayerMode} />}
              <p className="text-[12px] text-[var(--text-disabled)] ml-auto">
                Showing {filteredLots.length} of {lots.length} lots
              </p>
            </div>
            {viewMode === 'map' && (
              <MapLegend showProperties={showLots} showIncidents={showIncidents} />
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="glass-card rounded-xl hover-lift p-6 border border-[rgba(139,90,90,0.20)] bg-[rgba(139,90,90,0.05)] mb-6">
            <p className="text-[#8B5A5A] font-medium">Map data temporarily unavailable</p>
            <p className="text-[var(--text-disabled)] text-sm mt-1">Property data couldn&apos;t be loaded right now. The map will still display — try refreshing in a moment.</p>
            <button onClick={refresh} className="mt-3 px-4 py-2 rounded-lg text-sm font-medium bg-[rgba(176,155,113,0.15)] text-[#B09B71] border border-[rgba(176,155,113,0.30)] hover:bg-[rgba(176,155,113,0.25)] transition-all">
              Retry
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="glass-card rounded-xl hover-lift p-4 border-l-4 border-l-[rgba(245,240,232,0.08)] animate-pulse">
                <div className="h-3 w-12 bg-[rgba(245,240,232,0.07)] rounded mb-3" />
                <div className="h-6 w-16 bg-[rgba(245,240,232,0.07)] rounded mb-4" />
                <div className="h-3 w-full bg-[rgba(245,240,232,0.05)] rounded mb-2" />
                <div className="h-2 w-20 bg-[rgba(245,240,232,0.04)] rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && lots.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4"></div>
            <h2 className="text-xl font-medium text-[var(--text-body)] mb-2">No properties minted yet</h2>
            <p className="text-[var(--text-disabled)] text-sm max-w-sm">
              Once property NFTs are minted on-chain, they will appear here color-coded by dues status.
            </p>
          </div>
        )}

        {/* No filter results */}
        {!loading && !error && lots.length > 0 && filteredLots.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-3"></div>
            <h2 className="text-lg font-medium text-[var(--text-body)] mb-1">No lots match your filters</h2>
            <p className="text-[var(--text-disabled)] text-sm">Try clearing the search or changing the filter.</p>
          </div>
        )}

        {/* ── Map View ── always render map even if lot data failed; incidents still work */}
        {!loading && viewMode === 'map' && (
          <NeighborhoodMap
            lots={showLots && !error ? filteredLots : []}
            selectedLot={selectedLot}
            isBoard={isBoard}
            onSelectLot={handleSelectLot}
            incidents={showIncidents ? incidents : []}
            onSelectIncident={handleSelectIncident}
            showLots={showLots && !error}
            showIncidents={showIncidents}
          />
        )}

        {/* ── Grid View ── */}
        {!loading && filteredLots.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredLots.map((lot) => (
              <LotCard
                key={lot.tokenId}
                lot={lot}
                isSelected={selectedLot?.tokenId === lot.tokenId}
                onClick={() => handleSelectLot(lot)}
              />
            ))}
          </div>
        )}

        {/* ── Incidents list panel (map mode only) ── */}
        {!loading && viewMode === 'map' && showIncidents && (
          <IncidentsPanel incidents={incidents} onSelect={handleSelectIncident} />
        )}
      </div>

      {/* Lot detail panel */}
      {selectedLot && (
        <LotDetailPanel lot={selectedLot} isBoard={isBoard} onClose={() => setSelectedLot(null)} />
      )}

      {/* Incident detail panel */}
      {selectedIncident && (
        <IncidentDetailPanel
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onResolve={resolveIncident}
        />
      )}

      {/* Report incident modal */}
      {showReportModal && (
        <ReportIncidentModal
          onClose={() => setShowReportModal(false)}
          onSubmit={handleReportSubmit}
          walletAddress={address || '0x0000'}
        />
      )}
    </main>
  );
}
