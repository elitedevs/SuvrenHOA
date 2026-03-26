'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useContracts } from '@/hooks/useContracts';
import { useProperty } from '@/hooks/useProperty';
import Link from 'next/link';

export default function AdminPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-5xl mb-2">⚙️</div>
        <p className="text-gray-400 text-base font-medium">Sign in with board wallet to access admin</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 page-enter">
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">Board Access</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Administration</h1>
        <p className="text-base text-gray-400 mt-2 font-medium">
          Mint properties, manage roles, and register documents on-chain
        </p>
      </div>

      {/* Stats first */}
      <CommunityStats />

      <div className="h-8" />

      {/* Board Access */}
      <div className="mb-8">
        <BoardAccessCard />
      </div>

      {/* Admin tools */}
      <div className="space-y-8">
        <MintPropertyCard />
        <RegisterDocumentCard />
      </div>
    </div>
  );
}

function MintPropertyCard() {
  const { propertyNFT } = useContracts();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const [owner, setOwner] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [sqft, setSqft] = useState('');

  const handleMint = () => {
    if (!owner || !lotNumber || !streetAddress) return;
    writeContract({
      ...propertyNFT,
      functionName: 'mintProperty',
      args: [
        owner as `0x${string}`,
        BigInt(lotNumber || 0),
        streetAddress,
        BigInt(sqft || '0'),
      ],
    });
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden border-l-2 border-l-[#c9a96e]/50">
      {/* Section header */}
      <div className="px-8 py-5 border-b border-gray-800/60 bg-[#c9a96e]/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#c9a96e]/10 border border-[#c9a96e]/25 flex items-center justify-center text-xl">
            🏠
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-100">Mint Property NFT</h2>
            <p className="text-xs text-gray-500 mt-0.5">Assign a soulbound property token to a homeowner wallet</p>
          </div>
        </div>
      </div>

      <div className="px-8 py-7">
        {isSuccess ? (
          <div className="glass-card-success rounded-xl p-6 text-center border-l-2 border-l-green-500/50">
            <div className="text-3xl mb-3">✅</div>
            <p className="text-green-400 font-bold text-base mb-1">Property #{lotNumber} Minted!</p>
            {hash && (
              <a
                href={`https://sepolia.basescan.org/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#c9a96e] hover:underline font-mono"
              >
                View transaction →
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Owner Wallet Address
                </label>
                <input
                  type="text"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3.5 rounded-xl bg-gray-900/60 border border-gray-700/60 text-sm font-mono placeholder-gray-600 focus:border-[#c9a96e]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a96e]/20 transition-all text-gray-200 min-h-[52px]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Lot Number
                </label>
                <input
                  type="number"
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                  placeholder="1–150"
                  className="w-full px-4 py-3.5 rounded-xl bg-gray-900/60 border border-gray-700/60 text-sm placeholder-gray-600 focus:border-[#c9a96e]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a96e]/20 transition-all text-gray-100 min-h-[52px]"
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="123 Faircroft Dr"
                  className="w-full px-4 py-3.5 rounded-xl bg-gray-900/60 border border-gray-700/60 text-sm placeholder-gray-600 focus:border-[#c9a96e]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a96e]/20 transition-all text-gray-100 min-h-[52px]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Square Footage
                </label>
                <input
                  type="number"
                  value={sqft}
                  onChange={(e) => setSqft(e.target.value)}
                  placeholder="2500"
                  className="w-full px-4 py-3.5 rounded-xl bg-gray-900/60 border border-gray-700/60 text-sm placeholder-gray-600 focus:border-[#c9a96e]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a96e]/20 transition-all text-gray-100 min-h-[52px]"
                />
              </div>
            </div>

            <button
              onClick={handleMint}
              disabled={isPending || isConfirming || !owner || !lotNumber || !streetAddress}
              className="w-full py-4 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold transition-all duration-200 shadow-[0_0_20px_rgba(201,169,110,0.12)] hover:shadow-[0_0_28px_rgba(201,169,110,0.28)] min-h-[52px]"
            >
              {isPending ? '⏳ Confirm in Wallet...' :
               isConfirming ? '⛓️ Minting...' :
               '🏠 Mint Property NFT'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function RegisterDocumentCard() {
  const { documentRegistry } = useContracts();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const [title, setTitle] = useState('');
  const [arweaveTxId, setArweaveTxId] = useState('');
  const [ipfsCid, setIpfsCid] = useState('');
  const [docType, setDocType] = useState(0);
  const [fileHash, setFileHash] = useState('');

  const docTypes = ['CC&Rs', 'Minutes', 'Budget', 'Amendment', 'Resolution', 'Financial', 'Architectural', 'Notice', 'Election', 'Other'];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hex = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    setFileHash(hex);
  };

  const handleRegister = () => {
    if (!fileHash || !arweaveTxId || !title) return;
    writeContract({
      ...documentRegistry,
      functionName: 'registerDocument',
      args: [
        fileHash as `0x${string}`,
        arweaveTxId,
        ipfsCid,
        docType,
        title,
        BigInt(0),
      ],
    });
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden border-l-2 border-l-blue-500/50">
      {/* Section header */}
      <div className="px-8 py-5 border-b border-gray-800/60 bg-blue-500/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-xl">
            📄
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-100">Register Document</h2>
            <p className="text-xs text-gray-500 mt-0.5">Record an immutable document hash on-chain</p>
          </div>
        </div>
      </div>

      <div className="px-8 py-7">
        {isSuccess ? (
          <div className="glass-card-success rounded-xl p-6 text-center border-l-2 border-l-green-500/50">
            <div className="text-3xl mb-3">✅</div>
            <p className="text-green-400 font-bold text-base mb-1">Document Registered On-Chain!</p>
            {hash && (
              <a
                href={`https://sepolia.basescan.org/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#c9a96e] hover:underline font-mono"
              >
                View transaction →
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {/* File upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Document File <span className="text-gray-500 font-normal">(computes SHA-256 hash locally)</span>
              </label>
              <input
                type="file"
                onChange={handleFileSelect}
                className="w-full text-sm text-gray-400 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-gray-800 file:text-gray-300 file:text-sm file:font-semibold hover:file:bg-gray-700 file:cursor-pointer file:transition-colors"
              />
              {fileHash && (
                <div className="mt-2 px-3 py-2 rounded-lg bg-green-500/5 border border-green-500/15">
                  <p className="text-[10px] text-green-400 font-semibold uppercase tracking-wide mb-0.5">Hash computed ✓</p>
                  <p className="text-[10px] font-mono text-gray-500 break-all">{fileHash}</p>
                </div>
              )}
            </div>

            {/* Title + Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Document Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Faircroft CC&Rs 2026"
                  className="w-full px-4 py-3.5 rounded-xl bg-gray-900/60 border border-gray-700/60 text-sm placeholder-gray-600 focus:border-[#c9a96e]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a96e]/20 transition-all text-gray-100 min-h-[52px]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(Number(e.target.value))}
                  className="w-full px-4 py-3.5 rounded-xl bg-gray-900/60 border border-gray-700/60 text-sm focus:border-[#c9a96e]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a96e]/20 transition-all text-gray-100 min-h-[52px] appearance-none"
                >
                  {docTypes.map((t, i) => (
                    <option key={i} value={i}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Arweave + IPFS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Arweave TX ID</label>
                <input
                  type="text"
                  value={arweaveTxId}
                  onChange={(e) => setArweaveTxId(e.target.value)}
                  placeholder="arweave-transaction-id"
                  className="w-full px-4 py-3.5 rounded-xl bg-gray-900/60 border border-gray-700/60 text-sm font-mono placeholder-gray-600 focus:border-[#c9a96e]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a96e]/20 transition-all text-gray-200 min-h-[52px]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  IPFS CID <span className="text-gray-600 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={ipfsCid}
                  onChange={(e) => setIpfsCid(e.target.value)}
                  placeholder="bafybei..."
                  className="w-full px-4 py-3.5 rounded-xl bg-gray-900/60 border border-gray-700/60 text-sm font-mono placeholder-gray-600 focus:border-[#c9a96e]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a96e]/20 transition-all text-gray-200 min-h-[52px]"
                />
              </div>
            </div>

            <button
              onClick={handleRegister}
              disabled={isPending || isConfirming || !fileHash || !arweaveTxId || !title}
              className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold transition-all duration-200 shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:shadow-[0_0_28px_rgba(59,130,246,0.25)] min-h-[52px]"
            >
              {isPending ? '⏳ Confirm in Wallet...' :
               isConfirming ? '⛓️ Registering...' :
               '📄 Register Document On-Chain'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CommunityStats() {
  const { totalSupply } = useProperty();

  const stats = [
    { value: totalSupply, label: 'Properties Minted', color: 'text-[#c9a96e]', icon: '🏠' },
    { value: 150, label: 'Max Lots', color: 'text-blue-400', icon: '📍' },
    { value: totalSupply, label: 'Total Votes', color: 'text-green-400', icon: '🗳️' },
    { value: 150 - totalSupply, label: 'Lots Remaining', color: 'text-amber-400', icon: '🔓' },
  ];

  // Progress bar
  const fillPct = totalSupply > 0 ? (totalSupply / 150) * 100 : 0;

  return (
    <div className="glass-card rounded-2xl overflow-hidden border-l-2 border-l-amber-500/50">
      {/* Section header */}
      <div className="px-8 py-5 border-b border-gray-800/60 bg-amber-500/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-xl">
            📊
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-100">Community Overview</h2>
            <p className="text-xs text-gray-500 mt-0.5">Real-time stats from the PropertyNFT contract</p>
          </div>
        </div>
      </div>

      <div className="px-8 py-7">
        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {stats.map(({ value, label, color, icon }) => (
            <div key={label} className="glass-card rounded-xl p-5 text-center">
              <p className="text-xl mb-2">{icon}</p>
              <p className={`text-2xl font-extrabold ${color} mb-1`}>{value}</p>
              <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>

        {/* Fill gauge */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 font-medium mb-2">
            <span>Community Filled</span>
            <span className="text-amber-400 font-bold">{fillPct.toFixed(0)}%</span>
          </div>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill bg-gradient-to-r from-amber-600 to-amber-400"
              style={{ width: `${fillPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">{totalSupply} lots minted on-chain</p>
        </div>
      </div>
    </div>
  );
}

function BoardAccessCard() {
  const { address } = useAccount();
  const [isBoard, setIsBoard] = useState(false);

  useEffect(() => {
    if (!address) return;
    setIsBoard(localStorage.getItem(`suvren_board_${address.toLowerCase()}`) === 'true');
  }, [address]);

  function toggle() {
    if (!address) return;
    const next = !isBoard;
    localStorage.setItem(`suvren_board_${address.toLowerCase()}`, next ? 'true' : 'false');
    setIsBoard(next);
  }

  return (
    <div className="glass-card rounded-2xl p-6 border border-[#c9a96e]/15">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-[#e8d5a3]">Board Member Access</h3>
          <p className="text-xs text-gray-500 mt-1">Enable board dashboard for your wallet</p>
        </div>
        <button
          onClick={toggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isBoard ? 'bg-[#c9a96e]' : 'bg-gray-700'}`}
        >
          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-md transform transition-transform ${isBoard ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>
      {isBoard && (
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 text-xs text-[#c9a96e] hover:text-[#e8d5a3] transition-colors"
        >
          → Go to Board Dashboard
        </Link>
      )}
    </div>
  );
}
