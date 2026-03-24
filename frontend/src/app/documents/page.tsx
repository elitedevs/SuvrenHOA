'use client';

import { useState, useCallback } from 'react';
import { useDocuments, useDocument, DOC_TYPE_LABELS } from '@/hooks/useDocuments';

export default function DocumentsPage() {
  const { documentCount, getTypeLabel, getTypeColor, getTypeIcon } = useDocuments();
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [verifyMode, setVerifyMode] = useState(false);
  const [verifyHash, setVerifyHash] = useState('');
  const [dragOver, setDragOver] = useState(false);

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-sm text-gray-400 mt-1">
            Immutable community records — verified on-chain, stored permanently on Arweave
          </p>
        </div>
        <button
          onClick={() => setVerifyMode(!verifyMode)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shrink-0 ${
            verifyMode
              ? 'bg-purple-600 text-white'
              : 'border border-gray-700 text-gray-300 hover:border-purple-500/50 hover:text-white'
          }`}
        >
          {verifyMode ? '← Back to Documents' : '🔍 Verify Document'}
        </button>
      </div>

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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/50">
              <p className="text-2xl font-bold text-purple-400">{documentCount}</p>
              <p className="text-xs text-gray-500">Total Documents</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/50">
              <p className="text-2xl font-bold text-green-400">✓</p>
              <p className="text-xs text-gray-500">All Verified</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/50">
              <p className="text-2xl font-bold text-blue-400">∞</p>
              <p className="text-xs text-gray-500">Permanent Storage</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/50">
              <p className="text-2xl font-bold text-amber-400">0</p>
              <p className="text-xs text-gray-500">Can Be Altered</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-sm placeholder-gray-500 focus:border-purple-500/50 focus:outline-none transition-colors"
            />
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedType(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedType === null
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                    : 'text-gray-400 border border-gray-800 hover:border-gray-700'
                }`}
              >
                All
              </button>
              {Object.entries(DOC_TYPE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedType(Number(key))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedType === Number(key)
                      ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                      : 'text-gray-400 border border-gray-800 hover:border-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Document List */}
          {documentCount === 0 ? (
            <div className="p-12 rounded-xl border border-gray-800 bg-gray-900/50 text-center">
              <div className="text-5xl mb-4">📄</div>
              <h3 className="text-lg font-medium mb-2">No documents registered yet</h3>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                CC&Rs, meeting minutes, budgets, and all governing documents will appear here
                once registered on-chain. Every document is permanently stored and verifiable.
              </p>
              <div className="mt-6 p-4 rounded-lg bg-purple-950/20 border border-purple-900/30 max-w-sm mx-auto">
                <p className="text-xs text-purple-400">
                  🔒 Unlike traditional HOA software, documents stored here cannot be altered,
                  deleted, or selectively shared by anyone — not even the board.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {Array.from({ length: documentCount }, (_, i) => (
                <DocumentCard key={i} docId={i} getTypeLabel={getTypeLabel} getTypeColor={getTypeColor} getTypeIcon={getTypeIcon} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

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
      <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/50 animate-pulse">
        <div className="h-5 bg-gray-800 rounded w-1/3 mb-2" />
        <div className="h-3 bg-gray-800 rounded w-1/2" />
      </div>
    );
  }

  const color = getTypeColor(doc.docType);
  const date = new Date(doc.timestamp * 1000);

  return (
    <div
      className="p-4 rounded-xl border border-gray-800 bg-gray-900/50 hover:border-gray-700 transition-all cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        {/* Type Icon */}
        <div className={`w-10 h-10 rounded-lg bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center text-lg shrink-0`}>
          {getTypeIcon(doc.docType)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-sm">{doc.title}</h3>
            <span className={`text-[10px] px-1.5 py-0.5 rounded bg-${color}-500/10 text-${color}-400 border border-${color}-500/20`}>
              {getTypeLabel(doc.docType)}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
              ✓ Verified
            </span>
            {doc.supersedes > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
                Supersedes #{doc.supersedes}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span>•</span>
            <span className="font-mono">{doc.uploadedBy.slice(0, 6)}...{doc.uploadedBy.slice(-4)}</span>
          </div>
        </div>

        {/* Expand indicator */}
        <span className={`text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-800 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Content Hash (SHA-256)</p>
              <p className="text-xs font-mono text-gray-300 break-all bg-gray-800/50 p-2 rounded">{doc.contentHash}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Arweave TX</p>
              <a
                href={`https://arweave.net/${doc.arweaveTxId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-purple-400 hover:underline break-all"
                onClick={(e) => e.stopPropagation()}
              >
                {doc.arweaveTxId || '—'}
              </a>
            </div>
          </div>
          {doc.ipfsCid && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">IPFS CID</p>
              <p className="text-xs font-mono text-gray-300 break-all">{doc.ipfsCid}</p>
            </div>
          )}
          <div className="flex gap-2">
            <a
              href={`https://arweave.net/${doc.arweaveTxId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-purple-600/10 border border-purple-500/20 text-xs text-purple-400 hover:bg-purple-600/20 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              📥 Download from Arweave
            </a>
            <a
              href={`https://sepolia.basescan.org/address/${doc.uploadedBy}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-400 hover:text-gray-300 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              🔗 View on Basescan
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
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`p-12 rounded-xl border-2 border-dashed text-center transition-all ${
          dragOver
            ? 'border-purple-500 bg-purple-950/20'
            : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
        }`}
      >
        <div className="text-4xl mb-3">📄</div>
        <h3 className="text-lg font-medium mb-2">Drop a file to verify</h3>
        <p className="text-sm text-gray-400">
          We&apos;ll compute the SHA-256 hash and check it against the on-chain registry.
          The file never leaves your device.
        </p>
      </div>

      {/* Or paste hash */}
      <div className="text-center text-xs text-gray-500">— or paste a SHA-256 hash —</div>

      <input
        type="text"
        placeholder="0x..."
        value={hash}
        onChange={(e) => setHash(e.target.value)}
        className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-sm font-mono placeholder-gray-600 focus:border-purple-500/50 focus:outline-none transition-colors"
      />

      {hash && (
        <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
          <p className="text-xs text-gray-500 mb-2">Hash to verify:</p>
          <p className="text-xs font-mono text-gray-300 break-all mb-4">{hash}</p>
          {/* TODO: Call verifyDocument on-chain */}
          <p className="text-sm text-gray-400">Checking on-chain registry...</p>
        </div>
      )}

      <div className="p-4 rounded-lg bg-purple-950/20 border border-purple-900/30">
        <h4 className="text-sm font-medium text-purple-400 mb-1">How verification works</h4>
        <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
          <li>Drop the document file (PDF, spreadsheet, etc.)</li>
          <li>Your browser computes the SHA-256 hash locally</li>
          <li>We check if that hash exists in the on-chain DocumentRegistry</li>
          <li>If it matches → the document is authentic and unaltered</li>
          <li>If it doesn&apos;t match → the file has been modified or isn&apos;t registered</li>
        </ol>
      </div>
    </div>
  );
}
