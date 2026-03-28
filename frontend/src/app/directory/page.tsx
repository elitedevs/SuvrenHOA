'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useQuery } from '@tanstack/react-query';









const COMMUNITY_INFO = {
  name: 'Faircroft HOA',
  location: 'Raleigh, NC',
  established: '2008',
  totalLots: 150,
  managedBy: 'Self-managed (SuvrenHOA)',
  annualBudget: '$120,000',
  website: 'faircrofthoa.com',
};

export default function DirectoryPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 mb-4">Sign in to view the community directory</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

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

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter" data-section="community">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Community Directory</h1>
        <p className="text-sm text-gray-400 mt-1">
          Board members, committees, and community information
        </p>
      </div>

      {/* Community Info */}
      <div className="glass-card rounded-md hover-lift p-6 mb-8">
        <div className="flex items-center gap-4 mb-4">
                    <div>
            <h2 className="text-xl font-bold">{COMMUNITY_INFO.name}</h2>
            <p className="text-sm text-gray-400">{COMMUNITY_INFO.location} · Est. {COMMUNITY_INFO.established}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-gray-800/30">
            <p className="text-lg font-bold text-[#c9a96e]">{COMMUNITY_INFO.totalLots}</p>
            <p className="text-[10px] text-gray-500">Total Lots</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-800/30">
            <p className="text-lg font-bold text-green-400">{COMMUNITY_INFO.annualBudget}</p>
            <p className="text-[10px] text-gray-500">Annual Budget</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-800/30">
            <p className="text-lg font-bold text-blue-400">{BOARD_MEMBERS.length}</p>
            <p className="text-[10px] text-gray-500">Board Members</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-800/30">
            <p className="text-lg font-bold text-amber-400">{COMMITTEES.length}</p>
            <p className="text-[10px] text-gray-500">Committees</p>
          </div>
        </div>
      </div>

      {/* Board of Directors */}
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="text-xl"></span> Board of Directors
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {BOARD_MEMBERS.map((member: any) => (
          <ResidentProfileCard key={member.name} member={member} isBoard />
        ))}
      </div>

      {/* Committees */}
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="text-xl"></span> Committees
      </h2>
      <div className="space-y-4">
        {COMMITTEES.map((committee: any) => (
          <div key={committee.name} className="glass-card rounded-md hover-lift p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{committee.icon}</span>
              <div>
                <h3 className="font-semibold text-sm">{committee.name}</h3>
                <p className="text-xs text-gray-400">Chair: {committee.chair}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-3">{committee.description}</p>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {committee.members.map((m: any) => (
                <span key={m} className="text-[10px] px-2 py-1 rounded-lg bg-gray-800/50 text-gray-400">{m}</span>
              ))}
            </div>
            <p className="text-[10px] text-gray-500"> {committee.meetingSchedule}</p>
          </div>
        ))}
      </div>

      {/* Contact */}
      <div className="mt-8 glass-card rounded-md hover-lift p-6 glow-gold">
        <h3 className="font-medium text-sm text-[#c9a96e] mb-2"> Need to reach the board?</h3>
        <p className="text-xs text-gray-400">
          Email <a href="mailto:board@faircrofthoa.com" className="text-[#c9a96e] hover:underline">board@faircrofthoa.com</a> or
          post in the <a href="/community" className="text-[#c9a96e] hover:underline">Community Forum</a>.
          Board meetings are open to all homeowners — see the Announcements page for the next scheduled meeting.
        </p>
      </div>
    </div>
  );
}

const TIER_LABELS: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: ' Founder', color: 'text-[#c9a96e]', bg: 'bg-[#c9a96e]/10 border-[#c9a96e]/20' },
  2: { label: ' Elder', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  3: { label: ' Resident', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  4: { label: ' New Owner', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
};

function ResidentProfileCard({ member, isBoard = false }: { member: any; isBoard?: boolean }) {
  // Derive mock data for demo (in production these come from DB)
  const tier = member.tier || (isBoard ? 1 : Math.floor(Math.random() * 3) + 2);
  const tierInfo = TIER_LABELS[tier] ?? TIER_LABELS[4];
  const duesStatus = member.duesCurrent !== false;
  const petCount = member.petCount ?? 0;
  const vehicleCount = member.vehicleCount ?? 1;

  return (
    <div className="glass-card rounded-md hover-lift overflow-hidden border border-gray-700/30 group">
      {/* Premium card header bar */}
      <div className="h-1.5 bg-gradient-to-r from-[#b8942e] via-[#c9a96e] to-[#e8d5a3]" />

      <div className="p-5">
        {/* Avatar + name */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c9a96e]/20 to-[#b8942e]/20 border border-[#c9a96e]/30 flex items-center justify-center text-lg font-bold text-[#c9a96e]">
              {(member.name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            {isBoard && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#c9a96e] flex items-center justify-center text-[8px] text-[#1a1a1a] font-bold"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-gray-100 truncate">{member.name}</h3>
            {isBoard && <p className="text-[11px] text-[#c9a96e] font-medium">{member.role}</p>}
          </div>
        </div>

        {/* Property info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-gray-500 w-14 shrink-0">Lot</span>
            <span className="font-mono font-semibold text-gray-200">#{member.lotNumber || '—'}</span>
          </div>
          {member.address && (
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-gray-500 w-14 shrink-0">Address</span>
              <span className="text-gray-300 truncate">{member.address}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-gray-500 w-14 shrink-0">Member</span>
            <span className="text-gray-300">Since {member.since || '2024'}</span>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {/* Dues status */}
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
            duesStatus
              ? 'bg-green-500/10 text-green-400 border-green-500/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            {duesStatus ? ' Dues Current' : ' Dues Overdue'}
          </span>

          {/* Voting tier */}
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${tierInfo.bg} ${tierInfo.color}`}>
            {tierInfo.label}
          </span>
        </div>

        {/* Pet & vehicle counts */}
        <div className="flex gap-4 pt-3 border-t border-gray-700/30">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <span></span>
            <span>{petCount} pet{petCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <span></span>
            <span>{vehicleCount} vehicle{vehicleCount !== 1 ? 's' : ''}</span>
          </div>
          {member.email && (
            <a href={`mailto:${member.email}`} className="ml-auto text-[#c9a96e]/60 hover:text-[#c9a96e] transition-colors text-[11px]">
              
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
