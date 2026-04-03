'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Vote, Users, TrendingUp } from 'lucide-react';

export default function GovernancePage() {
  const { isConnected } = useAccount();
  const [filter, setFilter] = useState<'all' | 'active' | 'passed' | 'failed'>('all');

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-[var(--text-muted)] mb-4">Sign in to participate in governance</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-medium">Governance</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Community proposals, voting, and democratic decision-making
          </p>
        </div>
        <Link
          href="/proposals/create"
          className="px-5 py-2.5 rounded-lg bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] text-sm font-medium transition-all hover:shadow-[0_0_16px_rgba(201,169,110,0.25)] shrink-0 text-center"
        >
          New Proposal
        </Link>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link href="/governance/voting-power" className="group p-4 rounded-xl bg-[var(--surface-2,#1A1A1E)] hover:bg-[var(--surface-3,#222226)] transition-all">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-[var(--brass)]" strokeWidth={1.25} />
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Voting Power</p>
              <p className="text-xs text-[var(--text-muted)]">View your governance weight</p>
            </div>
          </div>
        </Link>
        <Link href="/governance/elections" className="group p-4 rounded-xl bg-[var(--surface-2,#1A1A1E)] hover:bg-[var(--surface-3,#222226)] transition-all">
          <div className="flex items-center gap-3">
            <Vote className="w-5 h-5 text-[var(--brass)]" strokeWidth={1.25} />
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Elections</p>
              <p className="text-xs text-[var(--text-muted)]">Board & committee elections</p>
            </div>
          </div>
        </Link>
        <Link href="/governance/stats" className="group p-4 rounded-xl bg-[var(--surface-2,#1A1A1E)] hover:bg-[var(--surface-3,#222226)] transition-all">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-[var(--brass)]" strokeWidth={1.25} />
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Statistics</p>
              <p className="text-xs text-[var(--text-muted)]">Participation & voting trends</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[var(--divider)]">
        {(['all', 'active', 'passed', 'failed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2.5 text-sm capitalize transition-all border-b-2 -mb-px ${
              filter === tab
                ? 'border-[var(--brass)] text-[var(--brass)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Proposals List */}
      <ProposalsList filter={filter} />
    </div>
  );
}

function ProposalsList({ filter }: { filter: string }) {
  // Empty state — proposals come from sub-pages or future hook integration
  return (
    <div className="text-center py-16">
      <p className="font-serif italic text-[var(--text-muted)]">No proposals yet</p>
      <p className="text-sm text-[var(--text-disabled)] mt-2">
        Be the first to submit a proposal for the community to vote on.
      </p>
    </div>
  );
}
