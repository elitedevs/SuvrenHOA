'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useProperty } from '@/hooks/useProperty';

const VOTING_TIERS = [
  {
    tier: 1,
    name: 'Founder',
    emoji: '',
    votes: 4,
    color: 'text-[#B09B71]',
    bg: 'bg-[#B09B71]/10',
    border: 'border-[#B09B71]/30',
    bar: 'bg-gradient-to-r from-[#b8942e] to-[#B09B71]',
    description: 'Original community founders. Maximum governance influence.',
    criteria: 'Minted during the founding period (first 30 days)',
    percentage: 100,
  },
  {
    tier: 2,
    name: 'Elder',
    emoji: '',
    votes: 3,
    color: 'text-[#5A7A9A]',
    bg: 'bg-[rgba(90,122,154,0.10)]',
    border: 'border-[rgba(90,122,154,0.25)]',
    bar: 'bg-gradient-to-r from-[#4A6A8A] to-[#5A7A9A]',
    description: 'Long-standing residents with proven community commitment.',
    criteria: 'Property held for 2+ years without dues delinquency',
    percentage: 75,
  },
  {
    tier: 3,
    name: 'Resident',
    emoji: '',
    votes: 2,
    color: 'text-[#3A7D6F]',
    bg: 'bg-[rgba(42,93,79,0.10)]',
    border: 'border-[rgba(42,93,79,0.25)]',
    bar: 'bg-gradient-to-r from-[#2A5D4F] to-[#3A7D6F]',
    description: 'Active homeowners in good standing.',
    criteria: 'Current on dues, property held 6+ months',
    percentage: 50,
  },
  {
    tier: 4,
    name: 'New Owner',
    emoji: '',
    votes: 1,
    color: 'text-[#B09B71]',
    bg: 'bg-[rgba(176,155,113,0.10)]',
    border: 'border-[rgba(176,155,113,0.25)]',
    bar: 'bg-gradient-to-r from-[#8A7550] to-[#B09B71]',
    description: 'Recently onboarded homeowners still establishing history.',
    criteria: 'Property held less than 6 months',
    percentage: 25,
  },
];

export default function VotingPowerPage() {
  const { isConnected } = useAccount();
  const { hasProperty, votes, tokenId, totalSupply } = useProperty();

  const currentVotes = Number(votes);
  const myTier = VOTING_TIERS.find(t => t.votes === currentVotes) ?? VOTING_TIERS[3];

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-[rgba(245,240,232,0.50)] mb-4">Connect to view voting power</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 page-enter">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs tracking-widest uppercase text-[rgba(245,240,232,0.35)] mb-1">Governance</p>
        <h1 className="text-3xl font-normal tracking-tight">Voting Power</h1>
        <p className="text-sm text-[rgba(245,240,232,0.50)] mt-2">
          Faircroft HOA uses a 4-tier merit system. Consistent participation and dues payment increase your tier.
        </p>
      </div>

      {/* My Power Card */}
      {hasProperty && (
        <div className={`glass-card rounded-2xl p-7 mb-8 border-l-4 ${myTier.border.replace('border-', 'border-l-')}`}>
          <p className="text-xs text-[rgba(245,240,232,0.35)] uppercase tracking-widest mb-3">Your Voting Power</p>
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 rounded-2xl ${myTier.bg} border ${myTier.border} flex items-center justify-center text-3xl`}>
              {myTier.emoji}
            </div>
            <div>
              <div className="flex items-baseline gap-3 mb-1">
                <span className={`text-5xl font-normal ${myTier.color}`}>{currentVotes}</span>
                <span className="text-[rgba(245,240,232,0.35)] text-lg">votes</span>
              </div>
              <p className={`text-sm font-bold ${myTier.color}`}>{myTier.name} Tier · Lot #{tokenId}</p>
              <p className="text-xs text-[rgba(245,240,232,0.35)] mt-1">
                {currentVotes} of {totalSupply?.toString() || '?'} total votes in the community
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tier Breakdown */}
      <h2 className="text-lg font-bold mb-4">The 4-Tier System</h2>
      <div className="space-y-4 mb-8">
        {VOTING_TIERS.map((tier) => {
          const isMyTier = hasProperty && tier.votes === currentVotes;
          return (
            <div
              key={tier.tier}
              className={`glass-card rounded-2xl p-6 transition-all ${
                isMyTier
                  ? 'ring-1 ring-[#B09B71]/20'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${tier.bg} border ${tier.border} flex items-center justify-center text-xl`}>
                    {tier.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold text-sm ${tier.color}`}>Tier {tier.tier} — {tier.name}</h3>
                      {isMyTier && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#B09B71]/15 text-[#B09B71] border border-[#B09B71]/30 font-bold">
                          YOUR TIER
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[rgba(245,240,232,0.50)] mt-0.5">{tier.description}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-2xl font-normal ${tier.color}`}>{tier.votes}</p>
                  <p className="text-[10px] text-[rgba(245,240,232,0.35)]">votes</p>
                </div>
              </div>

              {/* Visual power bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-[rgba(245,240,232,0.35)]">
                  <span>{tier.criteria}</span>
                  <span className={`font-bold ${tier.color}`}>{tier.percentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-800/60">
                  <div
                    className={`h-2 rounded-full ${tier.bar} transition-all duration-700`}
                    style={{ width: `${tier.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Card */}
      <div className="glass-card rounded-2xl p-6 bg-[#1a1a1a]/30">
        <h4 className="text-sm font-bold text-[#D4C4A0] mb-3"> How Tier Advancement Works</h4>
        <div className="space-y-2 text-xs text-[rgba(245,240,232,0.50)] leading-relaxed">
          <p>• Voting power is determined automatically by your on-chain property NFT attributes.</p>
          <p>• Paying dues on time and holding your property longer increases your tier.</p>
          <p>• Tier changes take effect at the start of the next governance cycle (quarterly).</p>
          <p>• Your tier is publicly verifiable — no behind-the-scenes manipulation.</p>
        </div>
      </div>
    </div>
  );
}
