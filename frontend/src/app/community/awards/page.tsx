'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  Trophy, Star, Flower2, Heart, Leaf, Home, Vote, Crown, Archive, Plus, X, ThumbsUp,
} from 'lucide-react';

interface Award {
  id: string;
  category: string;
  icon: string;
  description: string;
}

interface Nomination {
  id: string;
  awardId: string;
  year: number;
  lot: string;
  name: string;
  reason: string;
  votes: string[];
  isWinner: boolean;
}

const AWARDS: Award[] = [
  { id: 'best-lawn', category: 'Best Lawn', icon: 'Flower2', description: 'The most beautifully maintained and manicured lawn in Faircroft' },
  { id: 'most-helpful', category: 'Most Helpful Neighbor', icon: 'Heart', description: 'Always there for fellow residents — true community spirit' },
  { id: 'best-decor', category: 'Best Holiday Decor', icon: 'Star', description: 'Outstanding seasonal decorations that delight the whole community' },
  { id: 'greenest', category: 'Greenest Home', icon: 'Leaf', description: 'Leading the way in sustainability, solar, composting, and eco practices' },
  { id: 'spirit', category: 'Community Spirit', icon: 'Trophy', description: 'Exemplifies the Faircroft values of connection, kindness, and leadership' },
];

const ICON_MAP: Record<string, React.ElementType> = {
  Flower2, Heart, Star, Leaf, Trophy, Crown, Home, Vote,
};

const DEMO_NOMINATIONS: Nomination[] = [
  { id: '1', awardId: 'best-lawn', year: 2026, lot: '17', name: 'Eleanor Whitfield', reason: 'Eleanor\'s native plant garden is a showstopper every season — 12 varieties of native flowers and zero pesticides.', votes: ['12', '6', '8', '11', '15'], isWinner: false },
  { id: '2', awardId: 'best-lawn', year: 2026, lot: '8', name: 'Ryan Martinez', reason: 'Perfectly edged lawn, healthy turf, and those incredible seasonal annuals along the front walk.', votes: ['2', '13', '7'], isWinner: false },
  { id: '3', awardId: 'most-helpful', year: 2026, lot: '15', name: 'Carlos Bautista', reason: 'Fixed three neighbors\' plumbing issues this winter, no charge. Always the first to volunteer for events.', votes: ['12', '17', '6', '8', '11', '13', '2'], isWinner: false },
  { id: '4', awardId: 'spirit', year: 2026, lot: '8', name: 'Martinez Family', reason: 'Organized block party, book club launch, and holiday lighting contest — the heartbeat of our community.', votes: ['17', '2', '15'], isWinner: false },
  // 2025 winners
  { id: '5', awardId: 'best-lawn', year: 2025, lot: '6', name: 'Sarah Kang', reason: 'Impeccable Japanese garden design transformed their front yard into a neighborhood landmark.', votes: [], isWinner: true },
  { id: '6', awardId: 'most-helpful', year: 2025, lot: '12', name: 'Jennifer Liu', reason: 'Organized the community pet-sitting network and coordinated the welcome committee for 5 new families.', votes: [], isWinner: true },
  { id: '7', awardId: 'greenest', year: 2025, lot: '11', name: 'The Osei Family', reason: 'Full solar install, rainwater harvesting, and started the community compost program.', votes: [], isWinner: true },
];

const CURRENT_YEAR = 2026;
const VOTING_OPEN = true;

function AwardCard({ award, nominations, myLot, onNominate, onVote }: {
  award: Award;
  nominations: Nomination[];
  myLot: string;
  onNominate: (awardId: string) => void;
  onVote: (nomId: string) => void;
}) {
  const Icon = ICON_MAP[award.icon] ?? Trophy;
  const currentNoms = nominations.filter((n) => n.awardId === award.id && n.year === CURRENT_YEAR);
  const leader = [...currentNoms].sort((a, b) => b.votes.length - a.votes.length)[0];

  return (
    <div className="glass-card rounded-xl p-5 border border-[#B09B71]/10">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-[#B09B71]/15 border border-[#B09B71]/20">
          <Icon className="w-5 h-5 text-[#B09B71]" />
        </div>
        <div>
          <h3 className="font-semibold text-white">{award.category}</h3>
          <p className="text-xs text-[rgba(245,240,232,0.35)]">{award.description}</p>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        {currentNoms.sort((a, b) => b.votes.length - a.votes.length).map((nom) => {
          const hasVoted = nom.votes.includes(myLot);
          const isLeading = nom.id === leader?.id;
          return (
            <div key={nom.id} className={`p-3 rounded-lg border ${isLeading ? 'border-[#B09B71]/30 bg-[#B09B71]/5' : 'border-white/5 bg-[#1a1a1a]/40'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {isLeading && <Crown className="w-3 h-3 text-[#B09B71] shrink-0" />}
                    <p className="text-sm font-medium text-white truncate">{nom.name}</p>
                    <span className="text-xs text-[rgba(245,240,232,0.35)]">Lot #{nom.lot}</span>
                  </div>
                  <p className="text-xs text-[rgba(245,240,232,0.50)] mt-0.5 line-clamp-2">{nom.reason}</p>
                </div>
                {VOTING_OPEN && (
                  <button
                    onClick={() => onVote(nom.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                      hasVoted ? 'bg-[#B09B71] text-[#1a1a1a]' : 'border border-white/10 text-[rgba(245,240,232,0.50)] hover:border-[#B09B71]/30 hover:text-[#B09B71]'
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    {nom.votes.length}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {currentNoms.length === 0 && (
          <div className="p-3 rounded-lg border border-white/5 text-center">
            <p className="text-xs text-[rgba(245,240,232,0.35)]">No nominations yet — be the first!</p>
          </div>
        )}
      </div>

      <button
        onClick={() => onNominate(award.id)}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[#B09B71]/20 text-xs font-medium text-[#B09B71] hover:bg-[#B09B71]/10 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Nominate Someone
      </button>
    </div>
  );
}

export default function AwardsPage() {
  const { isConnected } = useAccount();
  const [nominations, setNominations] = useState<Nomination[]>(DEMO_NOMINATIONS);
  const [tab, setTab] = useState<'vote' | 'past'>('vote');
  const [nominatingFor, setNominatingFor] = useState<string | null>(null);
  const [nomForm, setNomForm] = useState({ lot: '', name: '', reason: '' });
  const [myLot] = useState('42');

  useEffect(() => {
    const stored = localStorage.getItem('hoa_awards_nominations');
    if (stored) { try { setNominations(JSON.parse(stored)); } catch {} }
  }, []);

  const save = (n: Nomination[]) => {
    setNominations(n);
    localStorage.setItem('hoa_awards_nominations', JSON.stringify(n));
  };

  const vote = (nomId: string) => {
    save(nominations.map((n) => {
      if (n.id !== nomId) return n;
      const has = n.votes.includes(myLot);
      return { ...n, votes: has ? n.votes.filter((v) => v !== myLot) : [...n.votes, myLot] };
    }));
  };

  const nominate = () => {
    if (!nomForm.lot || !nomForm.name || !nominatingFor) return;
    const n: Nomination = {
      id: Date.now().toString(),
      awardId: nominatingFor,
      year: CURRENT_YEAR,
      lot: nomForm.lot,
      name: nomForm.name,
      reason: nomForm.reason,
      votes: [myLot],
      isWinner: false,
    };
    save([...nominations, n]);
    setNominatingFor(null);
    setNomForm({ lot: '', name: '', reason: '' });
  };

  const pastYears = [...new Set(nominations.filter((n) => n.isWinner).map((n) => n.year))].sort((a, b) => b - a);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-[rgba(245,240,232,0.50)] mb-4">Sign in to participate in Community Awards</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <Trophy className="w-7 h-7 text-[#B09B71]" />
          Community Awards {CURRENT_YEAR}
        </h1>
        <p className="text-sm text-[rgba(245,240,232,0.50)] mt-1">Annual awards celebrating Faircroft's outstanding residents</p>
      </div>

      {/* Status Banner */}
      {VOTING_OPEN && (
        <div className="mb-8 p-4 rounded-xl bg-[#B09B71]/10 border border-[#B09B71]/20 flex items-center gap-3">
          <Vote className="w-5 h-5 text-[#B09B71] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#B09B71]">Voting is Open!</p>
            <p className="text-xs text-[rgba(245,240,232,0.50)]">Nominate neighbors and vote for your favorites. Winners announced April 30, 2026.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[#1a1a1a] border border-white/10 mb-8">
        {[
          { id: 'vote', label: `${CURRENT_YEAR} Nominations`, icon: Vote },
          { id: 'past', label: 'Past Winners', icon: Archive },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${tab === id ? 'bg-[#B09B71] text-[#1a1a1a]' : 'text-[rgba(245,240,232,0.50)] hover:text-white'}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'vote' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {AWARDS.map((award) => (
            <AwardCard
              key={award.id}
              award={award}
              nominations={nominations}
              myLot={myLot}
              onNominate={setNominatingFor}
              onVote={vote}
            />
          ))}
        </div>
      )}

      {tab === 'past' && (
        <div className="space-y-8">
          {pastYears.map((year) => (
            <div key={year}>
              <h2 className="text-lg font-bold text-[#B09B71] mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5" />
                {year} Winners
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {nominations.filter((n) => n.isWinner && n.year === year).map((nom) => {
                  const award = AWARDS.find((a) => a.id === nom.awardId);
                  if (!award) return null;
                  const Icon = ICON_MAP[award.icon] ?? Trophy;
                  return (
                    <div key={nom.id} className="glass-card rounded-xl p-4 border border-[#B09B71]/20">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-lg bg-[#B09B71]/15 border border-[#B09B71]/20">
                          <Icon className="w-4 h-4 text-[#B09B71]" />
                        </div>
                        <p className="text-xs font-semibold text-[#B09B71] uppercase tracking-wider">{award.category}</p>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <Crown className="w-4 h-4 text-[#B09B71]" />
                        <p className="font-bold text-white">{nom.name}</p>
                        <span className="text-xs text-[rgba(245,240,232,0.35)]">Lot #{nom.lot}</span>
                      </div>
                      <p className="text-xs text-[rgba(245,240,232,0.50)]">{nom.reason}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {pastYears.length === 0 && (
            <div className="glass-card rounded-xl p-8 text-center">
              <Archive className="w-10 h-10 text-[rgba(245,240,232,0.25)] mx-auto mb-3" />
              <p className="text-[rgba(245,240,232,0.50)]">No past winners recorded yet</p>
            </div>
          )}
        </div>
      )}

      {/* Nominate Modal */}
      {nominatingFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md border border-[#B09B71]/20">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold">Nominate for {AWARDS.find((a) => a.id === nominatingFor)?.category}</h2>
              <button onClick={() => setNominatingFor(null)} className="p-1 rounded text-[rgba(245,240,232,0.35)] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[rgba(245,240,232,0.50)] mb-1 block">Lot #</label>
                  <input
                    value={nomForm.lot}
                    onChange={(e) => setNomForm((f) => ({ ...f, lot: e.target.value }))}
                    placeholder="42"
                    className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-white/10 text-sm text-white placeholder-gray-600 focus:border-[#B09B71]/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-[rgba(245,240,232,0.50)] mb-1 block">Name</label>
                  <input
                    value={nomForm.name}
                    onChange={(e) => setNomForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Jane Smith"
                    className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-white/10 text-sm text-white placeholder-gray-600 focus:border-[#B09B71]/50 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-[rgba(245,240,232,0.50)] mb-1 block">Why do they deserve this award?</label>
                <textarea
                  value={nomForm.reason}
                  onChange={(e) => setNomForm((f) => ({ ...f, reason: e.target.value }))}
                  placeholder="Tell us why this neighbor deserves to win..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-white/10 text-sm text-white placeholder-gray-600 focus:border-[#B09B71]/50 focus:outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setNominatingFor(null)} className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-sm text-[rgba(245,240,232,0.50)] hover:text-white transition-colors">Cancel</button>
              <button onClick={nominate} className="flex-1 px-4 py-2 rounded-lg bg-[#B09B71] hover:bg-[#D4C4A0] text-[#1a1a1a] text-sm font-semibold transition-colors">Nominate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
