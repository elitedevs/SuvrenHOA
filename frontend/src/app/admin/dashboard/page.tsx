'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useTreasury } from '@/hooks/useTreasury';
import { useMaintenanceRequests } from '@/hooks/useMaintenance';
import { useGovernorSettings } from '@/hooks/useProposals';
import { useIncidents } from '@/hooks/useIncidents';
import Link from 'next/link';
import {
  AlertTriangle, Wrench, Vote, DollarSign, Activity, Shield,
  ArrowRight, Clock, CheckCircle2
} from 'lucide-react';

// Check if board member — in real app would use contract role check
// For demo, use localStorage flag
function useBoardMember() {
  const { address } = useAccount();
  const [isBoard, setIsBoard] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!address) { setChecked(true); return; }
    // Check localStorage flag (set by admin page)
    const flag = localStorage.getItem(`suvren_board_${address.toLowerCase()}`);
    setIsBoard(flag === 'true');
    setChecked(true);
  }, [address]);

  return { isBoard, checked };
}

interface ActivityEvent {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'success';
}

function getRecentActivity(): ActivityEvent[] {
  const events: ActivityEvent[] = [
    { id: '1', type: 'payment', message: 'Lot #42 paid Q1 dues ($200 USDC)', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), severity: 'success' },
    { id: '2', type: 'maintenance', message: 'New maintenance request: Pool pump failure', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), severity: 'warning' },
    { id: '3', type: 'violation', message: 'Violation issued: Lot #17 — tall grass', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), severity: 'warning' },
    { id: '4', type: 'document', message: 'Meeting minutes uploaded to registry', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), severity: 'info' },
    { id: '5', type: 'proposal', message: 'New proposal submitted: Repave main entrance', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), severity: 'info' },
  ];
  return events;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  return 'Just now';
}

function StatCard({ icon: Icon, label, value, sub, color, href }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  href?: string;
}) {
  const content = (
    <div className={`glass-card rounded-xl p-5 border-l-2 ${color} hover:opacity-90 transition-all group`}>
      <div className="flex items-start justify-between mb-3">
        <Icon className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-body)] transition-colors" />
        {href && <ArrowRight className="w-4 h-4 text-[var(--text-disabled)] group-hover:text-[var(--text-muted)] transition-colors" />}
      </div>
      <p className="text-2xl font-normal text-[var(--text-heading)] mb-1">{value}</p>
      <p className="text-xs font-medium text-[var(--text-body)]">{label}</p>
      {sub && <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{sub}</p>}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function QuickActionButton({ href, emoji, label, desc, urgent }: {
  href: string;
  emoji: string;
  label: string;
  desc: string;
  urgent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 p-4 rounded-xl border transition-all group ${
        urgent
          ? 'bg-[rgba(139,90,90,0.05)] border-[rgba(139,90,90,0.20)] hover:border-[rgba(139,90,90,0.40)]'
          : 'bg-[rgba(245,240,232,0.03)] border-[rgba(245,240,232,0.06)] hover:border-[rgba(176,155,113,0.30)]'
      }`}
    >
      <span className="text-xl group-hover:scale-110 transition-transform inline-block">{emoji}</span>
      <div>
        <p className={`text-xs font-medium leading-tight ${urgent ? 'text-[#8B5A5A]' : 'text-[#B09B71]'}`}>{label}</p>
        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{desc}</p>
      </div>
    </Link>
  );
}

export default function BoardDashboardPage() {
  const { isConnected } = useAccount();
  const { isBoard, checked } = useBoardMember();
  const { totalBalance } = useTreasury();
  const { data: requests = [] } = useMaintenanceRequests();
  const { activeProposalCount } = useGovernorSettings();
  const { incidents } = useIncidents();
  const activity = getRecentActivity();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-[var(--text-body)] mb-4">Sign in to access the board dashboard</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  if (!checked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-[#B09B71] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isBoard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="w-16 h-16 rounded-xl bg-[rgba(139,90,90,0.10)] border border-[rgba(139,90,90,0.20)] flex items-center justify-center text-3xl mb-4">
          
        </div>
        <h2 className="text-xl font-medium text-[var(--text-heading)] mb-2">Board Members Only</h2>
        <p className="text-sm text-[var(--text-muted)] max-w-sm mb-6">
          This dashboard is restricted to HOA board members. Contact your board administrator to request access.
        </p>
        <Link href="/admin" className="px-4 py-2 rounded-xl bg-[rgba(245,240,232,0.05)] border border-[rgba(245,240,232,0.08)] text-sm text-[var(--text-body)] hover:text-[var(--text-body)] transition-colors">
          → Go to Admin Panel
        </Link>
        {/* Dev bypass */}
        <button
          onClick={() => {
            const addr = window.localStorage;
            // Allow dev access for demo
            const keys = Object.keys(localStorage).filter(k => k.startsWith('suvren_board_'));
            if (keys.length === 0) {
              // Auto-enable for first visit in dev
              const accounts = Object.keys(localStorage).filter(k => k.startsWith('suvren_onboarding_'));
              if (accounts.length > 0) {
                const addr2 = accounts[0].replace('suvren_onboarding_', '');
                localStorage.setItem(`suvren_board_${addr2}`, 'true');
                window.location.reload();
              }
            }
          }}
          className="mt-4 text-xs text-[var(--text-disabled)] hover:text-[var(--text-muted)]"
        >
          (Demo: enable board access via admin panel)
        </button>
      </div>
    );
  }

  const openMaintenance = requests.filter((r: any) => r.status === 'open' || r.status === 'pending').length;
  const openIncidents = incidents.filter((i: any) => i.status === 'open' || i.status === 'active').length;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 page-enter">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-[#B09B71]" />
          <p className="text-xs text-[#B09B71] font-medium uppercase tracking-widest">Board Member Portal</p>
        </div>
        <h1 className="text-3xl sm:text-4xl font-medium gradient-text">Board Dashboard</h1>
        <p className="text-[var(--text-body)] text-sm mt-2">HOA operations overview — real-time status</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="col-span-2 sm:col-span-1 lg:col-span-1">
          <StatCard
            icon={AlertTriangle}
            label="Pending Violations"
            value={3}
            sub="needs response"
            color="border-l-red-500/50"
            href="/violations"
          />
        </div>
        <div className="col-span-2 sm:col-span-1 lg:col-span-1">
          <StatCard
            icon={Wrench}
            label="Open Maintenance"
            value={openMaintenance}
            sub="open requests"
            color="border-l-orange-500/50"
            href="/maintenance"
          />
        </div>
        <div className="col-span-2 sm:col-span-1 lg:col-span-1">
          <StatCard
            icon={Vote}
            label="Active Votes"
            value={activeProposalCount}
            sub="open proposals"
            color="border-l-blue-500/50"
            href="/proposals"
          />
        </div>
        <div className="col-span-2 sm:col-span-1 lg:col-span-1">
          <StatCard
            icon={DollarSign}
            label="Treasury"
            value={`$${totalBalance}`}
            sub="USDC balance"
            color="border-l-green-500/50"
            href="/treasury"
          />
        </div>
        <div className="col-span-2 sm:col-span-1 lg:col-span-1">
          <StatCard
            icon={Shield}
            label="Open Incidents"
            value={openIncidents}
            sub="unresolved"
            color="border-l-purple-500/50"
            href="/safety"
          />
        </div>
        <div className="col-span-2 sm:col-span-1 lg:col-span-1">
          <StatCard
            icon={Activity}
            label="Monthly Activity"
            value={activity.length}
            sub="recent events"
            color="border-l-[rgba(176,155,113,0.50)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="lg:col-span-2 glass-card rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[rgba(245,240,232,0.06)] flex items-center justify-between">
            <h2 className="text-lg font-medium text-[#D4C4A0]">Recent Activity</h2>
            <Link href="/activity" className="text-xs text-[#B09B71] hover:text-[#D4C4A0] transition-colors">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-[rgba(245,240,232,0.04)]">
            {activity.map(event => (
              <div key={event.id} className="flex items-start gap-3 px-6 py-4 hover:bg-[rgba(245,240,232,0.02)] transition-colors">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  event.severity === 'success' ? 'bg-[#3A7D6F]' :
                  event.severity === 'warning' ? 'bg-[#B09B71]' :
                  'bg-[var(--steel)]'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--text-body)] leading-relaxed">{event.message}</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {timeAgo(event.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[rgba(245,240,232,0.06)]">
              <h2 className="text-lg font-medium text-[#D4C4A0]">Quick Actions</h2>
            </div>
            <div className="p-4 space-y-2">
              <QuickActionButton href="/violations" emoji="" label="Review Violations" desc="3 pending response" urgent />
              <QuickActionButton href="/maintenance" emoji="" label="Maintenance Queue" desc="Assign open requests" />
              <QuickActionButton href="/proposals" emoji="" label="Proposals" desc="Monitor active votes" />
              <QuickActionButton href="/treasury/budget" emoji="" label="Budget Planner" desc="FY 2026 planning" />
              <QuickActionButton href="/documents" emoji="" label="Upload Minutes" desc="Board meeting records" />
              <QuickActionButton href="/announcements" emoji="" label="Post Announcement" desc="Notify residents" />
            </div>
          </div>

          {/* Upcoming */}
          <div className="glass-card rounded-xl p-5">
            <h2 className="text-lg font-medium text-[#D4C4A0] mb-3">Upcoming</h2>
            <div className="space-y-3">
              {[
                { date: 'Apr 1', label: 'Q2 Dues Due', color: 'text-[#B09B71]' },
                { date: 'Apr 8', label: 'Board Meeting', color: 'text-[var(--steel)]' },
                { date: 'Apr 15', label: 'Budget Review', color: 'text-[#B09B71]' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="text-[11px] font-medium text-[var(--text-muted)] w-12 shrink-0">{item.date}</div>
                  <div className={`text-xs font-medium ${item.color}`}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
