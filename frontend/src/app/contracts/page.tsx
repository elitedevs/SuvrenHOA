'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useContracts } from '@/hooks/useContracts';
import { useReadContract, useChainId } from 'wagmi';
import { ExternalLink, Copy, CheckCheck } from 'lucide-react';
import { useState } from 'react';
import PropertyNFTAbi from '@/config/abis/PropertyNFT.json';
import FaircroftGovernorAbi from '@/config/abis/FaircroftGovernor.json';
import FaircroftTreasuryAbi from '@/config/abis/FaircroftTreasury.json';
import DocumentRegistryAbi from '@/config/abis/DocumentRegistry.json';
import { getContracts } from '@/config/contracts';
import { formatUnits } from 'viem';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="p-1 rounded text-[rgba(245,240,232,0.25)] hover:text-[#B09B71] transition-colors">
      {copied ? <CheckCheck className="w-3.5 h-3.5 text-[#3A7D6F]" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function AddressDisplay({ address, basescanUrl }: { address: string; basescanUrl: string }) {
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
  return (
    <div className="flex items-center gap-2">
      <code className="text-xs font-mono text-[#B09B71] bg-[#B09B71]/10 px-2 py-1 rounded">{short}</code>
      <CopyButton text={address} />
      <a href={basescanUrl} target="_blank" rel="noopener noreferrer" className="p-1 rounded text-[rgba(245,240,232,0.25)] hover:text-[#B09B71] transition-colors">
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

function PropertyNFTCard({ address, basescanBase }: { address: string; basescanBase: string }) {
  const { data: totalSupply } = useReadContract({
    address: address as `0x${string}`,
    abi: PropertyNFTAbi,
    functionName: 'totalSupply',
  });
  const { data: name } = useReadContract({
    address: address as `0x${string}`,
    abi: PropertyNFTAbi,
    functionName: 'name',
  });

  return (
    <ContractCard
      name="PropertyNFT"
      emoji=""
      description="Soulbound NFT representing lot ownership. 1 lot = 1 vote. Non-transferable."
      address={address}
      basescanUrl={`${basescanBase}/address/${address}`}
      functions={['mint(address, tokenURI)', 'burn(tokenId)', 'ownerOf(tokenId)', 'totalSupply()']}
      stats={[
        { label: 'Token Name', value: typeof name === 'string' ? name : 'FaircroftProperty' },
        { label: 'Total Supply', value: totalSupply !== undefined ? `${totalSupply} lots` : '—' },
      ]}
    />
  );
}

function GovernorCard({ address, basescanBase }: { address: string; basescanBase: string }) {
  const { data: proposalCount } = useReadContract({
    address: address as `0x${string}`,
    abi: FaircroftGovernorAbi,
    functionName: 'proposalCount',
  });

  return (
    <ContractCard
      name="FaircroftGovernor"
      emoji=""
      description="On-chain governance contract. Manages proposals, voting, and execution via timelock."
      address={address}
      basescanUrl={`${basescanBase}/address/${address}`}
      functions={['propose(...)', 'castVote(proposalId, support)', 'execute(...)', 'state(proposalId)']}
      stats={[
        { label: 'Total Proposals', value: proposalCount !== undefined ? String(proposalCount) : '—' },
        { label: 'Voting Period', value: '7 days' },
      ]}
    />
  );
}

function TreasuryCard({ address, basescanBase }: { address: string; basescanBase: string }) {
  const { data: snapshot } = useReadContract({
    address: address as `0x${string}`,
    abi: FaircroftTreasuryAbi,
    functionName: 'getTreasurySnapshot',
  });
  const snap = snapshot as [bigint, bigint, bigint, bigint] | undefined;
  const total = snap ? `$${parseFloat(formatUnits(snap[0], 6)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC` : '—';

  return (
    <ContractCard
      name="FaircroftTreasury"
      emoji=""
      description="Manages HOA dues, expenditures, and reserves. 80/20 operating/reserve split."
      address={address}
      basescanUrl={`${basescanBase}/address/${address}`}
      functions={['payDues(tokenId)', 'recordExpenditure(amount, desc)', 'getTreasurySnapshot()', 'withdrawOperating(amount, to)']}
      stats={[
        { label: 'Total Balance', value: total },
        { label: 'Reserve Split', value: '20%' },
      ]}
    />
  );
}

function DocumentRegistryCard({ address, basescanBase }: { address: string; basescanBase: string }) {
  const { data: count } = useReadContract({
    address: address as `0x${string}`,
    abi: DocumentRegistryAbi,
    functionName: 'getDocumentCount',
  });

  return (
    <ContractCard
      name="DocumentRegistry"
      emoji=""
      description="Immutable document registry. Stores content hashes on-chain for tamper-proof records."
      address={address}
      basescanUrl={`${basescanBase}/address/${address}`}
      functions={['registerDocument(hash, name, arweaveId)', 'verifyDocument(hash)', 'getDocument(id)', 'getDocumentCount()']}
      stats={[
        { label: 'Registered Docs', value: count !== undefined ? String(count) : '—' },
        { label: 'Storage', value: 'Arweave permanent' },
      ]}
    />
  );
}

function ContractCard({
  name, emoji, description, address, basescanUrl, functions, stats,
}: {
  name: string;
  emoji: string;
  description: string;
  address: string;
  basescanUrl: string;
  functions: string[];
  stats: { label: string; value: string }[];
}) {
  const [showFunctions, setShowFunctions] = useState(false);

  return (
    <div className="glass-card rounded-2xl p-6 border border-[#B09B71]/10 hover:border-[#B09B71]/25 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#B09B71]/10 border border-[#B09B71]/20 flex items-center justify-center text-xl">
            {emoji}
          </div>
          <div>
            <h3 className="font-bold text-[#D4C4A0] text-sm">{name}</h3>
            <p className="text-xs text-[rgba(245,240,232,0.35)] mt-0.5">EVM Smart Contract</p>
          </div>
        </div>
        <a href={basescanUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-[#B09B71] hover:text-[#D4C4A0] transition-colors">
          BaseScan <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <p className="text-xs text-[rgba(245,240,232,0.50)] mb-4 leading-relaxed">{description}</p>

      {/* Address */}
      <div className="mb-4">
        <p className="text-[10px] text-[rgba(245,240,232,0.25)] uppercase tracking-wide mb-1.5 font-semibold">Contract Address</p>
        <AddressDisplay address={address} basescanUrl={basescanUrl} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white/3 rounded-xl p-3">
            <p className="text-[10px] text-[rgba(245,240,232,0.25)] uppercase tracking-wide font-semibold mb-1">{s.label}</p>
            <p className="text-sm font-bold text-[rgba(245,240,232,0.80)]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Functions toggle */}
      <button
        onClick={() => setShowFunctions(!showFunctions)}
        className="text-xs text-[rgba(245,240,232,0.35)] hover:text-[#B09B71] transition-colors"
      >
        {showFunctions ? '▲' : '▼'} Key Functions ({functions.length})
      </button>
      {showFunctions && (
        <div className="mt-2 space-y-1">
          {functions.map(fn => (
            <code key={fn} className="block text-[11px] text-[rgba(245,240,232,0.50)] font-mono bg-white/3 px-2 py-1 rounded">
              {fn}
            </code>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ContractsPage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const addresses = getContracts(chainId);
  const isMainnet = chainId === 8453;
  const basescanBase = isMainnet ? 'https://basescan.org' : 'https://sepolia.basescan.org';

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-[rgba(245,240,232,0.50)] mb-4">Sign in to view smart contracts</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 page-enter">
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs tracking-widest uppercase text-[rgba(245,240,232,0.35)] mb-1">Blockchain</p>
        <h1 className="text-3xl font-normal tracking-tight">Smart Contract Explorer</h1>
        <p className="text-[rgba(245,240,232,0.50)] text-sm mt-2">All SuvrenHOA contracts deployed on Base {isMainnet ? 'Mainnet' : 'Sepolia (testnet)'}</p>
        <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full bg-[#B09B71]/10 border border-[#B09B71]/20 text-xs text-[#B09B71]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#B09B71] animate-pulse" />
          {isMainnet ? 'Base Mainnet' : 'Base Sepolia Testnet'} · Chain ID {chainId}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <PropertyNFTCard address={addresses.propertyNFT} basescanBase={basescanBase} />
        <GovernorCard address={addresses.governor} basescanBase={basescanBase} />
        <TreasuryCard address={addresses.treasury} basescanBase={basescanBase} />
        <DocumentRegistryCard address={addresses.documentRegistry} basescanBase={basescanBase} />
      </div>

      {/* Info */}
      <div className="mt-8 glass-card rounded-2xl p-6 border border-[#B09B71]/10">
        <p className="text-xs font-bold text-[#D4C4A0] mb-2"> Read-Only Explorer</p>
        <p className="text-xs text-[rgba(245,240,232,0.50)] leading-relaxed">
          This explorer shows live on-chain data from deployed contracts. All data is fetched directly
          from the blockchain via RPC calls — no intermediary servers. Contract state updates automatically
          as transactions are processed on Base.
        </p>
      </div>
    </div>
  );
}
