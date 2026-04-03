'use client';

import { useState, useEffect } from 'react';

interface FitnessChallenge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unit: string;
  goal: number;
  startDate: string;
  endDate: string;
  active: boolean;
}

interface CheckIn {
  challengeId: string;
  participant: string; // lot#
  amount: number;
  date: string;
  note?: string;
}

const CURRENT_CHALLENGE: FitnessChallenge = {
  id: 'c1',
  title: 'Community Step Challenge',
  description: 'Walk 1,000,000 steps as a neighborhood this month! Every step counts toward our collective goal.',
  emoji: '',
  unit: 'steps',
  goal: 1000000,
  startDate: '2026-03-01',
  endDate: '2026-03-31',
  active: true,
};

const PAST_CHALLENGES: FitnessChallenge[] = [
  {
    id: 'c_prev1',
    title: 'February Hydration Challenge',
    description: '8 glasses of water per day, every day in February',
    emoji: '',
    unit: 'oz',
    goal: 500000,
    startDate: '2026-02-01',
    endDate: '2026-02-28',
    active: false,
  },
  {
    id: 'c_prev2',
    title: 'January Push-Up Challenge',
    description: '50,000 push-ups as a community',
    emoji: '',
    unit: 'push-ups',
    goal: 50000,
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    active: false,
  },
];

const STORAGE_KEY = 'hoa_fitness_checkins';

const SAMPLE_CHECKINS: CheckIn[] = [
  { challengeId: 'c1', participant: 'Lot 4', amount: 8500, date: '2026-03-20' },
  { challengeId: 'c1', participant: 'Lot 12', amount: 12000, date: '2026-03-20' },
  { challengeId: 'c1', participant: 'Lot 7', amount: 6800, date: '2026-03-19' },
  { challengeId: 'c1', participant: 'Lot 22', amount: 15000, date: '2026-03-19' },
  { challengeId: 'c1', participant: 'Lot 3', amount: 9200, date: '2026-03-18' },
  { challengeId: 'c1', participant: 'Lot 15', amount: 7400, date: '2026-03-18' },
  { challengeId: 'c1', participant: 'Lot 8', amount: 11000, date: '2026-03-17' },
];

export default function FitnessPage() {
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [myLot, setMyLot] = useState('');
  const [checkInAmount, setCheckInAmount] = useState('');
  const [checkInNote, setCheckInNote] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setCheckins(raw ? JSON.parse(raw) : SAMPLE_CHECKINS);
    } catch {
      setCheckins(SAMPLE_CHECKINS);
    }
    const savedLot = localStorage.getItem('hoa_my_lot') || '';
    setMyLot(savedLot);
  }, []);

  const totalProgress = checkins
    .filter(c => c.challengeId === CURRENT_CHALLENGE.id)
    .reduce((acc, c) => acc + c.amount, 0);

  const progressPct = Math.min(100, (totalProgress / CURRENT_CHALLENGE.goal) * 100);

  // Leaderboard
  const leaderboard = Object.entries(
    checkins
      .filter(c => c.challengeId === CURRENT_CHALLENGE.id)
      .reduce((acc, c) => {
        acc[c.participant] = (acc[c.participant] || 0) + c.amount;
        return acc;
      }, {} as Record<string, number>)
  )
    .map(([lot, total]) => ({ lot, total }))
    .sort((a, b) => b.total - a.total);

  const handleCheckIn = () => {
    const amount = parseInt(checkInAmount);
    if (!amount || amount <= 0 || !myLot) return;

    const newCheckIn: CheckIn = {
      challengeId: CURRENT_CHALLENGE.id,
      participant: myLot.startsWith('Lot') ? myLot : `Lot ${myLot}`,
      amount,
      date: new Date().toISOString().split('T')[0],
      note: checkInNote || undefined,
    };

    const updated = [newCheckIn, ...checkins];
    setCheckins(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem('hoa_my_lot', newCheckIn.participant);
    setCheckInAmount('');
    setCheckInNote('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const daysLeft = Math.max(0, Math.ceil((new Date(CURRENT_CHALLENGE.endDate).getTime() - Date.now()) / 86400000));

  const pastResults = PAST_CHALLENGES.map(ch => {
    const total = SAMPLE_CHECKINS.filter(c => c.challengeId === ch.id).reduce((a, c) => a + c.amount, 0) || ch.goal * 0.87;
    return { ...ch, achieved: total };
  });

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-medium gradient-text">Community Fitness</h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">Move together, thrive together </p>
      </div>

      {/* Current Challenge */}
      <div className="glass rounded-xl p-6 border border-[rgba(176,155,113,0.20)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(176,155,113,0.05)] to-transparent pointer-events-none" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-3xl">{CURRENT_CHALLENGE.emoji}</span>
                <span className="text-xs font-medium bg-[rgba(42,93,79,0.15)] text-[#3A7D6F] border border-[rgba(42,93,79,0.25)] px-2 py-0.5 rounded-full">ACTIVE</span>
              </div>
              <h2 className="text-xl font-medium text-[var(--parchment)]">{CURRENT_CHALLENGE.title}</h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">{CURRENT_CHALLENGE.description}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-medium text-[#B09B71]">{daysLeft}</div>
              <div className="text-xs text-[var(--text-disabled)]">days left</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-xs text-[var(--text-disabled)] mb-1.5">
              <span>{totalProgress.toLocaleString()} {CURRENT_CHALLENGE.unit}</span>
              <span>{progressPct.toFixed(1)}% of {CURRENT_CHALLENGE.goal.toLocaleString()}</span>
            </div>
            <div className="h-4 rounded-full bg-[rgba(245,240,232,0.06)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 relative overflow-hidden"
                style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #b8942e, #B09B71, #D4C4A0)' }}
              >
                <div className="absolute inset-0 animate-pulse opacity-30 bg-[rgba(245,240,232,0.20)]" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-[var(--text-disabled)] mb-5">
            <span> Ends {new Date(CURRENT_CHALLENGE.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span> {leaderboard.length} participants</span>
          </div>

          {/* Check In Form */}
          <div className="p-4 rounded-xl bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.06)]">
            <h3 className="text-sm font-medium text-[var(--parchment)] mb-3"> Log Your Activity</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={myLot}
                onChange={e => setMyLot(e.target.value)}
                placeholder="Your Lot # (e.g. Lot 5)"
                className="flex-1 px-3 py-2 rounded-xl bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.08)] text-sm text-[var(--parchment)] placeholder-[rgba(245,240,232,0.20)] focus:outline-none focus:border-[rgba(176,155,113,0.50)]"
              />
              <input
                type="number"
                value={checkInAmount}
                onChange={e => setCheckInAmount(e.target.value)}
                placeholder={`${CURRENT_CHALLENGE.unit} today`}
                className="flex-1 px-3 py-2 rounded-xl bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.08)] text-sm text-[var(--parchment)] placeholder-[rgba(245,240,232,0.20)] focus:outline-none focus:border-[rgba(176,155,113,0.50)]"
              />
              <button
                onClick={handleCheckIn}
                disabled={!checkInAmount || !myLot}
                className="px-5 py-2 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] text-sm font-medium transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Check In 
              </button>
            </div>
            {showSuccess && (
              <div className="mt-3 text-sm text-[#3A7D6F] font-medium animate-pulse">
                 Logged! Keep it up!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="glass rounded-xl p-6 border border-[rgba(245,240,232,0.04)]">
        <h2 className="text-base font-medium text-[var(--parchment)] mb-4"> Participant Leaderboard</h2>
        {leaderboard.length === 0 ? (
          <p className="text-[var(--text-disabled)] text-sm text-center py-8">No check-ins yet. Be the first!</p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, idx) => {
              const pct = (entry.total / totalProgress) * 100;
              const medals = ['', '', ''];
              return (
                <div key={entry.lot} className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(245,240,232,0.02)] border border-[rgba(245,240,232,0.04)]">
                  <span className="text-lg w-8 text-center">{medals[idx] || `#${idx + 1}`}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-[var(--parchment)]">{entry.lot}</span>
                      <span className="text-sm font-medium text-[#B09B71]">{entry.total.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[rgba(245,240,232,0.06)] overflow-hidden">
                      <div className="h-full rounded-full bg-[rgba(176,155,113,0.60)]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-[var(--text-disabled)] w-10 text-right">{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Challenges */}
      <div className="glass rounded-xl p-6 border border-[rgba(245,240,232,0.04)]">
        <h2 className="text-base font-medium text-[var(--parchment)] mb-4"> Past Challenges</h2>
        <div className="space-y-3">
          {pastResults.map(ch => {
            const pct = Math.min(100, (ch.achieved / ch.goal) * 100);
            return (
              <div key={ch.id} className="p-4 rounded-xl bg-[rgba(245,240,232,0.02)] border border-[rgba(245,240,232,0.04)]">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">{ch.emoji}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[var(--text-body)]">{ch.title}</div>
                    <div className="text-[11px] text-[var(--text-disabled)]">
                      {new Date(ch.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${pct >= 100 ? 'text-[#3A7D6F]' : 'text-[#B09B71]'}`}>{pct.toFixed(0)}%</span>
                    {pct >= 100 && <span className="ml-1 text-xs"></span>}
                  </div>
                </div>
                <div className="h-2 rounded-full bg-[rgba(245,240,232,0.06)] overflow-hidden">
                  <div className={`h-full rounded-full ${pct >= 100 ? 'bg-[#3A7D6F]' : 'bg-[rgba(176,155,113,0.60)]'}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="text-[10px] text-[var(--text-disabled)] mt-1">
                  {ch.achieved.toLocaleString()} / {ch.goal.toLocaleString()} {ch.unit}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
