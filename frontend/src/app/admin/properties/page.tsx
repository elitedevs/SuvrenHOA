'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSupabaseAuth } from '@/context/AuthContext';
import { usePropertyAdmin, type CSVRow } from '@/hooks/usePropertyAdmin';
import Link from 'next/link';
import {
  Upload, Plus, Home, Users, CheckCircle2, Clock, AlertCircle,
  Wallet, ChevronRight, FileSpreadsheet, X, RefreshCw,
} from 'lucide-react';

type Tab = 'list' | 'assign' | 'csv';

export default function AdminPropertiesPage() {
  const { profile } = useSupabaseAuth();
  const isAdmin = profile?.role === 'board_member' || profile?.role === 'property_manager';

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 page-enter">
        <div className="glass-card rounded-xl p-12 text-center">
          <AlertCircle className="w-10 h-10 text-[#6B3A3A] mx-auto mb-4 opacity-60" />
          <h2 className="text-xl font-medium text-[var(--parchment)] mb-2">Access Restricted</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Only board members and property managers can manage property assignments.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 mt-6 px-5 py-2.5 rounded-xl bg-[rgba(176,155,113,0.12)] hover:bg-[rgba(176,155,113,0.20)] text-sm text-[#B09B71] transition-all"
          >
            Back to Dashboard <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return <PropertiesManager />;
}

function PropertiesManager() {
  // TODO: Replace with actual community ID from context/route
  const communityId = 'default';
  const {
    assignments, loading, error, stats,
    fetchAssignments, assignProperty, batchImport,
    mintProperty, isMinting, isConfirming, isMinted, txHash,
  } = usePropertyAdmin(communityId);

  const [tab, setTab] = useState<Tab>('list');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Clear success messages after 5s
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 5000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'list', label: 'Property List', icon: Home },
    { id: 'assign', label: 'Manual Assign', icon: Plus },
    { id: 'csv', label: 'CSV Upload', icon: Upload },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 page-enter">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-1">Administration</p>
        <h1 className="text-3xl sm:text-4xl font-medium gradient-text">Assign Properties</h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          Manage lot assignments and property NFT minting for your community.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        {[
          { label: 'Total', value: stats.total, color: 'text-[var(--parchment)]' },
          { label: 'Unassigned', value: stats.unassigned, color: 'text-[var(--text-muted)]' },
          { label: 'Pending Wallet', value: stats.pendingWallet, color: 'text-[#B09B71]' },
          { label: 'Assigned', value: stats.assigned, color: 'text-[#5A7A9A]' },
          { label: 'Minted', value: stats.minted, color: 'text-[#3A7D6F]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card rounded-xl p-4 text-center">
            <p className={`text-2xl font-normal ${color}`}>{value}</p>
            <p className="text-[10px] text-[var(--text-disabled)] uppercase tracking-wide mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Success / Error banners */}
      {successMsg && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-[rgba(42,93,79,0.12)] border border-[rgba(42,93,79,0.25)] text-[#3A7D6F] text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMsg}
        </div>
      )}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-[rgba(107,58,58,0.12)] border border-[rgba(107,58,58,0.25)] text-[#8B5A5A] text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 p-1 bg-[rgba(245,240,232,0.03)] rounded-xl">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === id
                ? 'bg-[rgba(176,155,113,0.12)] text-[#B09B71]'
                : 'text-[var(--text-muted)] hover:text-[var(--parchment)] hover:bg-[rgba(245,240,232,0.04)]'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'list' && (
        <PropertyList
          assignments={assignments}
          loading={loading}
          onRefresh={fetchAssignments}
          onMint={mintProperty}
          isMinting={isMinting}
          isConfirming={isConfirming}
        />
      )}
      {tab === 'assign' && (
        <ManualAssign
          onAssign={async (lot, profileId, wallet) => {
            await assignProperty(lot, profileId, wallet);
            setSuccessMsg(`Lot #${lot} assigned successfully.`);
            setTab('list');
          }}
        />
      )}
      {tab === 'csv' && (
        <CSVUpload
          onImport={async (rows) => {
            const count = await batchImport(rows);
            setSuccessMsg(`${count} properties imported successfully.`);
            setTab('list');
          }}
        />
      )}
    </div>
  );
}

// ── Property List View ──────────────────────────────────────────────────────

function PropertyList({
  assignments,
  loading,
  onRefresh,
  onMint,
  isMinting,
  isConfirming,
}: {
  assignments: ReturnType<typeof usePropertyAdmin>['assignments'];
  loading: boolean;
  onRefresh: () => void;
  onMint: (wallet: string, lot: number, address: string, sqft: number) => void;
  isMinting: boolean;
  isConfirming: boolean;
}) {
  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      unassigned: 'bg-[rgba(245,240,232,0.06)] text-[var(--text-disabled)]',
      pending_wallet: 'bg-[rgba(176,155,113,0.12)] text-[#B09B71]',
      assigned: 'bg-[rgba(90,122,154,0.12)] text-[#5A7A9A]',
      minted: 'bg-[rgba(42,93,79,0.12)] text-[#3A7D6F]',
    };
    const labels: Record<string, string> = {
      unassigned: 'Unassigned',
      pending_wallet: 'Pending Wallet',
      assigned: 'Assigned',
      minted: 'Minted',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${styles[status] || ''}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <RefreshCw className="w-6 h-6 text-[#B09B71] mx-auto mb-3 animate-spin" />
        <p className="text-sm text-[var(--text-muted)]">Loading assignments...</p>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <Home className="w-10 h-10 text-[#B09B71] mx-auto mb-4 opacity-40" />
        <h3 className="text-lg font-medium text-[var(--parchment)] mb-2">No Properties Yet</h3>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Add properties manually or upload a CSV to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(245,240,232,0.06)]">
        <p className="text-sm font-medium text-[var(--parchment)]">{assignments.length} Properties</p>
        <button
          onClick={onRefresh}
          className="p-2 rounded-lg text-[var(--text-disabled)] hover:text-[var(--text-body)] hover:bg-[rgba(245,240,232,0.05)] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      <div className="divide-y divide-[rgba(245,240,232,0.04)]">
        {assignments.map((a) => (
          <div key={a.id} className="px-6 py-4 flex items-center gap-4 hover:bg-[rgba(245,240,232,0.02)] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[rgba(176,155,113,0.08)] flex items-center justify-center shrink-0">
              <span className="text-sm font-medium text-[#B09B71]">#{a.lot_number}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {statusBadge(a.status)}
                {a.wallet_address && (
                  <span className="text-[11px] font-mono text-[var(--text-disabled)] truncate max-w-[120px]">
                    {a.wallet_address.slice(0, 6)}...{a.wallet_address.slice(-4)}
                  </span>
                )}
              </div>
              {a.nft_token_id !== null && (
                <p className="text-[11px] text-[var(--text-disabled)] mt-0.5">
                  NFT Token #{a.nft_token_id}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {a.status === 'assigned' && a.wallet_address && (
                <button
                  onClick={() => onMint(a.wallet_address!, a.lot_number, '', 0)}
                  disabled={isMinting || isConfirming}
                  className="px-3 py-1.5 rounded-lg bg-[rgba(176,155,113,0.12)] hover:bg-[rgba(176,155,113,0.20)] text-xs text-[#B09B71] font-medium transition-all disabled:opacity-50"
                >
                  {isMinting ? 'Confirm...' : isConfirming ? 'Minting...' : 'Mint NFT'}
                </button>
              )}
              {a.status === 'pending_wallet' && (
                <span className="flex items-center gap-1 text-xs text-[var(--text-disabled)]">
                  <Clock className="w-3 h-3" /> Awaiting wallet
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Manual Assignment Form ──────────────────────────────────────────────────

function ManualAssign({
  onAssign,
}: {
  onAssign: (lot: number, profileId: string | null, wallet: string | null) => Promise<void>;
}) {
  const [lotNumber, setLotNumber] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lotNumber) return;
    setSubmitting(true);
    try {
      await onAssign(
        parseInt(lotNumber, 10),
        null,
        walletAddress.trim() || null,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="px-8 py-5 border-b border-[rgba(245,240,232,0.06)] bg-[rgba(176,155,113,0.04)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[rgba(176,155,113,0.10)] border border-[rgba(176,155,113,0.25)] flex items-center justify-center">
            <Plus className="w-5 h-5 text-[#B09B71]" />
          </div>
          <div>
            <h2 className="text-base font-medium text-[var(--parchment)]">Assign Property</h2>
            <p className="text-xs text-[var(--text-disabled)] mt-0.5">
              Manually assign a lot to a resident
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-[var(--text-body)] mb-2">
              Lot Number <span className="text-[#6B3A3A]">*</span>
            </label>
            <input
              type="number"
              required
              value={lotNumber}
              onChange={(e) => setLotNumber(e.target.value)}
              placeholder="1"
              className="w-full px-4 py-3.5 rounded-xl bg-[rgba(20,20,22,0.60)] border border-[rgba(245,240,232,0.08)] text-sm placeholder-[rgba(245,240,232,0.20)] focus:border-[rgba(176,155,113,0.50)] focus:outline-none focus:ring-1 focus:ring-[rgba(176,155,113,0.20)] transition-all text-[var(--parchment)] min-h-[52px]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-body)] mb-2">
              Wallet Address <span className="text-[var(--text-disabled)] font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3.5 rounded-xl bg-[rgba(20,20,22,0.60)] border border-[rgba(245,240,232,0.08)] text-sm font-mono placeholder-[rgba(245,240,232,0.20)] focus:border-[rgba(176,155,113,0.50)] focus:outline-none focus:ring-1 focus:ring-[rgba(176,155,113,0.20)] transition-all text-[var(--parchment)] min-h-[52px]"
            />
          </div>
        </div>

        {!walletAddress.trim() && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[rgba(176,155,113,0.06)] border border-[rgba(176,155,113,0.10)]">
            <Wallet className="w-4 h-4 text-[#B09B71] shrink-0" />
            <p className="text-xs text-[var(--text-muted)]">
              Without a wallet address, this property will be marked as &ldquo;pending wallet&rdquo; until the resident connects one.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !lotNumber}
          className="w-full py-4 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[#0C0C0E] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all duration-200 shadow-[0_0_20px_rgba(176,155,113,0.12)] hover:shadow-[0_0_28px_rgba(176,155,113,0.28)] min-h-[52px]"
        >
          {submitting ? 'Assigning...' : 'Assign Property'}
        </button>
      </form>
    </div>
  );
}

// ── CSV Upload ──────────────────────────────────────────────────────────────

function CSVUpload({
  onImport,
}: {
  onImport: (rows: CSVRow[]) => Promise<void>;
}) {
  const [rows, setRows] = useState<CSVRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split('\n');
      if (lines.length < 2) {
        setParseError('CSV must have a header row and at least one data row.');
        return;
      }

      const header = lines[0].toLowerCase().split(',').map(h => h.trim());
      const lotIdx = header.findIndex(h => h.includes('lot'));
      const walletIdx = header.findIndex(h => h.includes('wallet') || h.includes('address'));

      if (lotIdx === -1) {
        setParseError('CSV must contain a "lot_number" column.');
        return;
      }

      const parsed: CSVRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        const lot = cols[lotIdx];
        if (!lot || isNaN(parseInt(lot, 10))) continue;
        parsed.push({
          lot_number: lot,
          wallet_address: walletIdx >= 0 ? cols[walletIdx] || '' : '',
        });
      }

      if (parsed.length === 0) {
        setParseError('No valid rows found in CSV.');
        return;
      }

      setRows(parsed);
    };
    reader.readAsText(file);
  }, []);

  const handleImport = async () => {
    setImporting(true);
    try {
      await onImport(rows);
    } finally {
      setImporting(false);
      setRows([]);
      setFileName('');
    }
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="px-8 py-5 border-b border-[rgba(245,240,232,0.06)] bg-[rgba(176,155,113,0.04)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[rgba(176,155,113,0.10)] border border-[rgba(176,155,113,0.25)] flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-[#B09B71]" />
          </div>
          <div>
            <h2 className="text-base font-medium text-[var(--parchment)]">Batch Import</h2>
            <p className="text-xs text-[var(--text-disabled)] mt-0.5">
              Upload a CSV with lot numbers and wallet addresses
            </p>
          </div>
        </div>
      </div>

      <div className="px-8 py-7">
        {/* Format hint */}
        <div className="mb-6 px-4 py-3 rounded-xl bg-[rgba(245,240,232,0.03)] border border-[rgba(245,240,232,0.06)]">
          <p className="text-xs text-[var(--text-disabled)] mb-2 font-medium uppercase tracking-wide">Expected CSV Format</p>
          <code className="text-xs font-mono text-[var(--text-muted)] block leading-relaxed">
            lot_number,wallet_address<br />
            1,0x1234...abcd<br />
            2,0x5678...efgh<br />
            3,
          </code>
          <p className="text-[11px] text-[var(--text-disabled)] mt-2">
            Wallet address is optional. Lots without a wallet will be marked as &ldquo;unassigned&rdquo;.
          </p>
        </div>

        {/* File picker */}
        {rows.length === 0 && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full py-8 rounded-xl border-2 border-dashed border-[rgba(176,155,113,0.20)] hover:border-[rgba(176,155,113,0.40)] bg-[rgba(176,155,113,0.03)] hover:bg-[rgba(176,155,113,0.06)] transition-all duration-200 flex flex-col items-center gap-2"
            >
              <Upload className="w-8 h-8 text-[#B09B71] opacity-50" />
              <p className="text-sm text-[var(--text-muted)]">Click to select a CSV file</p>
              <p className="text-xs text-[var(--text-disabled)]">or drag and drop</p>
            </button>
          </>
        )}

        {parseError && (
          <div className="mt-4 px-4 py-3 rounded-xl bg-[rgba(107,58,58,0.12)] border border-[rgba(107,58,58,0.25)] text-[#8B5A5A] text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {parseError}
          </div>
        )}

        {/* Preview */}
        {rows.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-[var(--parchment)]">
                <FileSpreadsheet className="w-4 h-4 inline mr-1.5 text-[#B09B71]" />
                {fileName} — {rows.length} rows
              </p>
              <button
                onClick={() => { setRows([]); setFileName(''); }}
                className="p-1.5 rounded-lg text-[var(--text-disabled)] hover:text-[#8B5A5A] hover:bg-[rgba(107,58,58,0.10)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl border border-[rgba(245,240,232,0.06)] overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[rgba(245,240,232,0.03)]">
                    <th className="text-left px-4 py-2 text-[11px] uppercase tracking-wide text-[var(--text-disabled)] font-medium">Lot</th>
                    <th className="text-left px-4 py-2 text-[11px] uppercase tracking-wide text-[var(--text-disabled)] font-medium">Wallet</th>
                    <th className="text-left px-4 py-2 text-[11px] uppercase tracking-wide text-[var(--text-disabled)] font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(245,240,232,0.04)]">
                  {rows.slice(0, 20).map((row, i) => (
                    <tr key={i} className="hover:bg-[rgba(245,240,232,0.02)]">
                      <td className="px-4 py-2 text-[var(--parchment)]">#{row.lot_number}</td>
                      <td className="px-4 py-2 font-mono text-[var(--text-muted)] text-xs">
                        {row.wallet_address
                          ? `${row.wallet_address.slice(0, 8)}...${row.wallet_address.slice(-4)}`
                          : '—'}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`text-xs ${row.wallet_address ? 'text-[#5A7A9A]' : 'text-[var(--text-disabled)]'}`}>
                          {row.wallet_address ? 'Will assign' : 'Unassigned'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 20 && (
                <p className="px-4 py-2 text-xs text-[var(--text-disabled)] text-center bg-[rgba(245,240,232,0.02)]">
                  ...and {rows.length - 20} more
                </p>
              )}
            </div>

            <button
              onClick={handleImport}
              disabled={importing}
              className="w-full mt-5 py-4 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[#0C0C0E] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all duration-200 shadow-[0_0_20px_rgba(176,155,113,0.12)] hover:shadow-[0_0_28px_rgba(176,155,113,0.28)] min-h-[52px]"
            >
              {importing ? 'Importing...' : `Import ${rows.length} Properties`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
