'use client';

import { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useAccount } from 'wagmi';
import { useNeighborhoodMap, LotData } from '@/hooks/useNeighborhoodMap';

// ─────────────────────────────────────────
// Dynamic import of map (no SSR — Leaflet requires window)
// ─────────────────────────────────────────
const NeighborhoodMap = dynamic(() => import('@/components/NeighborhoodMap'), {
  ssr: false,
  loading: () => (
    <div
      className="w-full flex items-center justify-center border border-white/[0.08] rounded-2xl bg-white/[0.02]"
      style={{ minHeight: 520 }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#c9a96e]/40 border-t-[#c9a96e] animate-spin" />
        <span className="text-sm text-gray-500">Loading map…</span>
      </div>
    </div>
  ),
});

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────
type StatusFilter = 'all' | 'current' | 'overdue';
type ViewMode = 'map' | 'grid';

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
    color === 'green'
      ? 'border-l-green-500'
      : color === 'red'
      ? 'border-l-red-500'
      : 'border-l-gray-600';

  const badgeClass =
    color === 'green'
      ? 'bg-green-500/15 text-green-400 border border-green-500/30'
      : color === 'red'
      ? 'bg-red-500/15 text-red-400 border border-red-500/30'
      : 'bg-gray-500/15 text-gray-400 border border-gray-500/30';

  return (
    <button
      onClick={onClick}
      className={[
        'relative glass-card rounded-xl hover-lift p-4 text-left cursor-pointer',
        'border-l-4',
        borderClass,
        isSelected ? 'ring-2 ring-[#c9a96e]/50 bg-[#c9a96e]/5' : 'hover:bg-white/[0.06]',
        'hover:-translate-y-0.5 active:scale-[0.98]',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/50',
        'w-full',
      ].join(' ')}
    >
      {/* Lot number */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Lot</span>
          <div className="text-xl font-bold gradient-text leading-none">{'#' + lot.lotNumber}</div>
        </div>
        <span className={'text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 mt-1 ' + badgeClass}>
          {statusLabel(lot)}
        </span>
      </div>

      {/* Address */}
      <div className="text-[12px] text-gray-300 font-medium truncate">{lot.streetAddress}</div>

      {/* Sqft */}
      {lot.sqft > 0 && (
        <div className="text-[11px] text-gray-500 mt-1">{lot.sqft.toLocaleString()} sq ft</div>
      )}
    </button>
  );
}

// ─────────────────────────────────────────
// Detail Panel
// ─────────────────────────────────────────
function DetailPanel({
  lot,
  isBoard,
  onClose,
}: {
  lot: LotData;
  isBoard: boolean;
  onClose: () => void;
}) {
  const color = statusColor(lot);

  const statusBadgeClass =
    color === 'green'
      ? 'bg-green-500/20 text-green-300 border border-green-500/40'
      : color === 'red'
      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
      : 'bg-gray-500/20 text-gray-300 border border-gray-500/40';

  const dotClass =
    color === 'green'
      ? 'bg-green-400 animate-pulse'
      : color === 'red'
      ? 'bg-red-400 animate-pulse'
      : 'bg-gray-400';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 glass border-l border-[#c9a96e]/15 flex flex-col overflow-y-auto"
        role="dialog"
        aria-label={'Lot #' + lot.lotNumber + ' details'}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <div>
            <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Property Detail</p>
            <h2 className="text-2xl font-bold gradient-text">{'Lot #' + lot.lotNumber}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-gray-400 hover:text-white flex items-center justify-center transition-all"
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Status badge */}
          <div className={'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ' + statusBadgeClass}>
            <span className={'w-2 h-2 rounded-full ' + dotClass} />
            {'Dues ' + statusLabel(lot)}
          </div>

          {/* Address */}
          <div className="glass-card rounded-xl hover-lift p-4 space-y-3">
            <h3 className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Location</h3>
            <p className="text-gray-200 font-medium">{lot.streetAddress}</p>
            {lot.sqft > 0 && (
              <p className="text-gray-400 text-sm">{lot.sqft.toLocaleString() + ' sq ft'}</p>
            )}
          </div>

          {/* Token info */}
          <div className="glass-card rounded-xl hover-lift p-4 space-y-3">
            <h3 className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">NFT Details</h3>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Token ID</span>
              <span className="text-gray-200 font-mono">{'#' + lot.tokenId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Lot Number</span>
              <span className="text-gray-200 font-mono">{'#' + lot.lotNumber}</span>
            </div>
          </div>

          {/* Owner — board only */}
          {isBoard ? (
            <div className="glass-card rounded-xl hover-lift p-4 space-y-3">
              <h3 className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Owner</h3>
              <p className="text-gray-200 font-mono text-sm break-all">{lot.owner}</p>
            </div>
          ) : (
            <div className="glass-card rounded-xl hover-lift p-4">
              <p className="text-gray-500 text-sm italic">
                🔒 Owner details visible to board members only
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────
// Stats Bar
// ─────────────────────────────────────────
function StatsBar({ lots }: { lots: LotData[] }) {
  const total = lots.length;
  const current = lots.filter((l) => l.isDuesCurrent === true).length;
  const overdue = lots.filter((l) => l.isDuesCurrent === false).length;
  const unknown = lots.filter((l) => l.isDuesCurrent === null).length;

  const paidPct = total > 0 ? Math.round((current / total) * 100) : 0;
  const overduePct = total > 0 ? Math.round((overdue / total) * 100) : 0;

  const stats = [
    { label: 'Total Lots', value: String(total), color: 'text-[#c9a96e]' },
    { label: 'Dues Current', value: current + ' (' + paidPct + '%)', color: 'text-green-400' },
    { label: 'Overdue', value: overdue + ' (' + overduePct + '%)', color: 'text-red-400' },
    { label: 'Unknown', value: String(unknown), color: 'text-gray-400' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {stats.map(({ label, value, color }) => (
        <div key={label} className="glass-card rounded-xl hover-lift p-4 text-center">
          <div className={'text-xl font-bold ' + color}>{value}</div>
          <div className="text-[11px] text-gray-500 uppercase tracking-wider mt-1">{label}</div>
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
    <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
      <button
        onClick={() => onChange('map')}
        className={[
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200',
          view === 'map'
            ? 'bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/30'
            : 'text-gray-500 hover:text-gray-300',
        ].join(' ')}
        aria-pressed={view === 'map'}
      >
        <span>🗺</span>
        <span>Map</span>
      </button>
      <button
        onClick={() => onChange('grid')}
        className={[
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200',
          view === 'grid'
            ? 'bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/30'
            : 'text-gray-500 hover:text-gray-300',
        ].join(' ')}
        aria-pressed={view === 'grid'}
      >
        <span>⊞</span>
        <span>Grid</span>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────
// Map Legend
// ─────────────────────────────────────────
function MapLegend() {
  const items = [
    { color: '#22c55e', label: 'Dues Current' },
    { color: '#ef4444', label: 'Overdue' },
    { color: '#6b7280', label: 'Unknown' },
  ];
  return (
    <div className="flex items-center gap-4 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
      {items.map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full inline-block"
            style={{ background: color, boxShadow: `0 0 6px ${color}80` }}
          />
          <span className="text-[11px] text-gray-400 font-medium">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────
export default function MapPage() {
  const { lots, loading, error, refresh } = useNeighborhoodMap();
  const { address } = useAccount();

  // Board = any connected wallet (shows owner address). In a real app, check contract role.
  const isBoard = !!address;

  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedLot, setSelectedLot] = useState<LotData | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('map');

  const handleSelectLot = useCallback((lot: LotData) => {
    setSelectedLot(lot);
  }, []);

  const filteredLots = useMemo(() => {
    let result = lots;

    if (filter === 'current') result = result.filter((l) => l.isDuesCurrent === true);
    else if (filter === 'overdue') result = result.filter((l) => l.isDuesCurrent === false);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (l) =>
          l.lotNumber.toString().includes(q) ||
          l.streetAddress.toLowerCase().includes(q)
      );
    }

    return result;
  }, [lots, filter, search]);

  const filterButtons: { key: StatusFilter; label: string; activeClass: string }[] = [
    { key: 'all', label: 'All', activeClass: 'bg-[#c9a96e]/12 text-[#c9a96e] border border-[#c9a96e]/40' },
    { key: 'current', label: '✓ Current', activeClass: 'bg-green-500/20 text-green-400 border border-green-500/40' },
    { key: 'overdue', label: '✗ Overdue', activeClass: 'bg-red-500/20 text-red-400 border border-red-500/40' },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0d0b14] to-[#080810]">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-2">
            Neighborhood Map
          </h1>
          <p className="text-gray-400 text-sm">
            Community lot overview — dues status at a glance
          </p>
        </div>

        {/* Stats */}
        {!loading && !error && <StatsBar lots={lots} />}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {/* Filter buttons */}
          <div className="flex gap-2 flex-wrap">
            {filterButtons.map(({ key, label, activeClass }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={
                  'px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ' +
                  (filter === key
                    ? activeClass
                    : 'bg-white/[0.04] text-gray-400 border border-white/[0.08] hover:text-gray-200 hover:bg-white/[0.07]')
                }
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search lot # or address…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-[#c9a96e]/50 focus:bg-white/[0.06] transition-all"
            />
          </div>

          {/* Refresh */}
          <button
            onClick={refresh}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-gray-200 hover:bg-white/[0.07] transition-all disabled:opacity-50"
            aria-label="Refresh data"
          >
            {loading ? '⟳ Loading…' : '⟳ Refresh'}
          </button>
        </div>

        {/* View toggle + legend row */}
        {!loading && !error && lots.length > 0 && (
          <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <ViewToggle view={viewMode} onChange={setViewMode} />
              {viewMode === 'map' && <MapLegend />}
            </div>
            <p className="text-[12px] text-gray-600">
              Showing {filteredLots.length} of {lots.length} lots
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="glass-card rounded-xl hover-lift p-6 border border-red-500/20 bg-red-500/5 mb-6">
            <p className="text-red-400 font-semibold">⚠ Failed to load map data</p>
            <p className="text-red-400/70 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="glass-card rounded-xl hover-lift p-4 border-l-4 border-l-gray-700 animate-pulse"
              >
                <div className="h-3 w-12 bg-white/[0.07] rounded mb-3" />
                <div className="h-6 w-16 bg-white/[0.07] rounded mb-4" />
                <div className="h-3 w-full bg-white/[0.05] rounded mb-2" />
                <div className="h-2 w-20 bg-white/[0.04] rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state — no properties minted */}
        {!loading && !error && lots.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">🏘️</div>
            <h2 className="text-xl font-bold text-gray-300 mb-2">No properties minted yet</h2>
            <p className="text-gray-500 text-sm max-w-sm">
              Once property NFTs are minted on-chain, they will appear here color-coded by dues status.
            </p>
          </div>
        )}

        {/* No search/filter results */}
        {!loading && !error && lots.length > 0 && filteredLots.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <h2 className="text-lg font-bold text-gray-300 mb-1">No lots match your filters</h2>
            <p className="text-gray-500 text-sm">Try clearing the search or changing the filter.</p>
          </div>
        )}

        {/* ── Map View ── */}
        {!loading && filteredLots.length > 0 && viewMode === 'map' && (
          <NeighborhoodMap
            lots={filteredLots}
            selectedLot={selectedLot}
            isBoard={isBoard}
            onSelectLot={handleSelectLot}
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
      </div>

      {/* Detail panel — shown in both modes */}
      {selectedLot && (
        <DetailPanel
          lot={selectedLot}
          isBoard={isBoard}
          onClose={() => setSelectedLot(null)}
        />
      )}
    </main>
  );
}
