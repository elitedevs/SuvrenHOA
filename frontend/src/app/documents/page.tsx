'use client';

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useDocuments, useDocument, DOC_TYPE_LABELS } from '@/hooks/useDocuments';
import { createLogger } from '@/lib/logger';

const log = createLogger('DocumentUpload');

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
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-8 sm:py-12 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Community Records</p>
          <h1 className="text-3xl font-normal tracking-tight">Documents</h1>
          <p className="text-[15px] mt-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Immutable community records — verified on-chain, stored permanently on Arweave
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {isBoardMember && !verifyMode && (
            <button
              onClick={() => setShowUpload(!showUpload)}
              className={`px-5 py-3 rounded-md text-sm font-bold transition-all duration-200 min-h-[44px] ${
                showUpload
                  ? 'bg-[#c9a96e] text-[#1a1a1a] shadow-[0_0_20px_rgba(201,169,110,0.25)]'
                  : 'border border-[#c9a96e]/30 text-[#c9a96e] hover:bg-[#c9a96e]/10'
              }`}
            >
              {showUpload ? ' Close Upload' : ' Upload Document'}
            </button>
          )}
          <button
            onClick={() => setVerifyMode(!verifyMode)}
            className={`px-5 py-3 rounded-md text-sm font-bold transition-all duration-200 min-h-[44px] ${
              verifyMode
                ? 'bg-[#c9a96e] text-white shadow-[0_0_20px_rgba(201,169,110,0.25)]'
                : 'border border-gray-700/60 text-gray-300 hover:border-[#c9a96e]/40 hover:text-white hover:bg-white/[0.03]'
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 page-enter page-enter-delay-1">
            {[
              { value: documentCount, label: 'Total Documents', color: 'text-[#c9a96e]' },
              { value: '', label: 'All Verified', color: 'text-green-400' },
              { value: '∞', label: 'Permanent Storage', color: 'text-blue-400' },
              { value: '0', label: 'Can Be Altered', color: 'text-amber-400' },
            ].map(({ value, label, color }) => (
              <div key={label} className="glass-card rounded-lg hover-lift p-6">
                <p className={`text-3xl font-normal ${color} mb-1`}>{value}</p>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6 page-enter page-enter-delay-2">
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-3.5 rounded-md bg-gray-900/60 border border-gray-700/60 text-sm placeholder-gray-600 focus:border-[#c9a96e]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a96e]/20 transition-all text-gray-100"
            />
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedType(null)}
                className={`px-4 py-2.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all min-h-[44px] ${
                  selectedType === null
                    ? 'bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/30'
                    : 'text-gray-400 border border-gray-700/60 hover:border-gray-600/60 hover:text-gray-300'
                }`}
              >
                All Types
              </button>
              {Object.entries(DOC_TYPE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedType(Number(key))}
                  className={`px-4 py-2.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all min-h-[44px] ${
                    selectedType === Number(key)
                      ? 'bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/30'
                      : 'text-gray-400 border border-gray-700/60 hover:border-gray-600/60 hover:text-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Document List */}
          {documentCount === 0 ? (
            <div className="glass-card rounded-lg hover-lift p-14 text-center page-enter page-enter-delay-3">
                            <h3 className="text-xl font-bold mb-3">No documents registered yet</h3>
              <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed mb-6">
                CC&Rs, meeting minutes, budgets, and all governing documents will appear here
                once registered on-chain. Every document is permanently stored and verifiable.
              </p>
              <div className="glass-card rounded-md hover-lift p-5 max-w-sm mx-auto border-l-2 border-l-[#c9a96e]/40 bg-[#1a1a1a]/30">
                <p className="text-xs text-[#e8d5a3] leading-relaxed">
                   Unlike traditional HOA software, documents stored here cannot be altered,
                  deleted, or selectively shared — not even by the board.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 page-enter page-enter-delay-3">
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

const TYPE_LEFT_BORDERS: Record<string, string> = {
  gold: 'border-l-[#c9a96e]/60',
  green: 'border-l-green-500/60',
  blue: 'border-l-blue-500/60',
  amber: 'border-l-amber-500/60',
  red: 'border-l-red-500/60',
  cyan: 'border-l-cyan-500/60',
  pink: 'border-l-pink-500/60',
};

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

  if (isLoading || !doc) {
    return (
      <div className="glass-card rounded-lg hover-lift p-6">
        <div className="flex items-center gap-4">
          <div className="skeleton w-12 h-12 rounded-md" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 rounded w-1/3" />
            <div className="skeleton h-3 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  const color = getTypeColor(doc.docType);
  const leftBorder = TYPE_LEFT_BORDERS[color] || 'border-l-[#c9a96e]/60';
  const date = new Date(doc.timestamp * 1000);

  return (
    <div
      className={`glass-card rounded-lg hover-lift p-6 cursor-pointer border-l-2 ${leftBorder}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-4">
        {/* Type Icon */}
        <div className={`w-12 h-12 rounded-md bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center text-xl shrink-0`}>
          {getTypeIcon(doc.docType)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-base text-gray-100">{doc.title}</h3>
            <span className={`text-[11px] px-2 py-0.5 rounded-lg bg-${color}-500/10 text-${color}-400 border border-${color}-500/20 font-semibold`}>
              {getTypeLabel(doc.docType)}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 font-semibold">
               Verified
            </span>
            {doc.supersedes > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 font-semibold">
                Supersedes #{doc.supersedes}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="font-medium">
              {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-gray-700">·</span>
            <span className="font-mono">{doc.uploadedBy.slice(0, 6)}...{doc.uploadedBy.slice(-4)}</span>
          </div>
        </div>

        {/* Expand indicator */}
        <span className={`text-gray-500 transition-transform duration-200 text-sm shrink-0 ${expanded ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-5 pt-5 border-t border-gray-800/60 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-2">Content Hash (SHA-256)</p>
              <p className="text-xs font-mono text-gray-300 break-all bg-gray-800/50 p-3 rounded-md border border-gray-700/40">
                {doc.contentHash}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-2">Arweave TX</p>
              <a
                href={`https://arweave.net/${doc.arweaveTxId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-[#c9a96e] hover:text-[#e8d5a3] hover:underline break-all"
                onClick={(e) => e.stopPropagation()}
              >
                {doc.arweaveTxId || '—'}
              </a>
            </div>
          </div>
          {doc.ipfsCid && (
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-2">IPFS CID</p>
              <p className="text-xs font-mono text-gray-300 break-all">{doc.ipfsCid}</p>
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            <a
              href={`https://arweave.net/${doc.arweaveTxId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-md bg-[#c9a96e]/8 border border-[#c9a96e]/20 text-xs text-[#c9a96e] hover:bg-[#c9a96e]/15 transition-colors font-semibold min-h-[44px] flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
               Download from Arweave
            </a>
            <a
              href={`https://sepolia.basescan.org/address/${doc.uploadedBy}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-md bg-gray-800/60 border border-gray-700/60 text-xs text-gray-400 hover:text-gray-300 transition-colors font-semibold min-h-[44px] flex items-center"
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
        className={`p-14 rounded-lg border-2 border-dashed text-center transition-all duration-300 cursor-pointer ${
          dragOver
            ? 'border-[#c9a96e] bg-[#1a1a1a]/50 shadow-[0_0_40px_rgba(201,169,110,0.2)]'
            : 'drop-zone-idle border-gray-600/40 bg-gray-900/30 hover:border-[#c9a96e]/40 hover:bg-[#1a1a1a]/30'
        }`}
      >
        <div className={`w-16 h-16 rounded-lg bg-[#c9a96e]/10 border border-[#c9a96e]/20 flex items-center justify-center text-3xl mx-auto mb-5 transition-transform duration-300 ${dragOver ? 'scale-110' : ''}`}>
          
        </div>
        <h3 className="text-xl font-bold mb-2 text-gray-100">Drop a file to verify</h3>
        <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
          We&apos;ll compute the SHA-256 hash and check it against the on-chain registry.
          <br />
          <span className="text-gray-500">The file never leaves your device.</span>
        </p>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-800" />
        <span className="text-xs text-gray-500 font-medium">or paste a hash</span>
        <div className="flex-1 h-px bg-gray-800" />
      </div>

      {/* Hash input */}
      <input
        type="text"
        placeholder="0x..."
        value={hash}
        onChange={(e) => setHash(e.target.value)}
        className="w-full px-4 py-4 rounded-md bg-gray-900/60 border border-gray-700/60 text-sm font-mono placeholder-gray-600 focus:border-[#c9a96e]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a96e]/20 transition-all text-gray-200"
      />

      {/* Hash result placeholder */}
      {hash && (
        <div className="glass-card rounded-lg hover-lift p-6">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Hash to verify</p>
          <p className="text-xs font-mono text-gray-300 break-all bg-gray-800/50 p-3 rounded-md border border-gray-700/40 mb-4">{hash}</p>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="w-4 h-4 border-2 border-[#c9a96e]/40 border-t-[#c9a96e] rounded-full animate-spin" />
            Checking on-chain registry...
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="glass-card rounded-lg hover-lift p-6 border-l-2 border-l-[#c9a96e]/40 bg-[#1a1a1a]/30">
        <h4 className="text-sm font-bold text-[#e8d5a3] mb-3">How verification works</h4>
        <div className="space-y-3">
          {[
            { n: 1, text: 'Drop the document file (PDF, spreadsheet, etc.)' },
            { n: 2, text: 'Your browser computes the SHA-256 hash locally' },
            { n: 3, text: 'We check if that hash exists in the on-chain DocumentRegistry' },
            { n: 4, text: 'If it matches → the document is authentic and unaltered ' },
            { n: 5, text: "If it doesn't match → the file has been modified or isn't registered" },
          ].map(({ n, text }) => (
            <div key={n} className="flex gap-3 items-start">
              <div className="w-5 h-5 rounded-full bg-[#c9a96e]/15 border border-[#c9a96e]/30 flex items-center justify-center text-[10px] font-bold text-[#c9a96e] shrink-0 mt-0.5">
                {n}
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{text}</p>
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
    log.info('Submitted', { title, docType, fileName });
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); onClose(); }, 2000);
  };

  return (
    <div className="glass-card rounded-lg p-6 mb-8 border border-[#c9a96e]/20 page-enter">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold">Upload Document</h2>
          <p className="text-xs text-gray-500 mt-0.5">Board members only · Arweave upload handled server-side</p>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full bg-[#c9a96e]/10 text-[#c9a96e] border border-[#c9a96e]/20 font-bold">
           Board Access
        </span>
      </div>

      {submitted ? (
        <div className="text-center py-8">
                    <p className="text-green-400 font-semibold">Upload queued successfully!</p>
          <p className="text-xs text-gray-500 mt-1">Arweave transaction will be processed shortly.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 font-medium mb-2">Document Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Board Meeting Minutes — March 2026"
                required
                className="w-full px-4 py-3 rounded-md bg-gray-800/80 border border-gray-700/60 text-sm placeholder-gray-600 focus:border-[#c9a96e]/50 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 font-medium mb-2">Document Type</label>
              <select
                value={docType}
                onChange={e => setDocType(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-md bg-gray-800/80 border border-gray-700/60 text-sm focus:border-[#c9a96e]/50 focus:outline-none transition-all"
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
            className={`relative p-10 rounded-lg border-2 border-dashed text-center cursor-pointer transition-all duration-300 ${
              dragOver
                ? 'border-[#c9a96e] bg-[#c9a96e]/5 shadow-[0_0_30px_rgba(201,169,110,0.15)]'
                : fileName
                ? 'border-green-500/40 bg-green-500/5'
                : 'border-gray-700/60 hover:border-[#c9a96e]/40 hover:bg-[#1a1a1a]/20'
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
                <p className="font-semibold text-green-400 text-sm">{fileName}</p>
                <p className="text-xs text-gray-500 mt-1">Click to change file</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-sm text-gray-300">Drop file here or click to browse</p>
                <p className="text-xs text-gray-500 mt-1">PDF, DOCX, XLSX, images accepted</p>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-md border border-gray-700/60 text-sm font-medium hover:bg-gray-800/40 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !fileName}
              className="flex-1 py-3 rounded-md bg-[#c9a96e] hover:bg-[#e8d5a3] disabled:opacity-50 text-[#1a1a1a] text-sm font-bold transition-all"
            >
              Queue for Upload
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
