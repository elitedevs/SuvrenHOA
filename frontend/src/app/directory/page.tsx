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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Community Directory</h1>
        <p className="text-sm text-gray-400 mt-1">
          Board members, committees, and community information
        </p>
      </div>

      {/* Community Info */}
      <div className="glass-card rounded-xl p-6 mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-purple-600/20 border border-purple-500/20 flex items-center justify-center text-2xl">
            🏘️
          </div>
          <div>
            <h2 className="text-xl font-bold">{COMMUNITY_INFO.name}</h2>
            <p className="text-sm text-gray-400">{COMMUNITY_INFO.location} · Est. {COMMUNITY_INFO.established}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-gray-800/30">
            <p className="text-lg font-bold text-purple-400">{COMMUNITY_INFO.totalLots}</p>
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
        <span className="text-xl">👥</span> Board of Directors
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {BOARD_MEMBERS.map((member: any) => (
          <div key={member.name} className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-purple-600/20 border border-purple-500/20 flex items-center justify-center text-lg font-bold text-purple-400">
                {(member.name || '').split(' ').map((n: string) => n[0]).join('')}
              </div>
              <div>
                <h3 className="font-semibold text-sm">{member.name}</h3>
                <p className="text-xs text-purple-400">{member.role}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mb-3">{member.bio}</p>
            <div className="flex items-center gap-3 text-[10px] text-gray-500">
              <span>Lot #{member.lotNumber}</span>
              <span>Since {member.since}</span>
            </div>
            {member.email && (
              <a href={`mailto:${member.email}`} className="text-[10px] text-purple-400 hover:underline mt-2 block">
                ✉️ {member.email}
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Committees */}
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="text-xl">🏛️</span> Committees
      </h2>
      <div className="space-y-4">
        {COMMITTEES.map((committee: any) => (
          <div key={committee.name} className="glass-card rounded-xl p-5">
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
            <p className="text-[10px] text-gray-500">📅 {committee.meetingSchedule}</p>
          </div>
        ))}
      </div>

      {/* Contact */}
      <div className="mt-8 glass-card rounded-xl p-6 glow-purple">
        <h3 className="font-medium text-sm text-purple-400 mb-2">📞 Need to reach the board?</h3>
        <p className="text-xs text-gray-400">
          Email <a href="mailto:board@faircrofthoa.com" className="text-purple-400 hover:underline">board@faircrofthoa.com</a> or
          post in the <a href="/community" className="text-purple-400 hover:underline">Community Forum</a>.
          Board meetings are open to all homeowners — see the Announcements page for the next scheduled meeting.
        </p>
      </div>
    </div>
  );
}
