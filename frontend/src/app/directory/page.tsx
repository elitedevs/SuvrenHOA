'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useQuery } from '@tanstack/react-query';
import { DirectoryMapView } from '@/components/DirectoryMapView';
import { Map, List } from 'lucide-react';
import { usePublicStats } from '@/hooks/usePublicData';









const COMMUNITY_INFO = {
  name: 'Faircroft HOA',
  location: 'Raleigh, NC',
  established: '2008',
  managedBy: 'Self-managed (SuvrenHOA)',
  annualBudget: '$120,000',
  website: 'faircrofthoa.com',
};

export default function DirectoryPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-[var(--text-muted)] mb-4">Sign in to view the community directory</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  const { totalProperties } = usePublicStats();
  const { data, isLoading } = useQuery({
    queryKey: ['directory'],
    queryFn: async () => {
      const res = await fetch('/api/directory');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    staleTime: 60_000,
  });

  const BOARD_MEMBERS = data?.board || [];
  const COMMITTEES = (data?.committees || []).map((c: any) => ({
    ...c,
    members: (c.hoa_committee_members || []).map((m: any) => m.name),
  }));

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Build residents array for map view from board data + committees
  const mapResidents = [
    ...BOARD_MEMBERS.map((m: any) => ({
      id: m.name,
      lot_number: m.lotNumber || 0,
      display_name: m.name,
      board_role: m.role,
    })),
  ].filter(r => r.lot_number > 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-medium gradient-text sm:">Community Directory</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Board members, committees, and community information
          </p>
        </div>
        <div className="flex items-center bg-[rgba(245,240,232,0.05)] rounded-xl p-1 border border-[rgba(245,240,232,0.08)] shrink-0">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-[#B09B71]/20 text-[#D4C4A0]' : 'text-[var(--text-disabled)] hover:text-[var(--text-body)]'}`}
          >
            <List className="w-3.5 h-3.5" /> List
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'map' ? 'bg-[#B09B71]/20 text-[#D4C4A0]' : 'text-[var(--text-disabled)] hover:text-[var(--text-body)]'}`}
          >
            <Map className="w-3.5 h-3.5" /> Map
          </button>
        </div>
      </div>

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="mb-8">
          <DirectoryMapView residents={mapResidents} onClose={() => setViewMode('list')} />
        </div>
      )}

      {/* Community Info */}
      <div className="glass-card rounded-xl hover-lift p-6 mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-[#B09B71]/15 border border-[#B09B71]/20 flex items-center justify-center text-2xl">
            
          </div>
          <div>
            <h2 className="text-xl font-medium">{COMMUNITY_INFO.name}</h2>
            <p className="text-sm text-[var(--text-muted)]">{COMMUNITY_INFO.location} · Est. {COMMUNITY_INFO.established}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-[rgba(26,26,30,0.30)]">
            <p className="text-lg font-medium text-[#B09B71]">{totalProperties || '—'}</p>
            <p className="text-[10px] text-[var(--text-disabled)]">Total Lots</p>
          </div>
          <div className="p-3 rounded-lg bg-[rgba(26,26,30,0.30)]">
            <p className="text-lg font-medium text-[#3A7D6F]">{COMMUNITY_INFO.annualBudget}</p>
            <p className="text-[10px] text-[var(--text-disabled)]">Annual Budget</p>
          </div>
          <div className="p-3 rounded-lg bg-[rgba(26,26,30,0.30)]">
            <p className="text-lg font-medium text-[var(--steel)]">{BOARD_MEMBERS.length}</p>
            <p className="text-[10px] text-[var(--text-disabled)]">Board Members</p>
          </div>
          <div className="p-3 rounded-lg bg-[rgba(26,26,30,0.30)]">
            <p className="text-lg font-medium text-[#B09B71]">{COMMITTEES.length}</p>
            <p className="text-[10px] text-[var(--text-disabled)]">Committees</p>
          </div>
        </div>
      </div>

      {/* Board of Directors */}
      <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
        <span className="text-xl"></span> Board of Directors
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {BOARD_MEMBERS.map((member: any) => (
          <ResidentProfileCard key={member.name} member={member} isBoard />
        ))}
      </div>

      {/* Committees */}
      <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
        <span className="text-xl"></span> Committees
      </h2>
      <div className="space-y-4">
        {COMMITTEES.map((committee: any) => (
          <div key={committee.name} className="glass-card rounded-xl hover-lift p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{committee.icon}</span>
              <div>
                <h3 className="font-medium text-sm">{committee.name}</h3>
                <p className="text-xs text-[var(--text-muted)]">Chair: {committee.chair}</p>
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-3">{committee.description}</p>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {committee.members.map((m: any) => (
                <span key={m} className="text-[10px] px-2 py-1 rounded-lg bg-[rgba(26,26,30,0.50)] text-[var(--text-muted)]">{m}</span>
              ))}
            </div>
            <p className="text-[10px] text-[var(--text-disabled)]"> {committee.meetingSchedule}</p>
          </div>
        ))}
      </div>

      {/* Contact */}
      <div className="mt-8 glass-card rounded-xl hover-lift p-6">
        <h3 className="font-medium text-sm text-[#B09B71] mb-2"> Need to reach the board?</h3>
        <p className="text-xs text-[var(--text-muted)]">
          Email <a href="mailto:board@faircrofthoa.com" className="text-[#B09B71] hover:underline">board@faircrofthoa.com</a> or
          post in the <a href="/community" className="text-[#B09B71] hover:underline">Community Forum</a>.
          Board meetings are open to all homeowners — see the Announcements page for the next scheduled meeting.
        </p>
      </div>
    </div>
  );
}

const TIER_LABELS: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: ' Founder', color: 'text-[#B09B71]', bg: 'bg-[#B09B71]/10 border-[#B09B71]/20' },
  2: { label: ' Elder', color: 'text-[var(--steel)]', bg: 'bg-[rgba(90,122,154,0.10)] border-[rgba(90,122,154,0.20)]' },
  3: { label: ' Resident', color: 'text-[#3A7D6F]', bg: 'bg-[rgba(42,93,79,0.10)] border-[rgba(42,93,79,0.20)]' },
  4: { label: ' New Owner', color: 'text-[#B09B71]', bg: 'bg-[rgba(176,155,113,0.10)] border-[rgba(176,155,113,0.20)]' },
};

function ResidentProfileCard({ member, isBoard = false }: { member: any; isBoard?: boolean }) {
  // Derive mock data for demo (in production these come from DB)
  const tier = member.tier || (isBoard ? 1 : Math.floor(Math.random() * 3) + 2);
  const tierInfo = TIER_LABELS[tier] ?? TIER_LABELS[4];
  const duesStatus = member.duesCurrent !== false;
  const petCount = member.petCount ?? 0;
  const vehicleCount = member.vehicleCount ?? 1;

  return (
    <div className="glass-card rounded-xl hover-lift overflow-hidden border border-[rgba(245,240,232,0.06)] group">
      {/* Premium card header bar */}
      <div className="h-1.5 bg-gradient-to-r from-[var(--brass-deep)] via-[#B09B71] to-[#D4C4A0]" />

      <div className="p-5">
        {/* Avatar + name */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#B09B71]/20 to-[var(--brass-deep)]/20 border border-[#B09B71]/30 flex items-center justify-center text-lg font-medium text-[#B09B71]">
              {(member.name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            {isBoard && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#B09B71] flex items-center justify-center text-[8px] text-[var(--surface-2)] font-medium"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-[var(--parchment)] truncate">{member.name}</h3>
            {isBoard && <p className="text-[11px] text-[#B09B71] font-medium">{member.role}</p>}
          </div>
        </div>

        {/* Property info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-[var(--text-disabled)] w-14 shrink-0">Lot</span>
            <span className="font-mono font-medium text-[var(--parchment)]">{member.lotNumber ? `#${member.lotNumber}` : 'Not assigned'}</span>
          </div>
          {member.address && (
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-[var(--text-disabled)] w-14 shrink-0">Address</span>
              <span className="text-[var(--text-body)] truncate">{member.address}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-[var(--text-disabled)] w-14 shrink-0">Member</span>
            <span className="text-[var(--text-body)]">Since {member.since || '2024'}</span>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {/* Dues status */}
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
            duesStatus
              ? 'bg-[rgba(42,93,79,0.10)] text-[#3A7D6F] border-[rgba(42,93,79,0.20)]'
              : 'bg-[rgba(107,58,58,0.10)] text-[#8B5A5A] border-[rgba(107,58,58,0.20)]'
          }`}>
            {duesStatus ? ' Dues Current' : ' Dues Overdue'}
          </span>

          {/* Voting tier */}
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${tierInfo.bg} ${tierInfo.color}`}>
            {tierInfo.label}
          </span>
        </div>

        {/* Pet & vehicle counts */}
        <div className="flex gap-4 pt-3 border-t border-[rgba(245,240,232,0.06)]">
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-disabled)]">
            <span></span>
            <span>{petCount} pet{petCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-disabled)]">
            <span></span>
            <span>{vehicleCount} vehicle{vehicleCount !== 1 ? 's' : ''}</span>
          </div>
          {member.email && (
            <a href={`mailto:${member.email}`} className="ml-auto text-[#B09B71]/60 hover:text-[#B09B71] transition-colors text-[11px]">
              
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
