'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useDocuments, useDocument, DOC_TYPE_LABELS } from '@/hooks/useDocuments';
import { CheckCircle } from 'lucide-react';

// Board member addresses (demo — in production derive from contract)
const BOARD_ADDRESSES = [
  '0x0000000000000000000000000000000000000001',
];

export default function DocumentsPage() {
  const { documentCount, getTypeLabel, getTypeColor, getTypeIcon } = useDocuments();
  const { address } = useAccount();
  const isBoardMember = true; // Demo: show upload for all connected wallets for UI preview
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [verifyMode, setVerifyMode] = useState(false);
  const [verifyHash, setVerifyHash] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const handleFileDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hex = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    setVerifyHash(hex);
    setVerifyMode(true);
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <p className="text-xs tracking-widest uppercase text-[rgba(245,240,232,0.35)] mb-1">Community Records</p>
          <h1 className="text-3xl font-normal tracking-tight">Documents</h1>
          <p className="text-base text-[rgba(245,240,232,0.50)] mt-2 font-medium">
            Immutable community records — verified on-chain, stored permanently on Arweave
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {isBoardMember && !verifyMode && (
            <button
              onClick={() => setShowUpload(!showUpload)}
              className={`px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200 min-h-[44px] ${
                showUpload
                  ? 'bg-[#B09B71] text-[#1a1a1a]'
                  : 'border border-[#B09B71]/30 text-[#B09B71] hover:bg-[#B09B71]/10'
              }`}
            >
              {showUpload ? ' Close Upload' : ' Upload Document'}
            </button>
          )}
          <button
            onClick={() => setVerifyMode(!verifyMode)}
            className={`px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200 min-h-[44px] ${
              verifyMode
                ? 'bg-[#B09B71] text-white'
                : 'border border-gray-700/60 text-[rgba(245,240,232,0.65)] hover:border-[#B09B71]/40 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            {verifyMode ? '← Back to Documents' : ' Verify Document'}
          </button>
        </div>
      </div>

      {showUpload && !verifyMode && isBoardMember && (
        <DocumentUploadForm onClose={() => setShowUpload(false)} />
      )}

      {verifyMode ? (
        <VerifyPanel
          hash={verifyHash}
          setHash={setVerifyHash}
          onDrop={handleFileDrop}
          dragOver={dragOver}
          setDragOver={setDragOver}
        />
      ) : (
        <>
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 card-enter card-enter-delay-1">
            {[
              { value: documentCount, label: 'Total Documents', color: 'text-[#B09B71]' },
              { value: '', label: 'All Verified', color: 'text-[#3A7D6F]' },
              { value: '∞', label: 'Permanent Storage', color: 'text-[#5A7A9A]' },
              { value: '0', label: 'Can Be Altered', color: 'text-[#B09B71]' },
            ].map(({ value, label, color }) => (
              <div key={label} className="glass-card rounded-2xl hover-lift p-6">
                <p className={`text-3xl font-normal ${color} mb-1`}>{value}</p>
                <p className="text-xs tracking-widest uppercase text-[rgba(245,240,232,0.35)]">{label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6 card-enter card-enter-delay-2">
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-3.5 rounded-xl bg-gray-900/60 border border-gray-700/60 text-sm placeholder-gray-600 focus:border-[#B09B71]/50 focus:outline-none focus:ring-1 focus:ring-[#B09B71]/20 transition-all text-[rgba(245,240,232,0.90)]"
            />
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedType(null)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all min-h-[44px] ${
                  selectedType === null
                    ? 'bg-[#B09B71]/15 text-[#B09B71] border border-[#B09B71]/30'
                    : 'text-[rgba(245,240,232,0.50)] border border-gray-700/60 hover:border-gray-600/60 hover:text-[rgba(245,240,232,0.65)]'
                }`}
              >
                All Types
              </button>
              {Object.entries(DOC_TYPE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedType(Number(key))}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all min-h-[44px] ${
                    selectedType === Number(key)
                      ? 'bg-[#B09B71]/15 text-[#B09B71] border border-[#B09B71]/30'
                      : 'text-[rgba(245,240,232,0.50)] border border-gray-700/60 hover:border-gray-600/60 hover:text-[rgba(245,240,232,0.65)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Document List */}
          {documentCount === 0 ? (
            <div className="glass-card rounded-2xl hover-lift p-14 text-center card-enter card-enter-delay-3">
              <div className="w-20 h-20 rounded-2xl bg-[#B09B71]/10 border border-[#B09B71]/20 flex items-center justify-center text-4xl mx-auto mb-6">
                
              </div>
              <h3 className="text-xl font-bold mb-3">No documents registered yet</h3>
              <p className="text-sm text-[rgba(245,240,232,0.50)] max-w-md mx-auto leading-relaxed mb-6">
                CC&Rs, meeting minutes, budgets, and all governing documents will appear here
                once registered on-chain. Every document is permanently stored and verifiable.
              </p>
              <div className="glass-card rounded-xl hover-lift p-5 max-w-sm mx-auto bg-[#1a1a1a]/30">
                <p className="text-xs text-[#D4C4A0] leading-relaxed">
                   Unlike traditional HOA software, documents stored here cannot be altered,
                  deleted, or selectively shared — not even by the board.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 card-enter card-enter-delay-3">
              {Array.from({ length: documentCount }, (_, i) => (
                <DocumentCard
                  key={i}
                  docId={i}
                  getTypeLabel={getTypeLabel}
                  getTypeColor={getTypeColor}
                  getTypeIcon={getTypeIcon}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const TYPE_LEFT_BORDERS: Record<string, string> = {};

function DocumentCard({
  docId,
  getTypeLabel,
  getTypeColor,
  getTypeIcon,
}: {
  docId: number;
  getTypeLabel: (t: number) => string;
  getTypeColor: (t: number) => string;
  getTypeIcon: (t: number) => string;
}) {
  const { document: doc, isLoading } = useDocument(docId);
  const [expanded, setExpanded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  // Prevent infinite skeleton — if loading for > 8s and no doc, show empty state
  useEffect(() => {
    if (!isLoading) return;
    const t = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(t);
  }, [isLoading]);

  if (isLoading && !timedOut) {
    return (
      <div className="glass-card rounded-2xl hover-lift p-6">
        <div className="flex items-center gap-4">
          <div className="skeleton w-12 h-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 rounded w-1/3" />
            <div className="skeleton h-3 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="glass-card rounded-2xl hover-lift p-4 border border-gray-800/60 opacity-50">
        <p className="text-xs text-[rgba(245,240,232,0.35)] italic">Document #{docId} could not be loaded</p>
      </div>
    );
  }

  const color = getTypeColor(doc.docType);
  const leftBorder = TYPE_LEFT_BORDERS[color] || 'border-l-[#B09B71]/60';
  const date = new Date(doc.timestamp * 1000);

  return (
    <div
      className={`glass-card rounded-2xl hover-lift p-6 cursor-pointer`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-4">
        {/* Type Icon */}
        <div className="w-12 h-12 rounded-xl bg-[rgba(176,155,113,0.08)] border border-[rgba(176,155,113,0.15)] flex items-center justify-center text-xl shrink-0">
          {getTypeIcon(doc.docType)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-base text-[rgba(245,240,232,0.90)]">{doc.title}</h3>
            <span className="text-[11px] px-2 py-0.5 rounded-lg bg-[rgba(176,155,113,0.08)] text-[#B09B71] border border-[rgba(176,155,113,0.15)]">
              {getTypeLabel(doc.docType)}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-lg bg-[rgba(42,93,79,0.10)] text-[#3A7D6F] border border-[rgba(42,93,79,0.20)]">
              Verified
            </span>
            {doc.supersedes > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-lg bg-[rgba(176,155,113,0.10)] text-[#B09B71] font-semibold">
                Supersedes #{doc.supersedes}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-[rgba(245,240,232,0.35)]">
            <span className="font-medium">
              {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-gray-700">·</span>
            <span className="font-mono">{doc.uploadedBy.slice(0, 6)}...{doc.uploadedBy.slice(-4)}</span>
          </div>
        </div>

        {/* Expand indicator */}
        <span className={`text-[rgba(245,240,232,0.35)] transition-transform duration-200 text-sm shrink-0 ${expanded ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-5 pt-5 border-t border-gray-800/60 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-[rgba(245,240,232,0.35)] font-semibold uppercase tracking-wider mb-2">Content Hash (SHA-256)</p>
              <p className="text-xs font-mono text-[rgba(245,240,232,0.65)] break-all bg-gray-800/50 p-3 rounded-xl border border-gray-700/40">
                {doc.contentHash}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[rgba(245,240,232,0.35)] font-semibold uppercase tracking-wider mb-2">Arweave TX</p>
              <a
                href={`https://arweave.net/${doc.arweaveTxId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-[#B09B71] hover:text-[#D4C4A0] hover:underline break-all"
                onClick={(e) => e.stopPropagation()}
              >
                {doc.arweaveTxId || '—'}
              </a>
            </div>
          </div>
          {doc.ipfsCid && (
            <div>
              <p className="text-[10px] text-[rgba(245,240,232,0.35)] font-semibold uppercase tracking-wider mb-2">IPFS CID</p>
              <p className="text-xs font-mono text-[rgba(245,240,232,0.65)] break-all">{doc.ipfsCid}</p>
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            <a
              href={`https://arweave.net/${doc.arweaveTxId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-[#B09B71]/8 border border-[#B09B71]/20 text-xs text-[#B09B71] hover:bg-[#B09B71]/15 transition-colors font-semibold min-h-[44px] flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
               Download from Arweave
            </a>
            <a
              href={`https://sepolia.basescan.org/address/${doc.uploadedBy}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-gray-800/60 border border-gray-700/60 text-xs text-[rgba(245,240,232,0.50)] hover:text-[rgba(245,240,232,0.65)] transition-colors font-semibold min-h-[44px] flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
               View on Basescan
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function VerifyPanel({
  hash,
  setHash,
  onDrop,
  dragOver,
  setDragOver,
}: {
  hash: string;
  setHash: (h: string) => void;
  onDrop: (e: React.DragEvent) => void;
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
}) {
  return (
    <div className="space-y-6 page-enter">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`p-14 rounded-2xl border-2 border-dashed text-center transition-all duration-300 cursor-pointer ${
          dragOver
            ? 'border-[#B09B71] bg-[#1a1a1a]/50 shadow-[0_0_40px_rgba(201,169,110,0.2)]'
            : 'drop-zone-idle border-gray-600/40 bg-gray-900/30 hover:border-[#B09B71]/40 hover:bg-[#1a1a1a]/30'
        }`}
      >
        <div className={`w-16 h-16 rounded-2xl bg-[#B09B71]/10 border border-[#B09B71]/20 flex items-center justify-center text-3xl mx-auto mb-5 transition-transform duration-300 ${dragOver ? 'scale-110' : ''}`}>
          
        </div>
        <h3 className="text-xl font-bold mb-2 text-[rgba(245,240,232,0.90)]">Drop a file to verify</h3>
        <p className="text-sm text-[rgba(245,240,232,0.50)] max-w-sm mx-auto leading-relaxed">
          We&apos;ll compute the SHA-256 hash and check it against the on-chain registry.
          <br />
          <span className="text-[rgba(245,240,232,0.35)]">The file never leaves your device.</span>
        </p>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-800" />
        <span className="text-xs text-[rgba(245,240,232,0.35)] font-medium">or paste a hash</span>
        <div className="flex-1 h-px bg-gray-800" />
      </div>

      {/* Hash input */}
      <input
        type="text"
        placeholder="0x..."
        value={hash}
        onChange={(e) => setHash(e.target.value)}
        className="w-full px-4 py-4 rounded-xl bg-gray-900/60 border border-gray-700/60 text-sm font-mono placeholder-gray-600 focus:border-[#B09B71]/50 focus:outline-none focus:ring-1 focus:ring-[#B09B71]/20 transition-all text-[rgba(245,240,232,0.80)]"
      />

      {/* Hash result placeholder */}
      {hash && (
        <div className="glass-card rounded-2xl hover-lift p-6">
          <p className="text-xs tracking-widest uppercase text-[rgba(245,240,232,0.35)] mb-3">Hash to verify</p>
          <p className="text-xs font-mono text-[rgba(245,240,232,0.65)] break-all bg-gray-800/50 p-3 rounded-xl border border-gray-700/40 mb-4">{hash}</p>
          <div className="flex items-center gap-2 text-sm text-[rgba(245,240,232,0.50)]">
            <div className="w-4 h-4 border-2 border-[#B09B71]/40 border-t-[#B09B71] rounded-full animate-spin" />
            Checking on-chain registry...
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="glass-card rounded-2xl hover-lift p-6 bg-[#1a1a1a]/30">
        <h4 className="text-sm font-bold text-[#D4C4A0] mb-3">How verification works</h4>
        <div className="space-y-3">
          {[
            { n: 1, text: 'Drop the document file (PDF, spreadsheet, etc.)' },
            { n: 2, text: 'Your browser computes the SHA-256 hash locally' },
            { n: 3, text: 'We check if that hash exists in the on-chain DocumentRegistry' },
            { n: 4, text: 'If it matches → the document is authentic and unaltered ' },
            { n: 5, text: "If it doesn't match → the file has been modified or isn't registered" },
          ].map(({ n, text }) => (
            <div key={n} className="flex gap-3 items-start">
              <div className="w-5 h-5 rounded-full bg-[#B09B71]/15 border border-[#B09B71]/30 flex items-center justify-center text-[10px] font-bold text-[#B09B71] shrink-0 mt-0.5">
                {n}
              </div>
              <p className="text-xs text-[rgba(245,240,232,0.50)] leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DocumentUploadForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState<number>(9);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFileSelect = (file: File) => {
    setFileName(file.name);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[DocumentUpload] Submitted:', { title, docType, fileName });
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); onClose(); }, 2000);
  };

  return (
    <div className="glass-card rounded-2xl p-6 mb-8 border border-[#B09B71]/20 page-enter">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold">Upload Document</h2>
          <p className="text-xs text-[rgba(245,240,232,0.35)] mt-0.5">Board members only · Arweave upload handled server-side</p>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full bg-[#B09B71]/10 text-[#B09B71] border border-[#B09B71]/20 font-bold">
           Board Access
        </span>
      </div>

      {submitted ? (
        <div className="text-center py-8">
          <CheckCircle className="w-8 h-8 text-[#3A7D6F] mx-auto mb-3" />
          <p className="text-[#3A7D6F] font-semibold">Upload queued successfully!</p>
          <p className="text-xs text-[rgba(245,240,232,0.35)] mt-1">Arweave transaction will be processed shortly.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[rgba(245,240,232,0.50)] font-medium mb-2">Document Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Board Meeting Minutes — March 2026"
                required
                className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700/60 text-sm placeholder-gray-600 focus:border-[#B09B71]/50 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-[rgba(245,240,232,0.50)] font-medium mb-2">Document Type</label>
              <select
                value={docType}
                onChange={e => setDocType(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700/60 text-sm focus:border-[#B09B71]/50 focus:outline-none transition-all"
              >
                {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Drag & drop area */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('doc-file-input')?.click()}
            className={`relative p-10 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all duration-300 ${
              dragOver
                ? 'border-[#B09B71] bg-[#B09B71]/5 shadow-[0_0_30px_rgba(201,169,110,0.15)]'
                : fileName
                ? 'border-[rgba(42,93,79,0.30)] bg-[#3A7D6F]/5'
                : 'border-gray-700/60 hover:border-[#B09B71]/40 hover:bg-[#1a1a1a]/20'
            }`}
          >
            <input
              id="doc-file-input"
              type="file"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
            />
            <div className={`text-4xl mb-3 transition-transform ${dragOver ? 'scale-110' : ''}`}>
              {fileName ? '' : ''}
            </div>
            {fileName ? (
              <>
                <p className="font-semibold text-[#3A7D6F] text-sm">{fileName}</p>
                <p className="text-xs text-[rgba(245,240,232,0.35)] mt-1">Click to change file</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-sm text-[rgba(245,240,232,0.65)]">Drop file here or click to browse</p>
                <p className="text-xs text-[rgba(245,240,232,0.35)] mt-1">PDF, DOCX, XLSX, images accepted</p>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-700/60 text-sm font-medium hover:bg-gray-800/40 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !fileName}
              className="flex-1 py-3 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] disabled:opacity-50 text-[#1a1a1a] text-sm font-bold transition-all"
            >
              Queue for Upload
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
