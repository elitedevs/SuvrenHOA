'use client';

import { useState, useEffect } from 'react';
import { Vote, User, Plus, X, Trophy, Clock, CheckCircle, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  lot: string;
  statement: string;
  votes: number;
  nominated: string; // by lot#
}

interface Election {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
  candidates: Candidate[];
  totalVotes: number;
  myVote?: string; // candidate id
}

const ELECTIONS: Election[] = [
  {
    id: 'e1',
    title: 'Board of Directors Election 2026',
    description: 'Elect 3 board members to serve 2-year terms. All HOA members with NFTs in good standing may vote.',
    startDate: '2026-04-01',
    endDate: '2026-04-14',
    status: 'upcoming',
    candidates: [
      { id: 'c1', name: 'Patricia Holloway', lot: '7', statement: 'I\'ve lived in Faircroft for 8 years and served on the architectural committee. My priority is improving our community\'s green spaces and bringing transparent financial reporting to every resident.', votes: 0, nominated: '12' },
      { id: 'c2', name: 'David Nguyen', lot: '9', statement: 'As a software engineer and blockchain enthusiast, I\'m passionate about the decentralized future of HOA governance. I\'ll push for more on-chain transparency and lower fees.', votes: 0, nominated: '4' },
      { id: 'c3', name: 'Maria Santos', lot: '14', statement: 'Retired property manager with 20+ years of experience. I understand both the business and community sides of HOA management.', votes: 0, nominated: '14' },
    ],
    totalVotes: 0,
  },
  {
    id: 'e2',
    title: 'Special Election: Pool Renovation Approval',
    description: 'Vote to approve $45,000 pool renovation project funded from reserves.',
    startDate: '2026-03-10',
    endDate: '2026-03-24',
    status: 'completed',
    candidates: [
      { id: 'c4', name: 'Approve Renovation', lot: 'Board', statement: 'Full pool resurfacing, new pump system, and accessibility ramp installation.', votes: 11, nominated: 'Board' },
      { id: 'c5', name: 'Reject / Defer', lot: 'Board', statement: 'Wait until next fiscal year and solicit additional bids.', votes: 3, nominated: 'Board' },
    ],
    totalVotes: 14,
  },
];

export default function ElectionsPage() {
  const [elections, setElections] = useState<Election[]>([]);
  const [activeElection, setActiveElection] = useState<string | null>(null);
  const [showNominate, setShowNominate] = useState(false);
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);
  const [nomForm, setNomForm] = useState({ name: '', lot: '', statement: '', nominatedBy: '' });

  useEffect(() => {
    const stored = localStorage.getItem('hoa-elections');
    setElections(stored ? JSON.parse(stored) : ELECTIONS);
  }, []);

  const save = (updated: Election[]) => {
    setElections(updated);
    localStorage.setItem('hoa-elections', JSON.stringify(updated));
  };

  const castVote = (electionId: string, candidateId: string) => {
    save(elections.map(e => {
      if (e.id !== electionId || e.myVote) return e;
      return {
        ...e,
        myVote: candidateId,
        totalVotes: e.totalVotes + 1,
        candidates: e.candidates.map(c => c.id === candidateId ? { ...c, votes: c.votes + 1 } : c),
      };
    }));
  };

  const addNomination = () => {
    if (!nomForm.name || !nomForm.lot || !nomForm.statement || !nomForm.nominatedBy) return;
    save(elections.map(e => {
      if (e.id !== activeElection) return e;
      return {
        ...e,
        candidates: [...e.candidates, {
          id: Date.now().toString(),
          name: nomForm.name,
          lot: nomForm.lot,
          statement: nomForm.statement,
          votes: 0,
          nominated: nomForm.nominatedBy,
        }],
      };
    }));
    setShowNominate(false);
    setNomForm({ name: '', lot: '', statement: '', nominatedBy: '' });
  };

  const STATUS_BADGE: Record<string, string> = {
    upcoming: 'bg-[rgba(90,122,154,0.40)] text-[var(--steel)]',
    active: 'bg-[rgba(42,93,79,0.40)] text-[#2A5D4F]',
    completed: 'bg-[rgba(245,240,232,0.06)] text-[var(--text-muted)]',
  };

  return (
    <div className="min-h-screen bg-[var(--obsidian)] p-6 lg:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-medium gradient-text text-[#D4C4A0] mb-2 flex items-center gap-3">
            <Vote className="w-8 h-8 text-[#B09B71]" /> Board Elections
          </h1>
          <p className="text-[rgba(245,240,232,0.45)]">On-chain democratic governance — nominate, campaign, and vote</p>
        </div>

        <div className="space-y-6">
          {elections.map(election => {
            const isActive = activeElection === election.id;
            const winner = election.status === 'completed'
              ? [...election.candidates].sort((a, b) => b.votes - a.votes)[0]
              : null;

            return (
              <div key={election.id} className="bg-[#1A1A1E] border border-[rgba(245,240,232,0.06)] rounded-xl overflow-hidden">
                {/* Election header */}
                <div className="px-6 py-5 border-b border-[rgba(245,240,232,0.05)]">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h2 className="text-lg font-medium text-[#D4C4A0]">{election.title}</h2>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[election.status]}`}>{election.status}</span>
                      </div>
                      <p className="text-sm text-[var(--text-body)]">{election.description}</p>
                      <div className="flex gap-4 mt-2 text-xs text-[rgba(245,240,232,0.25)]">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{election.startDate} – {election.endDate}</span>
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{election.totalVotes} votes cast</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {election.status === 'upcoming' && (
                        <button
                          onClick={() => { setActiveElection(election.id); setShowNominate(true); }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[rgba(176,155,113,0.20)] border border-[rgba(176,155,113,0.40)] text-[#B09B71] text-sm hover:bg-[var(--brass-deep)]/30 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Nominate
                        </button>
                      )}
                      <button
                        onClick={() => setActiveElection(isActive ? null : election.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[rgba(245,240,232,0.10)] text-[var(--text-body)] hover:text-[#D4C4A0] text-sm transition-colors"
                      >
                        {isActive ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {isActive ? 'Collapse' : 'View Details'}
                      </button>
                    </div>
                  </div>
                  {winner && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <Trophy className="w-4 h-4 text-[#B09B71]" />
                      <span className="text-[#B09B71] font-medium">Winner: {winner.name}</span>
                      <span className="text-[var(--text-muted)]">({winner.votes} votes, {Math.round((winner.votes / election.totalVotes) * 100)}%)</span>
                    </div>
                  )}
                </div>

                {/* Expanded candidates */}
                {isActive && (
                  <div className="p-6">
                    <h3 className="text-sm font-medium text-[var(--text-body)] uppercase tracking-wide mb-4">
                      Candidates ({election.candidates.length})
                    </h3>
                    <div className="space-y-3">
                      {[...election.candidates].sort((a, b) => b.votes - a.votes).map(c => {
                        const pct = election.totalVotes > 0 ? Math.round((c.votes / election.totalVotes) * 100) : 0;
                        const isExpanded = expandedCandidate === c.id;
                        const voted = election.myVote === c.id;
                        return (
                          <div key={c.id} className={`rounded-xl border p-4 transition-all ${voted ? 'border-[var(--brass-deep)]/50 bg-[rgba(176,155,113,0.10)]' : 'border-[rgba(245,240,232,0.08)] bg-[#1A1A1E]'}`}>
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium text-[#D4C4A0]">{c.name}</p>
                                  <span className="text-xs text-[var(--text-muted)]">Lot {c.lot}</span>
                                  {voted && <CheckCircle className="w-4 h-4 text-[#B09B71]" />}
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <div className="flex-1 bg-[rgba(245,240,232,0.06)] rounded-full h-1.5">
                                    <div className="bg-[var(--brass-deep)] h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="text-xs text-[rgba(245,240,232,0.45)] font-mono w-16 text-right">{c.votes} votes ({pct}%)</span>
                                </div>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <button onClick={() => setExpandedCandidate(isExpanded ? null : c.id)} className="text-xs text-[var(--text-muted)] hover:text-[#D4C4A0] transition-colors">
                                  {isExpanded ? 'Hide' : 'Statement'}
                                </button>
                                {(election.status === 'active' || election.status === 'upcoming') && !election.myVote && (
                                  <button
                                    onClick={() => castVote(election.id, c.id)}
                                    className="px-3 py-1.5 rounded-lg bg-[var(--brass-deep)] text-[var(--surface-2)] font-medium text-xs hover:bg-[#B09B71] transition-colors"
                                  >
                                    Vote
                                  </button>
                                )}
                              </div>
                            </div>
                            {isExpanded && (
                              <p className="mt-3 text-sm text-[var(--text-body)] italic border-t border-[rgba(245,240,232,0.06)] pt-3">
                                "{c.statement}"
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Election timeline */}
        <div className="mt-8 bg-[#1A1A1E] border border-[rgba(245,240,232,0.06)] rounded-xl p-6">
          <h2 className="text-lg font-medium text-[#D4C4A0] mb-5 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#B09B71]" /> Election Timeline
          </h2>
          <div className="space-y-4">
            {[
              { phase: 'Nomination Period', date: 'Mar 15 – Mar 31', done: true, desc: 'Residents nominate candidates. Self-nominations welcome.' },
              { phase: 'Campaign Period', date: 'Apr 1 – Apr 7', done: false, desc: 'Candidates share statements. Town hall on Apr 5.' },
              { phase: 'Voting Opens', date: 'Apr 8', done: false, desc: 'On-chain voting begins. One NFT = one vote.' },
              { phase: 'Voting Closes', date: 'Apr 14', done: false, desc: 'Smart contract tallies results immutably.' },
              { phase: 'Results Certified', date: 'Apr 15', done: false, desc: 'Board transition begins. New members onboarded.' },
            ].map(({ phase, date, done, desc }, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${done ? 'bg-[var(--brass-deep)] text-[var(--surface-2)]' : 'border-2 border-[rgba(245,240,232,0.12)] text-[rgba(245,240,232,0.25)]'}`}>
                    {done ? '' : i + 1}
                  </div>
                  {i < 4 && <div className="w-0.5 h-8 bg-[rgba(245,240,232,0.06)] mt-1" />}
                </div>
                <div className="pb-4">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium text-sm ${done ? 'text-[#B09B71]' : 'text-[rgba(245,240,232,0.75)]'}`}>{phase}</p>
                    <span className="text-xs text-[rgba(245,240,232,0.25)]">{date}</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Nominate modal */}
      {showNominate && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1A1E] border border-[rgba(245,240,232,0.10)] rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-medium text-[#D4C4A0]">Nominate a Candidate</h3>
              <button onClick={() => setShowNominate(false)}><X className="w-4 h-4 text-[var(--text-muted)]" /></button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Candidate Full Name *', key: 'name', placeholder: 'Jane Doe' },
                { label: 'Candidate Lot # *', key: 'lot', placeholder: '12' },
                { label: 'Your Lot # (Nominator) *', key: 'nominatedBy', placeholder: '7' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">{label}</label>
                  <input value={(nomForm as any)[key]} onChange={e => setNomForm({ ...nomForm, [key]: e.target.value })} placeholder={placeholder} className="w-full bg-[#222228] border border-[rgba(245,240,232,0.12)] rounded-lg px-3 py-2 text-sm text-[#D4C4A0] focus:outline-none focus:border-[#B09B71]" />
                </div>
              ))}
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Campaign Statement *</label>
                <textarea value={nomForm.statement} onChange={e => setNomForm({ ...nomForm, statement: e.target.value })} rows={4} placeholder="Why should residents vote for this candidate?" className="w-full bg-[#222228] border border-[rgba(245,240,232,0.12)] rounded-lg px-3 py-2 text-sm text-[#D4C4A0] focus:outline-none focus:border-[#B09B71] resize-none" />
              </div>
              <button onClick={addNomination} disabled={!nomForm.name || !nomForm.lot || !nomForm.statement || !nomForm.nominatedBy} className="w-full py-2.5 rounded-xl bg-[var(--brass-deep)] text-[var(--surface-2)] font-medium disabled:opacity-40 hover:bg-[#B09B71] transition-colors">
                Submit Nomination
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
