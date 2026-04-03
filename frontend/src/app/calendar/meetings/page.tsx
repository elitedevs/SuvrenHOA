'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useMeetings, type RSVPStatus } from '@/hooks/useMeetings';
import Link from 'next/link';
import { CalendarDays, ClipboardList } from 'lucide-react';

export default function MeetingsPage() {
  const { isConnected, address } = useAccount();
  const { meetings, upcomingMeetings, createMeeting, rsvpMeeting, deleteMeeting } = useMeetings();
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState<'upcoming' | 'all'>('upcoming');

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ClipboardList className="w-8 h-8 text-[var(--text-muted)] mb-2" />
        <p className="text-[var(--text-muted)] text-base font-medium">Sign in to view board meetings</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  const displayedMeetings = tab === 'upcoming' ? upcomingMeetings : meetings;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-1">Board</p>
          <h1 className="text-3xl sm:text-4xl font-medium gradient-text">Meeting Scheduler</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/calendar" className="text-xs text-[var(--text-disabled)] hover:text-[#B09B71] transition-colors">
            ← Calendar
          </Link>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2.5 rounded-lg bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] text-sm font-medium transition-all"
          >
            {showCreate ? 'Cancel' : '+ Schedule Meeting'}
          </button>
        </div>
      </div>
      <p className="text-[var(--text-disabled)] text-sm mb-8">Schedule and RSVP to board meetings</p>

      {/* Create Form */}
      {showCreate && (
        <CreateMeetingForm
          address={address!}
          onCreated={() => setShowCreate(false)}
          createMeeting={createMeeting}
        />
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['upcoming', 'all'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t
                ? 'bg-[rgba(176,155,113,0.15)] text-[#D4C4A0] border border-[rgba(176,155,113,0.30)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'
            }`}
          >
            {t === 'upcoming' ? `Upcoming (${upcomingMeetings.length})` : `All (${meetings.length})`}
          </button>
        ))}
      </div>

      {/* Meeting List */}
      {displayedMeetings.length === 0 ? (
        <div className="glass-card rounded-lg p-12 text-center">
          <ClipboardList className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Meetings Scheduled</h3>
          <p className="text-sm text-[var(--text-muted)]">Board meetings will appear here once scheduled.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedMeetings.map(meeting => {
            const dt = new Date(meeting.date + 'T' + meeting.time);
            const isPast = dt < new Date();
            const myRsvp = meeting.rsvps.find(r => r.address === address?.toLowerCase());
            const attendingCount = meeting.rsvps.filter(r => r.status === 'attending').length;
            const maybeCount = meeting.rsvps.filter(r => r.status === 'maybe').length;

            return (
              <div key={meeting.id} className={`glass-card rounded-lg p-6 ${isPast ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-[var(--parchment)]">{meeting.title}</h3>
                      {isPast && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-3)] text-[var(--text-muted)]">Past</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-[var(--text-disabled)] mb-3">
                      <span>{dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span>{dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                      {meeting.location && <span>{meeting.location}</span>}
                      {attendingCount > 0 && <span>{attendingCount} attending{maybeCount > 0 ? `, ${maybeCount} maybe` : ''}</span>}
                    </div>

                    {meeting.agenda && (
                      <div className="text-xs text-[var(--text-disabled)] bg-[rgba(26,26,30,0.40)] rounded-lg p-3 mb-3">
                        <p className="font-medium text-[var(--text-muted)] mb-1">Agenda:</p>
                        <p className="leading-relaxed whitespace-pre-line">{meeting.agenda}</p>
                      </div>
                    )}

                    {/* RSVP buttons */}
                    {!isPast && (
                      <div className="flex gap-2">
                        {(['attending', 'maybe', 'decline'] as RSVPStatus[]).map(status => {
                          const isSelected = myRsvp?.status === status;
                          const label = status === 'attending' ? 'Attending' : status === 'maybe' ? 'Maybe' : 'Decline';
                          return (
                            <button
                              key={status}
                              onClick={() => address && rsvpMeeting(meeting.id, address, status)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                isSelected
                                  ? status === 'attending'
                                    ? 'bg-[rgba(42,93,79,0.15)] text-[#3A7D6F] border border-[rgba(42,93,79,0.25)]'
                                    : status === 'maybe'
                                    ? 'bg-[rgba(176,155,113,0.15)] text-[#B09B71] border border-[rgba(176,155,113,0.25)]'
                                    : 'bg-[rgba(107,58,58,0.15)] text-[#8B5A5A] border border-[rgba(107,58,58,0.25)]'
                                  : 'bg-[rgba(26,26,30,0.50)] text-[var(--text-disabled)] hover:text-[var(--text-body)] border border-[rgba(245,240,232,0.08)]'
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CreateMeetingForm({
  address,
  onCreated,
  createMeeting,
}: {
  address: string;
  onCreated: () => void;
  createMeeting: ReturnType<typeof useMeetings>['createMeeting'];
}) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('18:00');
  const [location, setLocation] = useState('');
  const [agenda, setAgenda] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = () => {
    if (!title.trim() || !date) return;
    setSaving(true);
    createMeeting({ title: title.trim(), date, time, location: location.trim(), agenda: agenda.trim(), createdBy: address });
    setTimeout(() => {
      setSaving(false);
      onCreated();
    }, 300);
  };

  return (
    <div className="glass-card rounded-lg p-6 mb-6 border border-[rgba(176,155,113,0.20)]">
      <h2 className="text-base font-medium text-[#D4C4A0] mb-5">Schedule New Meeting</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-2">Meeting Title *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Q2 2026 Board Meeting"
            className="w-full px-4 py-3 rounded-lg bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-2">Date *</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 rounded-lg bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-2">Time *</label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-2">Location</label>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="Faircroft Clubhouse, Room A"
            className="w-full px-4 py-3 rounded-lg bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-2">Agenda</label>
          <textarea
            value={agenda}
            onChange={e => setAgenda(e.target.value)}
            placeholder="1. Call to order&#10;2. Review minutes&#10;3. Financial report..."
            rows={4}
            className="w-full px-4 py-3 rounded-lg bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onCreated}
            className="flex-1 py-3 rounded-lg border border-[rgba(245,240,232,0.08)] text-sm font-medium hover:bg-[rgba(245,240,232,0.04)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !date || saving}
            className="flex-1 py-3 rounded-lg bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] disabled:opacity-50 text-sm font-medium transition-all"
          >
            {saving ? <span className="flex items-center justify-center gap-1.5"><CalendarDays className="w-4 h-4 animate-pulse" /> Saving...</span> : <span className="flex items-center justify-center gap-1.5"><CalendarDays className="w-4 h-4" /> Schedule Meeting</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
