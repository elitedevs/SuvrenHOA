'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useContracts } from '@/hooks/useContracts';
import { useProperty } from '@/hooks/useProperty';

export default function AdminPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 mb-4">Connect board wallet to access admin</p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Board Administration</h1>
        <p className="text-sm text-gray-400 mt-1">
          Mint properties, manage roles, and register documents
        </p>
      </div>

      <div className="space-y-6">
        <MintPropertyCard />
        <RegisterDocumentCard />
        <CommunityStats />
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
        BigInt(lotNumber),
        streetAddress,
        BigInt(sqft || '0'),
      ],
    });
  };

  return (
    <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        🏠 Mint Property NFT
      </h2>

      {isSuccess ? (
        <div className="p-4 rounded-lg bg-green-950/20 border border-green-900/50 text-center">
          <p className="text-green-400 font-medium">✅ Property #{lotNumber} minted!</p>
          {hash && (
            <a href={`https://sepolia.basescan.org/tx/${hash}`} target="_blank" rel="noopener noreferrer"
              className="text-xs text-purple-400 hover:underline font-mono mt-2 block">
              View transaction →
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Owner Wallet Address</label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm font-mono placeholder-gray-600 focus:border-purple-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Lot Number</label>
              <input
                type="number"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                placeholder="1-150"
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm placeholder-gray-600 focus:border-purple-500/50 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Street Address</label>
              <input
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="123 Faircroft Dr"
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm placeholder-gray-600 focus:border-purple-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Square Footage</label>
              <input
                type="number"
                value={sqft}
                onChange={(e) => setSqft(e.target.value)}
                placeholder="2500"
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm placeholder-gray-600 focus:border-purple-500/50 focus:outline-none"
              />
            </div>
          </div>
          <button
            onClick={handleMint}
            disabled={isPending || isConfirming || !owner || !lotNumber || !streetAddress}
            className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {isPending ? '⏳ Confirm in Wallet...' :
             isConfirming ? '⛓️ Minting...' :
             'Mint Property'}
          </button>
        </div>
      )}
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
        BigInt(0), // supersedes: none
      ],
    });
  };

  return (
    <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        📄 Register Document
      </h2>

      {isSuccess ? (
        <div className="p-4 rounded-lg bg-green-950/20 border border-green-900/50 text-center">
          <p className="text-green-400 font-medium">✅ Document registered on-chain!</p>
          {hash && (
            <a href={`https://sepolia.basescan.org/tx/${hash}`} target="_blank" rel="noopener noreferrer"
              className="text-xs text-purple-400 hover:underline font-mono mt-2 block">
              View transaction →
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Document File (computes SHA-256 hash)</label>
            <input
              type="file"
              onChange={handleFileSelect}
              className="w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-800 file:text-gray-300 file:text-sm hover:file:bg-gray-700 file:cursor-pointer"
            />
            {fileHash && (
              <p className="text-[10px] font-mono text-gray-500 mt-1 break-all">Hash: {fileHash}</p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Document Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Faircroft CC&Rs 2026"
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm placeholder-gray-600 focus:border-purple-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm focus:border-purple-500/50 focus:outline-none"
              >
                {docTypes.map((t, i) => (
                  <option key={i} value={i}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Arweave TX ID</label>
              <input
                type="text"
                value={arweaveTxId}
                onChange={(e) => setArweaveTxId(e.target.value)}
                placeholder="arweave-transaction-id"
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm font-mono placeholder-gray-600 focus:border-purple-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">IPFS CID (optional)</label>
              <input
                type="text"
                value={ipfsCid}
                onChange={(e) => setIpfsCid(e.target.value)}
                placeholder="bafybei..."
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm font-mono placeholder-gray-600 focus:border-purple-500/50 focus:outline-none"
              />
            </div>
          </div>
          <button
            onClick={handleRegister}
            disabled={isPending || isConfirming || !fileHash || !arweaveTxId || !title}
            className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {isPending ? '⏳ Confirm in Wallet...' :
             isConfirming ? '⛓️ Registering...' :
             'Register Document On-Chain'}
          </button>
        </div>
      )}
    </div>
  );
}

function CommunityStats() {
  const { totalSupply } = useProperty();

  return (
    <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        📊 Community Overview
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-gray-800/50 text-center">
          <p className="text-xl font-bold text-purple-400">{totalSupply}</p>
          <p className="text-[10px] text-gray-500">Properties Minted</p>
        </div>
        <div className="p-3 rounded-lg bg-gray-800/50 text-center">
          <p className="text-xl font-bold text-blue-400">150</p>
          <p className="text-[10px] text-gray-500">Max Lots</p>
        </div>
        <div className="p-3 rounded-lg bg-gray-800/50 text-center">
          <p className="text-xl font-bold text-green-400">{totalSupply}</p>
          <p className="text-[10px] text-gray-500">Total Votes</p>
        </div>
        <div className="p-3 rounded-lg bg-gray-800/50 text-center">
          <p className="text-xl font-bold text-amber-400">{150 - totalSupply}</p>
          <p className="text-[10px] text-gray-500">Lots Remaining</p>
        </div>
      </div>
    </div>
  );
}
