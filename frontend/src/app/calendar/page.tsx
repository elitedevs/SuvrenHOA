'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const EVENT_TYPES = [
  { id: 'community', label: 'Community', icon: '', color: 'gold' },
  { id: 'board-meeting', label: 'Board Meeting', icon: '', color: 'blue' },
  { id: 'committee', label: 'Committee', icon: '', color: 'cyan' },
  { id: 'deadline', label: 'Deadline', icon: '', color: 'red' },
  { id: 'holiday', label: 'Holiday', icon: '', color: 'green' },
  { id: 'social', label: 'Social', icon: '', color: 'amber' },
  { id: 'maintenance', label: 'Maintenance', icon: '', color: 'orange' },
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
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 mb-4">Sign in to view the community calendar</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  // Group events by date
  const eventsByDate: Record<string, any[]> = {};
  (events || []).forEach((e: any) => {
    const date = new Date(e.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    if (!eventsByDate[date]) eventsByDate[date] = [];
    eventsByDate[date].push(e);
  });

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter" data-section="community">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold"> Community Calendar</h1>
          <p className="text-sm text-gray-400 mt-1">
            Events, meetings, deadlines, and community gatherings
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/calendar/meetings"
            className="px-4 py-2.5 rounded-md bg-gray-800/60 border border-gray-700/60 hover:border-[#c9a96e]/30 text-sm font-medium text-gray-400 hover:text-[#e8d5a3] transition-all"
          >
             Board Meetings
          </a>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-5 py-2.5 rounded-md bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] text-sm font-medium transition-all"
          >
            {showCreate ? '← Back' : ' Add Event'}
          </button>
        </div>
      </div>

      {/* Event Type Legend */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {EVENT_TYPES.map(t => (
          <span key={t.id} className="flex items-center gap-1 text-[10px] text-gray-400 whitespace-nowrap px-2 py-1 rounded-lg bg-gray-800/30">
            {t.label}
          </span>
        ))}
      </div>

      {showCreate ? (
        <CreateEvent onClose={() => setShowCreate(false)} />
      ) : isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading events...</div>
      ) : Object.keys(eventsByDate).length === 0 ? (
        <div className="glass-card rounded-md p-12 text-center">
                    <h3 className="text-lg font-medium mb-2">No upcoming events</h3>
          <p className="text-sm text-gray-400">Board meetings, community events, and deadlines will appear here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(eventsByDate).map(([date, dayEvents]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#c9a96e]/80" />
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

  const colorClass = type.color === 'gold' ? 'border-l-[#c9a96e]' :
    type.color === 'blue' ? 'border-l-blue-500' :
    type.color === 'red' ? 'border-l-red-500' :
    type.color === 'green' ? 'border-l-green-500' :
    type.color === 'amber' ? 'border-l-amber-500' :
    type.color === 'orange' ? 'border-l-orange-500' :
    'border-l-cyan-500';

  return (
    <div className={`glass-card rounded-md border-l-4 ${colorClass} ${isPast ? 'opacity-60' : ''}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{type.icon}</span>
              <h4 className="font-semibold text-sm">{event.title}</h4>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-gray-500 mb-2">
              <span>
                {event.all_day ? 'All Day' :
                  `${startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}${endTime ? ' — ' + endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}`}
              </span>
              {event.location && <span> {event.location}</span>}
              {goingCount > 0 && <span> {goingCount} going</span>}
            </div>
            {event.description && (
              <p className="text-xs text-gray-400 line-clamp-2">{event.description}</p>
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
                      ? status === 'going' ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : status === 'maybe' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-gray-800/50 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {status === 'going' ? '' : status === 'maybe' ? '' : ''}
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
    <div className="glass-card rounded-md p-6 space-y-5">
      <h2 className="text-lg font-semibold">Add Event</h2>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Event Type</label>
        <div className="flex gap-2 flex-wrap">
          {EVENT_TYPES.map(t => (
            <button key={t.id} onClick={() => setEventType(t.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                eventType === t.id ? 'bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/30' : 'glass-card text-gray-400'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Title</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Q2 Board Meeting"
          className="w-full px-4 py-3 rounded-md bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full px-4 py-3 rounded-md bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" />
        </div>
        {!allDay && (
          <>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Start Time</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="w-full px-4 py-3 rounded-md bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">End Time</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                className="w-full px-4 py-3 rounded-md bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" />
            </div>
          </>
        )}
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} className="rounded border-gray-700 bg-gray-800" />
          <span className="text-sm text-gray-400">All day</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={rsvpRequired} onChange={e => setRsvpRequired(e.target.checked)} className="rounded border-gray-700 bg-gray-800" />
          <span className="text-sm text-gray-400">RSVP required</span>
        </label>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Location</label>
        <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Faircroft Clubhouse"
          className="w-full px-4 py-3 rounded-md bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Event details..." rows={3}
          className="w-full px-4 py-3 rounded-md bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none resize-none" />
      </div>

      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-3 rounded-md border border-gray-700 text-sm font-medium hover:bg-gray-800/50 transition-colors">Cancel</button>
        <button disabled={!title.trim() || !date || create.isPending} onClick={() => create.mutate()}
          className="flex-1 py-3 rounded-md bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] disabled:opacity-50 text-sm font-medium transition-all">
          {create.isPending ? ' Creating...' : 'Add Event'}
        </button>
      </div>
    </div>
  );
}
