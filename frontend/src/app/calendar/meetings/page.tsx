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
        <ClipboardList className="w-8 h-8 text-gray-400 mb-2" />
        <p className="text-gray-400 text-base font-medium">Sign in to view board meetings</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  const displayedMeetings = tab === 'upcoming' ? upcomingMeetings : meetings;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">Board</p>
          <h1 className="text-3xl font-extrabold tracking-tight">Meeting Scheduler</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/calendar" className="text-xs text-gray-500 hover:text-[#c9a96e] transition-colors">
            ← Calendar
          </Link>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2.5 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] text-sm font-bold transition-all"
          >
            {showCreate ? ' Cancel' : '+ Schedule Meeting'}
          </button>
        </div>
      </div>
      <p className="text-gray-500 text-sm mb-8">Schedule and RSVP to board meetings</p>

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
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t
                ? 'bg-[#c9a96e]/15 text-[#e8d5a3] border border-[#c9a96e]/30'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {t === 'upcoming' ? `Upcoming (${upcomingMeetings.length})` : `All (${meetings.length})`}
          </button>
        ))}
      </div>

      {/* Meeting List */}
      {displayedMeetings.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <ClipboardList className="w-8 h-8 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">No Meetings Scheduled</h3>
          <p className="text-sm text-gray-400">Board meetings will appear here once scheduled.</p>
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
              <div key={meeting.id} className={`glass-card rounded-2xl p-6 border-l-2 border-l-[#c9a96e]/40 ${isPast ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-100">{meeting.title}</h3>
                      {isPast && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">Past</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                      <span> {dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span> {dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                      {meeting.location && <span> {meeting.location}</span>}
                      {attendingCount > 0 && <span> {attendingCount} attending{maybeCount > 0 ? `, ${maybeCount} maybe` : ''}</span>}
                    </div>

                    {meeting.agenda && (
                      <div className="text-xs text-gray-500 bg-gray-800/40 rounded-lg p-3 mb-3">
                        <p className="font-medium text-gray-400 mb-1">Agenda:</p>
                        <p className="leading-relaxed whitespace-pre-line">{meeting.agenda}</p>
                      </div>
                    )}

                    {/* RSVP buttons */}
                    {!isPast && (
                      <div className="flex gap-2">
                        {(['attending', 'maybe', 'decline'] as RSVPStatus[]).map(status => {
                          const isSelected = myRsvp?.status === status;
                          const label = status === 'attending' ? ' Attending' : status === 'maybe' ? ' Maybe' : ' Decline';
                          return (
                            <button
                              key={status}
                              onClick={() => address && rsvpMeeting(meeting.id, address, status)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                isSelected
                                  ? status === 'attending'
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : status === 'maybe'
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : 'bg-gray-800/50 text-gray-500 hover:text-gray-300 border border-gray-700/50'
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
    <div className="glass-card rounded-2xl p-6 mb-6 border border-[#c9a96e]/20">
      <h2 className="text-base font-bold text-[#e8d5a3] mb-5">Schedule New Meeting</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Meeting Title *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Q2 2026 Board Meeting"
            className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Date *</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Time *</label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Location</label>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="Faircroft Clubhouse, Room A"
            className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Agenda</label>
          <textarea
            value={agenda}
            onChange={e => setAgenda(e.target.value)}
            placeholder="1. Call to order&#10;2. Review minutes&#10;3. Financial report..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onCreated}
            className="flex-1 py-3 rounded-xl border border-gray-700 text-sm font-medium hover:bg-gray-800/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !date || saving}
            className="flex-1 py-3 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] disabled:opacity-50 text-sm font-bold transition-all"
          >
            {saving ? <span className="flex items-center justify-center gap-1.5"><CalendarDays className="w-4 h-4 animate-pulse" /> Saving...</span> : <span className="flex items-center justify-center gap-1.5"><CalendarDays className="w-4 h-4" /> Schedule Meeting</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
