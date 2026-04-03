'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  Sparkles, CheckCircle, XCircle, Calendar, Upload, Sun, Snowflake,
  Leaf, Flower2, Clock, AlertTriangle, ChevronRight,
} from 'lucide-react';

interface Season {
  id: string;
  name: string;
  period: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  installBy: string;
  removeBy: string;
  isCurrent: boolean;
}

interface Guideline {
  category: string;
  approved: string[];
  notApproved: string[];
}

interface Submission {
  id: string;
  lot: string;
  description: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

const SEASONS: Season[] = [
  {
    id: 'spring',
    name: 'Spring',
    period: 'March 20 – June 20',
    icon: Flower2,
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
    border: 'border-pink-400/20',
    installBy: 'April 1',
    removeBy: 'June 25',
    isCurrent: true,
  },
  {
    id: 'summer',
    name: 'Summer / 4th of July',
    period: 'June 21 – Sep 22',
    icon: Sun,
    color: 'text-[#B09B71]',
    bg: 'bg-[rgba(176,155,113,0.10)]',
    border: 'border-[rgba(176,155,113,0.20)]',
    installBy: 'June 25',
    removeBy: 'July 10',
    isCurrent: false,
  },
  {
    id: 'fall',
    name: 'Fall / Halloween',
    period: 'Sep 23 – Nov 30',
    icon: Leaf,
    color: 'text-[#B09B71]',
    bg: 'bg-[#B09B71]/10',
    border: 'border-[rgba(176,155,113,0.40)]/20',
    installBy: 'Oct 1',
    removeBy: 'Nov 15',
    isCurrent: false,
  },
  {
    id: 'winter',
    name: 'Winter / Holidays',
    period: 'Dec 1 – Jan 15',
    icon: Snowflake,
    color: 'text-[var(--steel)]',
    bg: 'bg-[var(--steel)]/10',
    border: 'border-[rgba(90,122,154,0.20)]',
    installBy: 'Dec 1',
    removeBy: 'Jan 15',
    isCurrent: false,
  },
];

const GUIDELINES: Guideline[] = [
  {
    category: 'Lighting',
    approved: [
      'LED string lights (warm white or color-matched to season)',
      'Solar-powered stake lights along walkways',
      'Timed outdoor floodlights pointing downward',
      'Lighted wreaths or door accents',
    ],
    notApproved: [
      'Strobe or flashing lights visible from street',
      'Laser light projectors (creates hazards)',
      'Lights left on past midnight',
      'Neon signs in windows',
    ],
  },
  {
    category: 'Yard Decorations',
    approved: [
      'Tasteful inflatables under 6 feet',
      'Natural wreaths and garlands',
      'Potted seasonal plants and flowers',
      'Flag poles with seasonal flags',
    ],
    notApproved: [
      'Inflatables taller than 8 feet',
      'Decorations that block sidewalks or sight lines',
      'Noisy or motion-activated sound effects after 9pm',
      'Commercial or advertising-style displays',
    ],
  },
];

const DEMO_SUBMISSIONS: Submission[] = [
  { id: '1', lot: '8', description: 'Hanging spring flower baskets on porch columns (4 total)', submittedAt: '2026-03-20T10:00:00Z', status: 'approved' },
  { id: '2', lot: '17', description: 'Large Easter bunny inflatable (~5 ft) in front yard', submittedAt: '2026-03-22T14:00:00Z', status: 'pending' },
];

export default function SeasonalDecorPage() {
  const { isConnected } = useAccount();
  const [submissions, setSubmissions] = useState<Submission[]>(DEMO_SUBMISSIONS);
  const [selectedSeason, setSelectedSeason] = useState<Season>(SEASONS[0]);
  const [showSubmit, setShowSubmit] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [myLot] = useState('42');

  useEffect(() => {
    const stored = localStorage.getItem('hoa_decor_submissions');
    if (stored) { try { setSubmissions(JSON.parse(stored)); } catch {} }
  }, []);

  const submit = () => {
    if (!newDesc.trim()) return;
    const s: Submission = {
      id: Date.now().toString(),
      lot: myLot,
      description: newDesc,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };
    const updated = [s, ...submissions];
    setSubmissions(updated);
    localStorage.setItem('hoa_decor_submissions', JSON.stringify(updated));
    setNewDesc('');
    setShowSubmit(false);
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-[var(--text-muted)] mb-4">Sign in to view decoration guidelines</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  const STATUS_MAP = {
    pending: { label: 'Pending Review', color: 'text-[#B09B71]', bg: 'bg-[rgba(176,155,113,0.10)]', border: 'border-[rgba(176,155,113,0.20)]', icon: Clock },
    approved: { label: 'Approved', color: 'text-[#3A7D6F]', bg: 'bg-[#3A7D6F]/10', border: 'border-[rgba(42,93,79,0.20)]', icon: CheckCircle },
    rejected: { label: 'Rejected', color: 'text-[#8B5A5A]', bg: 'bg-[#8B5A5A]/10', border: 'border-[rgba(139,90,90,0.20)]', icon: XCircle },
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-medium gradient-text sm: flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-[#B09B71]" />
            Seasonal Decoration Guidelines
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Approved decoration standards and photo submission for review</p>
        </div>
        <button
          onClick={() => setShowSubmit(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] text-sm font-medium transition-colors"
        >
          <Upload className="w-4 h-4" />
          Submit for Approval
        </button>
      </div>

      {/* Current Season Banner */}
      <div className="mb-8 p-5 rounded-xl bg-gradient-to-r from-pink-500/10 to-[#B09B71]/10 border border-pink-400/20">
        <div className="flex items-center gap-3">
          <Flower2 className="w-8 h-8 text-pink-400" />
          <div>
            <p className="text-xs text-pink-400 font-medium uppercase tracking-wider">Current Season</p>
            <h2 className="text-lg font-medium text-[var(--text-heading)]">Spring Decorations</h2>
            <p className="text-sm text-[var(--text-muted)]">Install by April 1 · Remove by June 25</p>
          </div>
        </div>
      </div>

      {/* Season Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {SEASONS.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setSelectedSeason(s)}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedSeason.id === s.id ? `${s.bg} ${s.border} ring-1 ring-[#B09B71]/30` : 'glass-card border-[rgba(245,240,232,0.10)] hover:border-[rgba(245,240,232,0.20)]'
              } ${s.isCurrent ? 'ring-1 ring-[#B09B71]/20' : ''}`}
            >
              <Icon className={`w-5 h-5 mb-2 ${selectedSeason.id === s.id ? s.color : 'text-[var(--text-disabled)]'}`} />
              <p className={`text-sm font-medium ${selectedSeason.id === s.id ? 'text-[var(--text-heading)]' : 'text-[var(--text-muted)]'}`}>{s.name}</p>
              <p className="text-xs text-[var(--text-disabled)] mt-0.5">{s.period}</p>
              {s.isCurrent && <span className="mt-1 inline-block text-[10px] text-[#B09B71] font-medium">● Current</span>}
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="glass-card rounded-xl p-4 border border-[selectedSeason.border] mb-8 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${selectedSeason.bg} border ${selectedSeason.border}`}>
            <Calendar className={`w-4 h-4 ${selectedSeason.color}`} />
          </div>
          <div>
            <p className="text-xs text-[var(--text-disabled)]">Install By</p>
            <p className="text-sm font-medium text-[var(--text-heading)]">{selectedSeason.installBy}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#8B5A5A]/10 border border-[rgba(139,90,90,0.20)]">
            <AlertTriangle className="w-4 h-4 text-[#8B5A5A]" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-disabled)]">Remove By</p>
            <p className="text-sm font-medium text-[var(--text-heading)]">{selectedSeason.removeBy}</p>
          </div>
        </div>
      </div>

      {/* Guidelines */}
      <div className="space-y-6 mb-8">
        {GUIDELINES.map((g) => (
          <div key={g.category} className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-medium text-[#B09B71] mb-4">{g.category}</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4 text-[#3A7D6F]" />
                  <span className="text-xs font-medium text-[#3A7D6F] uppercase tracking-wider">Approved</span>
                </div>
                <ul className="space-y-2">
                  {g.approved.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-[var(--text-body)]">
                      <ChevronRight className="w-3 h-3 text-[#3A7D6F] mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="w-4 h-4 text-[#8B5A5A]" />
                  <span className="text-xs font-medium text-[#8B5A5A] uppercase tracking-wider">Not Permitted</span>
                </div>
                <ul className="space-y-2">
                  {g.notApproved.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-[var(--text-body)]">
                      <ChevronRight className="w-3 h-3 text-[#8B5A5A] mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* My Submissions */}
      <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">My Submissions</h2>
      <div className="space-y-3">
        {submissions.filter((s) => s.lot === myLot).map((sub) => {
          const cfg = STATUS_MAP[sub.status];
          const Icon = cfg.icon;
          return (
            <div key={sub.id} className={`glass-card rounded-xl p-4 border ${cfg.border}`}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-[var(--text-body)]">{sub.description}</p>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color} border ${cfg.border} shrink-0`}>
                  <Icon className="w-3 h-3" />
                  {cfg.label}
                </div>
              </div>
              <p className="text-xs text-[var(--text-disabled)] mt-2">Submitted {new Date(sub.submittedAt).toLocaleDateString()}</p>
            </div>
          );
        })}
        {submissions.filter((s) => s.lot === myLot).length === 0 && (
          <div className="glass-card rounded-xl p-6 text-center">
            <Upload className="w-8 h-8 text-[var(--text-disabled)] mx-auto mb-2" />
            <p className="text-sm text-[var(--text-muted)]">No submissions yet</p>
          </div>
        )}
      </div>

      {/* Submit Modal */}
      {showSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="glass-card rounded-xl p-6 w-full max-w-md border border-[#B09B71]/20">
            <h2 className="text-lg font-medium mb-4">Submit Decoration for Approval</h2>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Describe your planned decoration (type, size, location on property)..."
              rows={4}
              className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[rgba(245,240,232,0.10)] text-sm text-[var(--text-heading)] placeholder-[rgba(245,240,232,0.20)] focus:border-[#B09B71]/50 focus:outline-none resize-none"
            />
            <p className="text-xs text-[var(--text-disabled)] mt-2">The board will review within 3 business days.</p>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowSubmit(false)} className="flex-1 px-4 py-2 rounded-lg border border-[rgba(245,240,232,0.10)] text-sm text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors">Cancel</button>
              <button onClick={submit} className="flex-1 px-4 py-2 rounded-lg bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] text-sm font-medium transition-colors">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
