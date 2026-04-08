'use client';
import { AuthWall } from '@/components/AuthWall';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays } from 'lucide-react';

const EVENT_TYPES = [
  { id: 'community', label: 'Community', icon: '', color: 'gold' },
  { id: 'board-meeting', label: 'Board Meeting', icon: '', color: 'brass' },
  { id: 'committee', label: 'Committee', icon: '', color: 'brass' },
  { id: 'deadline', label: 'Deadline', icon: '', color: 'red' },
  { id: 'holiday', label: 'Holiday', icon: '', color: 'verdigris' },
  { id: 'social', label: 'Social', icon: '', color: 'gold' },
  { id: 'maintenance', label: 'Maintenance', icon: '', color: 'muted' },
];

export default function CalendarPage() {
  const { isConnected, address } = useAccount();
  const [showCreate, setShowCreate] = useState(false);
  const [view, setView] = useState<'list' | 'month'>('list');

  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await fetch('/api/events');
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30_000,
  });

  if (!isConnected) {
    return <AuthWall title="Community Calendar" description="Stay up to date with community events, meetings, and important dates." />;
  }

  // Group events by date
  const eventsByDate: Record<string, any[]> = {};
  (events || []).forEach((e: any) => {
    const date = new Date(e.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    if (!eventsByDate[date]) eventsByDate[date] = [];
    eventsByDate[date].push(e);
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-medium gradient-text sm: flex items-center gap-2"><CalendarDays className="w-7 h-7 text-[#B09B71]" /> Community Calendar</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Events, meetings, deadlines, and community gatherings
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/calendar/meetings"
            className="px-4 py-2.5 rounded-lg bg-[rgba(26,26,30,0.60)] border border-[rgba(245,240,232,0.08)] hover:border-[rgba(176,155,113,0.30)] text-sm font-medium text-[var(--text-muted)] hover:text-[#D4C4A0] transition-all"
          >
            Board Meetings
          </a>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-5 py-2.5 rounded-lg bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] text-sm font-medium transition-all"
          >
            {showCreate ? '← Back' : 'Add Event'}
          </button>
        </div>
      </div>

      {/* Event Type Legend */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {EVENT_TYPES.map(t => (
          <span key={t.id} className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] whitespace-nowrap px-2 py-1 rounded-lg bg-[rgba(26,26,30,0.30)]">
            {t.label}
          </span>
        ))}
      </div>

      {showCreate ? (
        <CreateEvent onClose={() => setShowCreate(false)} />
      ) : isLoading ? (
        <div className="text-center py-12 text-[var(--text-disabled)]">Loading events...</div>
      ) : Object.keys(eventsByDate).length === 0 ? (
        <div className="glass-card rounded-lg p-12 text-center">
          <CalendarDays className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No upcoming events</h3>
          <p className="text-sm text-[var(--text-muted)]">Board meetings, community events, and deadlines will appear here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(eventsByDate).map(([date, dayEvents]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-[var(--text-body)] mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[rgba(176,155,113,0.80)]" />
                {date}
              </h3>
              <div className="space-y-2">
                {dayEvents.map((event: any) => (
                  <EventCard key={event.id} event={event} walletAddress={address} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ event, walletAddress }: { event: any; walletAddress?: string }) {
  const qc = useQueryClient();
  const type = EVENT_TYPES.find(t => t.id === event.event_type) || EVENT_TYPES[0];
  const rsvps = event.hoa_event_rsvps || [];
  const goingCount = rsvps.filter((r: any) => r.status === 'going').length;
  const myRsvp = rsvps.find((r: any) => r.wallet_address === walletAddress?.toLowerCase());

  const rsvp = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch('/api/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: event.id, wallet_address: walletAddress, status }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });

  const startTime = new Date(event.start_time);
  const endTime = event.end_time ? new Date(event.end_time) : null;
  const isPast = startTime < new Date();

  const colorClass = type.color === 'gold' ? 'border-l-[#B09B71]' :
    type.color === 'brass' ? 'border-l-[#B09B71]' :
    type.color === 'red' ? 'border-l-[#6B3A3A]' :
    type.color === 'verdigris' ? 'border-l-[#2A5D4F]' :
    type.color === 'muted' ? 'border-l-[rgba(245,240,232,0.20)]' :
    'border-l-[#B09B71]';

  return (
    <div className={`glass-card rounded-lg border-l-4 ${colorClass} ${isPast ? 'opacity-60' : ''}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm">{event.title}</h4>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[var(--text-disabled)] mb-2">
              <span>
                {event.all_day ? 'All Day' :
                  `${startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}${endTime ? ' — ' + endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}`}
              </span>
              {event.location && <span>{event.location}</span>}
              {goingCount > 0 && <span>{goingCount} going</span>}
            </div>
            {event.description && (
              <p className="text-xs text-[var(--text-muted)] line-clamp-2">{event.description}</p>
            )}
          </div>

          {event.rsvp_required && !isPast && (
            <div className="flex gap-1 shrink-0">
              {['going', 'maybe', 'not-going'].map(status => (
                <button
                  key={status}
                  onClick={() => rsvp.mutate(status)}
                  disabled={rsvp.isPending}
                  className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                    myRsvp?.status === status
                      ? status === 'going' ? 'bg-[rgba(42,93,79,0.15)] text-[#2A5D4F] border border-[rgba(42,93,79,0.25)]'
                        : status === 'maybe' ? 'bg-[rgba(176,155,113,0.15)] text-[#B09B71] border border-[rgba(176,155,113,0.25)]'
                        : 'bg-[rgba(107,58,58,0.15)] text-[#8B5A5A] border border-[rgba(107,58,58,0.25)]'
                      : 'bg-[rgba(26,26,30,0.50)] text-[var(--text-disabled)] hover:text-[var(--text-body)]'
                  }`}
                >
                  {status === 'going' ? 'Going' : status === 'maybe' ? 'Maybe' : 'Decline'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateEvent({ onClose }: { onClose: () => void }) {
  const { address } = useAccount();
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventType, setEventType] = useState('community');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [rsvpRequired, setRsvpRequired] = useState(false);

  const create = useMutation({
    mutationFn: async () => {
      const start = allDay ? `${date}T00:00:00` : `${date}T${startTime}:00`;
      const end = allDay ? `${date}T23:59:59` : endTime ? `${date}T${endTime}:00` : null;
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, location, event_type: eventType, start_time: start, end_time: end, all_day: allDay, created_by: address, rsvp_required: rsvpRequired }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); onClose(); },
  });

  return (
    <div className="glass-card rounded-lg p-6 space-y-5">
      <h2 className="text-lg font-medium">Add Event</h2>

      <div>
        <label className="block text-sm text-[var(--text-muted)] mb-2">Event Type</label>
        <div className="flex gap-2 flex-wrap">
          {EVENT_TYPES.map(t => (
            <button key={t.id} onClick={() => setEventType(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                eventType === t.id ? 'bg-[rgba(176,155,113,0.15)] text-[#B09B71] border border-[rgba(176,155,113,0.30)]' : 'glass-card text-[var(--text-muted)]'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-[var(--text-muted)] mb-2">Title</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Q2 Board Meeting"
          className="w-full px-4 py-3 rounded-lg bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-2">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none" />
        </div>
        {!allDay && (
          <>
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-2">Start Time</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-2">End Time</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none" />
            </div>
          </>
        )}
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} className="rounded border-[rgba(245,240,232,0.08)] bg-[var(--surface-2)]" />
          <span className="text-sm text-[var(--text-muted)]">All day</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={rsvpRequired} onChange={e => setRsvpRequired(e.target.checked)} className="rounded border-[rgba(245,240,232,0.08)] bg-[var(--surface-2)]" />
          <span className="text-sm text-[var(--text-muted)]">RSVP required</span>
        </label>
      </div>

      <div>
        <label className="block text-sm text-[var(--text-muted)] mb-2">Location</label>
        <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Faircroft Clubhouse"
          className="w-full px-4 py-3 rounded-lg bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none" />
      </div>

      <div>
        <label className="block text-sm text-[var(--text-muted)] mb-2">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Event details..." rows={3}
          className="w-full px-4 py-3 rounded-lg bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none resize-none" />
      </div>

      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-3 rounded-lg border border-[rgba(245,240,232,0.08)] text-sm font-medium hover:bg-[rgba(245,240,232,0.04)] transition-colors">Cancel</button>
        <button disabled={!title.trim() || !date || create.isPending} onClick={() => create.mutate()}
          className="flex-1 py-3 rounded-lg bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] disabled:opacity-50 text-sm font-medium transition-all">
          {create.isPending ? 'Creating...' : 'Add Event'}
        </button>
      </div>
    </div>
  );
}
