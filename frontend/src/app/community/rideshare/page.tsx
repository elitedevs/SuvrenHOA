'use client';

import { useState, useEffect } from 'react';
import { Car, Plus, X, Users, MessageCircle, RotateCcw, Calendar } from 'lucide-react';

interface Ride {
  id: string;
  driver: string;
  driverLot: string;
  destination: string;
  datetime: string;
  seats: number;
  seatsLeft: number;
  recurring: 'none' | 'daily' | 'weekly';
  notes?: string;
  riders: string[];
}

const MOCK_RIDES: Ride[] = [
  { id: '1', driver: 'Tom M.', driverLot: '12', destination: 'Whole Foods, Boca Raton', datetime: '2026-03-27T08:30', seats: 3, seatsLeft: 2, recurring: 'weekly', notes: 'Every Thursday morning grocery run!', riders: ['Lot 7'] },
  { id: '2', driver: 'Sarah K.', driverLot: '23', destination: 'Town Center Mall', datetime: '2026-03-27T13:00', seats: 4, seatsLeft: 3, recurring: 'none', notes: '', riders: ['Lot 4'] },
  { id: '3', driver: 'Bob W.', driverLot: '31', destination: 'Downtown Fort Lauderdale', datetime: '2026-03-28T09:00', seats: 2, seatsLeft: 2, recurring: 'daily', notes: 'Commuter carpool — leaving sharp at 9', riders: [] },
];

export default function RidesharePage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [msgRide, setMsgRide] = useState<Ride | null>(null);
  const [msgText, setMsgText] = useState('');
  const [form, setForm] = useState({ destination: '', datetime: '', seats: 3, recurring: 'none' as Ride['recurring'], notes: '', driverLot: '' });

  useEffect(() => {
    const stored = localStorage.getItem('hoa-rideshare');
    setRides(stored ? JSON.parse(stored) : MOCK_RIDES);
  }, []);

  const save = (updated: Ride[]) => {
    setRides(updated);
    localStorage.setItem('hoa-rideshare', JSON.stringify(updated));
  };

  const addRide = () => {
    if (!form.destination || !form.datetime || !form.driverLot) return;
    const r: Ride = {
      ...form,
      id: Date.now().toString(),
      driver: `Lot ${form.driverLot} Resident`,
      seatsLeft: form.seats,
      riders: [],
    };
    save([r, ...rides]);
    setShowForm(false);
    setForm({ destination: '', datetime: '', seats: 3, recurring: 'none', notes: '', driverLot: '' });
  };

  const requestSeat = (id: string) => {
    save(rides.map(r => r.id === id && r.seatsLeft > 0
      ? { ...r, seatsLeft: r.seatsLeft - 1, riders: [...r.riders, 'You (Lot 12)'] }
      : r
    ));
  };

  return (
    <div className="min-h-screen bg-[var(--obsidian)] p-6 lg:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-medium text-[#D4C4A0] mb-2 flex items-center gap-3">
              <Car className="w-8 h-8 text-[#B09B71]" /> Community Rideshare
            </h1>
            <p className="text-[oklch(0.50_0.01_60)]">Coordinate rides, reduce traffic, build community</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--brass-deep)] text-[var(--surface-2)] font-medium hover:bg-[#B09B71] transition-colors">
            <Plus className="w-4 h-4" /> Offer a Ride
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-7">
          {[
            { label: 'Available Rides', val: rides.length, color: 'text-[#B09B71]' },
            { label: 'Open Seats', val: rides.reduce((a, r) => a + r.seatsLeft, 0), color: 'text-[#3A7D6F]' },
            { label: 'Recurring Routes', val: rides.filter(r => r.recurring !== 'none').length, color: 'text-[oklch(0.65_0.01_60)]' },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-[#1A1A1E] border border-[oklch(0.18_0.005_60)] rounded-xl p-4 text-center">
              <p className={`text-2xl font-medium ${color}`}>{val}</p>
              <p className="text-xs text-[oklch(0.45_0.01_60)] mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Rides */}
        <div className="space-y-4">
          {rides.map(ride => (
            <div key={ride.id} className="bg-[#1A1A1E] border border-[oklch(0.18_0.005_60)] rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="font-medium text-[#D4C4A0] text-lg">{ride.destination}</h3>
                    {ride.recurring !== 'none' && (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[var(--brass-deep)]/20 text-[#B09B71]">
                        <RotateCcw className="w-3 h-3" /> {ride.recurring}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-[oklch(0.55_0.01_60)]">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{new Date(ride.datetime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{ride.seatsLeft}/{ride.seats} seats left</span>
                    <span className="flex items-center gap-1.5"><Car className="w-3.5 h-3.5" />Driver: {ride.driver}</span>
                  </div>
                  {ride.notes && <p className="text-xs text-[oklch(0.45_0.01_60)] mt-2 italic">"{ride.notes}"</p>}
                  {ride.riders.length > 0 && (
                    <p className="text-xs text-[oklch(0.40_0.01_60)] mt-1">Riders: {ride.riders.join(', ')}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => requestSeat(ride.id)}
                    disabled={ride.seatsLeft === 0 || ride.riders.includes('You (Lot 12)')}
                    className="px-4 py-2 rounded-lg bg-[var(--brass-deep)] text-[var(--surface-2)] font-medium text-sm disabled:opacity-40 hover:bg-[#B09B71] transition-colors"
                  >
                    {ride.riders.includes('You (Lot 12)') ? ' Joined' : ride.seatsLeft === 0 ? 'Full' : 'Request Seat'}
                  </button>
                  <button
                    onClick={() => setMsgRide(ride)}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-[oklch(0.22_0.005_60)] text-[oklch(0.55_0.01_60)] hover:text-[#D4C4A0] text-sm transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Message
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add ride modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[oklch(0.12_0.005_60)] border border-[oklch(0.22_0.005_60)] rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-medium text-[#D4C4A0]">Post a Ride</h3>
              <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-[oklch(0.45_0.01_60)]" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[oklch(0.45_0.01_60)] mb-1">Your Lot # *</label>
                <input value={form.driverLot} onChange={e => setForm({ ...form, driverLot: e.target.value })} placeholder="12" className="w-full bg-[oklch(0.16_0.005_60)] border border-[oklch(0.24_0.005_60)] rounded-lg px-3 py-2 text-sm text-[#D4C4A0] focus:outline-none focus:border-[#B09B71]" />
              </div>
              <div>
                <label className="block text-xs text-[oklch(0.45_0.01_60)] mb-1">Destination *</label>
                <input value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} placeholder="Publix on Congress Ave" className="w-full bg-[oklch(0.16_0.005_60)] border border-[oklch(0.24_0.005_60)] rounded-lg px-3 py-2 text-sm text-[#D4C4A0] focus:outline-none focus:border-[#B09B71]" />
              </div>
              <div>
                <label className="block text-xs text-[oklch(0.45_0.01_60)] mb-1">Date & Time *</label>
                <input type="datetime-local" value={form.datetime} onChange={e => setForm({ ...form, datetime: e.target.value })} className="w-full bg-[oklch(0.16_0.005_60)] border border-[oklch(0.24_0.005_60)] rounded-lg px-3 py-2 text-sm text-[#D4C4A0] focus:outline-none focus:border-[#B09B71]" />
              </div>
              <div>
                <label className="block text-xs text-[oklch(0.45_0.01_60)] mb-1">Available Seats</label>
                <input type="number" min={1} max={7} value={form.seats} onChange={e => setForm({ ...form, seats: Number(e.target.value) })} className="w-full bg-[oklch(0.16_0.005_60)] border border-[oklch(0.24_0.005_60)] rounded-lg px-3 py-2 text-sm text-[#D4C4A0] focus:outline-none focus:border-[#B09B71]" />
              </div>
              <div>
                <label className="block text-xs text-[oklch(0.45_0.01_60)] mb-1">Recurring</label>
                <select value={form.recurring} onChange={e => setForm({ ...form, recurring: e.target.value as Ride['recurring'] })} className="w-full bg-[oklch(0.16_0.005_60)] border border-[oklch(0.24_0.005_60)] rounded-lg px-3 py-2 text-sm text-[#D4C4A0] focus:outline-none focus:border-[#B09B71]">
                  <option value="none">One-time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[oklch(0.45_0.01_60)] mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Details for riders..." className="w-full bg-[oklch(0.16_0.005_60)] border border-[oklch(0.24_0.005_60)] rounded-lg px-3 py-2 text-sm text-[#D4C4A0] focus:outline-none focus:border-[#B09B71] resize-none" />
              </div>
              <button onClick={addRide} disabled={!form.destination || !form.datetime || !form.driverLot} className="w-full py-2.5 rounded-xl bg-[var(--brass-deep)] text-[var(--surface-2)] font-medium disabled:opacity-40 hover:bg-[#B09B71] transition-colors">
                Post Ride
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message driver modal */}
      {msgRide && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[oklch(0.12_0.005_60)] border border-[oklch(0.22_0.005_60)] rounded-xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-[#D4C4A0]">Message {msgRide.driver}</h3>
              <button onClick={() => setMsgRide(null)}><X className="w-4 h-4 text-[oklch(0.45_0.01_60)]" /></button>
            </div>
            <p className="text-xs text-[oklch(0.45_0.01_60)] mb-3">Re: {msgRide.destination}</p>
            <textarea value={msgText} onChange={e => setMsgText(e.target.value)} rows={4} placeholder="Hi! Is there still a spot available?" className="w-full bg-[oklch(0.16_0.005_60)] border border-[oklch(0.24_0.005_60)] rounded-lg px-3 py-2 text-sm text-[#D4C4A0] focus:outline-none focus:border-[#B09B71] resize-none mb-3" />
            <button onClick={() => { alert('Message sent! (Demo mode)'); setMsgRide(null); setMsgText(''); }} className="w-full py-2.5 rounded-xl bg-[var(--brass-deep)] text-[var(--surface-2)] font-medium hover:bg-[#B09B71] transition-colors">
              Send Message
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
