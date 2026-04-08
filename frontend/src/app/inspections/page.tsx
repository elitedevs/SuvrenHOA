'use client';
import { AuthWall } from '@/components/AuthWall';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import {
  ClipboardCheck, CheckCircle, AlertTriangle, XCircle, Calendar, Clock,
  Plus, Building2, BarChart2, ChevronRight, X,
} from 'lucide-react';

type InspectionResult = 'pass' | 'needs-attention' | 'violation' | 'pending';

interface Inspection {
  id: string;
  lot: string;
  address: string;
  scheduledDate: string;
  type: 'annual' | 'quarterly' | 'follow-up';
  result: InspectionResult;
  notes: string;
  inspector: string;
  completedAt?: string;
}

const RESULT_CONFIG: Record<InspectionResult, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  pass: { label: 'Pass', icon: CheckCircle, color: 'text-[#2A5D4F]', bg: 'bg-[rgba(58,125,111,0.10)]', border: 'border-[rgba(42,93,79,0.20)]' },
  'needs-attention': { label: 'Needs Attention', icon: AlertTriangle, color: 'text-[#B09B71]', bg: 'bg-[rgba(176,155,113,0.10)]', border: 'border-[rgba(176,155,113,0.20)]' },
  violation: { label: 'Violation', icon: XCircle, color: 'text-[#8B5A5A]', bg: 'bg-[rgba(139,90,90,0.10)]', border: 'border-[rgba(139,90,90,0.20)]' },
  pending: { label: 'Scheduled', icon: Clock, color: 'text-[var(--steel)]', bg: 'bg-[var(--steel)]/10', border: 'border-[rgba(90,122,154,0.20)]' },
};

const TYPE_LABELS = { annual: 'Annual', quarterly: 'Quarterly', 'follow-up': 'Follow-Up' };

const DEMO_INSPECTIONS: Inspection[] = [
  { id: '1', lot: '8', address: '8 Maple Drive', scheduledDate: '2026-04-15', type: 'annual', result: 'pending', notes: '', inspector: 'Board Committee', completedAt: undefined },
  { id: '2', lot: '8', address: '8 Maple Drive', scheduledDate: '2025-10-10', type: 'annual', result: 'pass', notes: 'Property in excellent condition. Lawn well-maintained, no exterior issues noted.', inspector: 'Board Committee', completedAt: '2025-10-10' },
  { id: '3', lot: '17', address: '17 Oak Avenue', scheduledDate: '2026-04-15', type: 'annual', result: 'pending', notes: '', inspector: 'Board Committee' },
  { id: '4', lot: '17', address: '17 Oak Avenue', scheduledDate: '2025-10-10', type: 'annual', result: 'needs-attention', notes: 'Paint peeling on south fence. Please remedy within 60 days.', inspector: 'Board Committee', completedAt: '2025-10-10' },
  { id: '5', lot: '15', address: '15 South Gate Rd', scheduledDate: '2026-01-15', type: 'quarterly', result: 'violation', notes: 'Unauthorized shed constructed without architectural approval. Removal or retroactive approval required.', inspector: 'Board Committee', completedAt: '2026-01-15' },
  { id: '6', lot: '6', address: '6 North Creek Dr', scheduledDate: '2026-04-15', type: 'annual', result: 'pending', notes: '', inspector: 'Board Committee' },
];

const MY_LOT = '42';

function InspectionCard({ inspection }: { inspection: Inspection }) {
  const cfg = RESULT_CONFIG[inspection.result];
  const Icon = cfg.icon;
  const isUpcoming = inspection.result === 'pending';
  const daysAway = Math.ceil((new Date(inspection.scheduledDate).getTime() - Date.now()) / 86400000);

  return (
    <div className={`glass-card rounded-xl p-4 border ${cfg.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${cfg.bg} border ${cfg.border} shrink-0`}>
            <Icon className={`w-4 h-4 ${cfg.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-[var(--text-heading)]">{TYPE_LABELS[inspection.type]} Inspection</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color} border ${cfg.border}`}>{cfg.label}</span>
            </div>
            <p className="text-xs text-[var(--text-disabled)] mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(inspection.scheduledDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            {isUpcoming && daysAway > 0 && (
              <p className="text-xs text-[var(--steel)] mt-1">In {daysAway} {daysAway === 1 ? 'day' : 'days'}</p>
            )}
          </div>
        </div>
        <p className="text-xs text-[var(--text-disabled)] shrink-0">by {inspection.inspector}</p>
      </div>
      {inspection.notes && (
        <div className={`mt-3 p-2.5 rounded-lg ${cfg.bg} border ${cfg.border}`}>
          <p className="text-xs text-[var(--text-body)]">{inspection.notes}</p>
        </div>
      )}
    </div>
  );
}

export default function InspectionsPage() {
  const { isConnected } = useAccount();
  const [inspections, setInspections] = useState<Inspection[]>(DEMO_INSPECTIONS);
  const [tab, setTab] = useState<'my' | 'all' | 'schedule'>('my');
  const [showSchedule, setShowSchedule] = useState(false);
  const [schedForm, setSchedForm] = useState({ lot: '', address: '', date: '', type: 'annual' as Inspection['type'] });

  useEffect(() => {
    const stored = localStorage.getItem('hoa_inspections');
    if (stored) { try { setInspections(JSON.parse(stored)); } catch {} }
  }, []);

  const save = (i: Inspection[]) => {
    setInspections(i);
    localStorage.setItem('hoa_inspections', JSON.stringify(i));
  };

  const scheduleInspection = () => {
    if (!schedForm.lot || !schedForm.date) return;
    const n: Inspection = {
      id: Date.now().toString(),
      lot: schedForm.lot,
      address: schedForm.address || `Lot ${schedForm.lot}`,
      scheduledDate: schedForm.date,
      type: schedForm.type,
      result: 'pending',
      notes: '',
      inspector: 'Board Committee',
    };
    save([...inspections, n]);
    setShowSchedule(false);
    setSchedForm({ lot: '', address: '', date: '', type: 'annual' });
  };

  const myInspections = inspections.filter((i) => i.lot === MY_LOT).sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));
  const upcomingAll = inspections.filter((i) => i.result === 'pending').sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  const myUpcoming = myInspections.find((i) => i.result === 'pending');
  const myHistory = myInspections.filter((i) => i.result !== 'pending');

  const stats = {
    total: inspections.length,
    pass: inspections.filter((i) => i.result === 'pass').length,
    attention: inspections.filter((i) => i.result === 'needs-attention').length,
    violations: inspections.filter((i) => i.result === 'violation').length,
  };

  if (!isConnected) {
    return <AuthWall title="Inspections" description="View inspection schedules, results, and compliance status." />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-medium gradient-text sm: flex items-center gap-3">
            <ClipboardCheck className="w-7 h-7 text-[#B09B71]" />
            Property Inspections
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Schedule and track annual and quarterly property inspections</p>
        </div>
        <button
          onClick={() => setShowSchedule(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Schedule Inspection
        </button>
      </div>

      {/* My upcoming */}
      {myUpcoming && (
        <div className="mb-8 p-5 rounded-xl bg-[rgba(90,122,154,0.10)] border border-[rgba(90,122,154,0.20)]">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-[var(--steel)] shrink-0" />
            <div>
              <p className="text-sm font-medium text-[var(--steel)]">Your Next Inspection</p>
              <p className="text-[var(--text-heading)] font-medium">{new Date(myUpcoming.scheduledDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="text-xs text-[var(--text-muted)]">{TYPE_LABELS[myUpcoming.type]} · {myUpcoming.inspector}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', value: stats.total, color: 'text-[#B09B71]', icon: BarChart2 },
          { label: 'Passed', value: stats.pass, color: 'text-[#2A5D4F]', icon: CheckCircle },
          { label: 'Needs Attention', value: stats.attention, color: 'text-[#B09B71]', icon: AlertTriangle },
          { label: 'Violations', value: stats.violations, color: 'text-[#8B5A5A]', icon: XCircle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="glass-card rounded-xl p-4 text-center">
            <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
            <p className={`text-2xl font-medium ${color}`}>{value}</p>
            <p className="text-xs text-[var(--text-disabled)] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--surface-2)] border border-[rgba(245,240,232,0.10)] mb-6">
        {[
          { id: 'my', label: 'My Property' },
          { id: 'all', label: 'Upcoming (All)' },
          { id: 'schedule', label: 'All Records' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id as any)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === id ? 'bg-[#B09B71] text-[var(--surface-2)]' : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'my' && (
        <div className="space-y-4">
          {myInspections.map((i) => <InspectionCard key={i.id} inspection={i} />)}
          {myInspections.length === 0 && (
            <div className="glass-card rounded-xl p-8 text-center">
              <ClipboardCheck className="w-10 h-10 text-[var(--text-disabled)] mx-auto mb-3" />
              <p className="text-[var(--text-muted)]">No inspections recorded for your property</p>
            </div>
          )}
        </div>
      )}

      {tab === 'all' && (
        <div className="space-y-3">
          {upcomingAll.map((i) => (
            <div key={i.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-heading)]">{i.address}</p>
                <p className="text-xs text-[var(--text-muted)]">{TYPE_LABELS[i.type]} · {new Date(i.scheduledDate).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--steel)]/10 text-[var(--steel)] border border-[rgba(90,122,154,0.20)]">Lot #{i.lot}</span>
              </div>
            </div>
          ))}
          {upcomingAll.length === 0 && (
            <div className="glass-card rounded-xl p-8 text-center">
              <Calendar className="w-8 h-8 text-[var(--text-disabled)] mx-auto mb-2" />
              <p className="text-[var(--text-muted)]">No upcoming inspections scheduled</p>
            </div>
          )}
        </div>
      )}

      {tab === 'schedule' && (
        <div className="space-y-3">
          {inspections.sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate)).map((i) => {
            const cfg = RESULT_CONFIG[i.result];
            const Icon = cfg.icon;
            return (
              <div key={i.id} className={`glass-card rounded-xl p-4 border ${cfg.border} flex items-center justify-between`}>
                <div>
                  <p className="text-sm font-medium text-[var(--text-heading)]">{i.address}</p>
                  <p className="text-xs text-[var(--text-muted)]">{TYPE_LABELS[i.type]} · {new Date(i.scheduledDate).toLocaleDateString()}</p>
                  {i.notes && <p className="text-xs text-[var(--text-disabled)] mt-1 truncate max-w-xs">{i.notes}</p>}
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                  <Icon className="w-3 h-3" />
                  {cfg.label}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Modal */}
      {showSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="glass-card rounded-xl p-6 w-full max-w-md border border-[rgba(176,155,113,0.20)]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-medium">Schedule Inspection</h2>
              <button onClick={() => setShowSchedule(false)} className="p-1 rounded text-[var(--text-disabled)] hover:text-[var(--text-heading)]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">Lot #</label>
                  <input
                    value={schedForm.lot}
                    onChange={(e) => setSchedForm((f) => ({ ...f, lot: e.target.value }))}
                    placeholder="42"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[rgba(245,240,232,0.10)] text-sm text-[var(--text-heading)] placeholder-[rgba(245,240,232,0.20)] focus:border-[rgba(176,155,113,0.50)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">Type</label>
                  <select
                    value={schedForm.type}
                    onChange={(e) => setSchedForm((f) => ({ ...f, type: e.target.value as any }))}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[rgba(245,240,232,0.10)] text-sm text-[var(--text-heading)] focus:border-[rgba(176,155,113,0.50)] focus:outline-none"
                  >
                    <option value="annual">Annual</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="follow-up">Follow-Up</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Address</label>
                <input
                  value={schedForm.address}
                  onChange={(e) => setSchedForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="42 Maple Drive"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[rgba(245,240,232,0.10)] text-sm text-[var(--text-heading)] placeholder-[rgba(245,240,232,0.20)] focus:border-[rgba(176,155,113,0.50)] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Inspection Date</label>
                <input
                  type="date"
                  value={schedForm.date}
                  onChange={(e) => setSchedForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[rgba(245,240,232,0.10)] text-sm text-[var(--text-heading)] focus:border-[rgba(176,155,113,0.50)] focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowSchedule(false)} className="flex-1 px-4 py-2 rounded-lg border border-[rgba(245,240,232,0.10)] text-sm text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors">Cancel</button>
              <button onClick={scheduleInspection} className="flex-1 px-4 py-2 rounded-lg bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] text-sm font-medium transition-colors">Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
