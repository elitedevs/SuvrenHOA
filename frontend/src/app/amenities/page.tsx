'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAmenities, AMENITIES, TimeSlot, Amenity } from '@/hooks/useAmenities';
import { ClipboardList } from 'lucide-react';

function getWeekDates(startOffset = 0): { date: string; label: string; dayName: string }[] {
  const days = [];
  const today = new Date();
  today.setDate(today.getDate() + startOffset);
  // Start from Monday of this week
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push({
      date: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
    });
  }
  return days;
}

export default function AmenitiesPage() {
  const { isConnected, address } = useAccount();
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 mb-4">Sign in to book community amenities</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold"> Amenity Booking</h1>
          <p className="text-sm text-gray-400 mt-1">Reserve community facilities — pool, clubhouse, courts & more</p>
        </div>
        {selectedAmenity && (
          <button
            onClick={() => setSelectedAmenity(null)}
            className="px-4 py-2 rounded-xl border border-gray-700 text-sm font-medium hover:bg-gray-800/50 transition-colors"
          >
            ← All Amenities
          </button>
        )}
      </div>

      {selectedAmenity ? (
        <AmenityBookingView
          amenity={selectedAmenity}
          walletAddress={address}
          weekOffset={weekOffset}
          setWeekOffset={setWeekOffset}
        />
      ) : (
        <AmenityGrid onSelect={setSelectedAmenity} walletAddress={address} />
      )}
    </div>
  );
}

function AmenityGrid({ onSelect, walletAddress }: { onSelect: (a: Amenity) => void; walletAddress?: string }) {
  const { getMyBookings } = useAmenities(walletAddress);
  const myBookings = getMyBookings();

  return (
    <>
      {myBookings.length > 0 && (
        <div className="mb-8 glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#c9a96e] mb-3"> Your Upcoming Bookings</h3>
          <div className="space-y-2">
            {myBookings
              .filter(b => b.date >= new Date().toISOString().split('T')[0])
              .sort((a, b) => a.date.localeCompare(b.date))
              .slice(0, 5)
              .map(b => {
                const amenity = AMENITIES.find(a => a.id === b.amenityId);
                return (
                  <div key={b.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">{amenity?.icon} {amenity?.name}</span>
                    <span className="text-gray-500">{b.date} at {b.slot}</span>
                    <span className="text-xs text-[#c9a96e] truncate max-w-[120px]">{b.purpose}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {AMENITIES.map(amenity => (
          <button
            key={amenity.id}
            onClick={() => onSelect(amenity)}
            className="glass-card rounded-xl hover-lift p-6 text-left transition-all hover:border-[#c9a96e]/30 border border-transparent group"
          >
            <div className="text-4xl mb-3">{amenity.icon}</div>
            <h3 className="font-semibold text-base mb-1">{amenity.name}</h3>
            <p className="text-xs text-gray-400 mb-3 leading-relaxed">{amenity.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500"> Capacity: {amenity.capacity}</span>
              <span className="text-[10px] text-[#c9a96e] opacity-0 group-hover:opacity-100 transition-opacity">
                Book → 
              </span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

function AmenityBookingView({
  amenity,
  walletAddress,
  weekOffset,
  setWeekOffset,
}: {
  amenity: Amenity;
  walletAddress?: string;
  weekOffset: number;
  setWeekOffset: (n: number) => void;
}) {
  const { isSlotBooked, bookAmenity, getMyBookings, cancelBooking } = useAmenities(walletAddress);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | ''>('');
  const [purpose, setPurpose] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'book' | 'my'>('book');

  const weekDates = getWeekDates(weekOffset * 7);
  const myBookings = getMyBookings().filter(b => b.amenityId === amenity.id);

  const handleBook = () => {
    if (!selectedDate || !selectedSlot || !purpose.trim()) return;
    const ok = bookAmenity(amenity.id, selectedDate, selectedSlot as TimeSlot, purpose.trim());
    if (ok) {
      setSuccess(true);
      setSelectedDate('');
      setSelectedSlot('');
      setPurpose('');
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar / Week View */}
      <div className="lg:col-span-2 space-y-4">
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#c9a96e]">{amenity.icon} {amenity.name}</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
                disabled={weekOffset === 0}
                className="px-2 py-1 rounded text-gray-400 hover:text-white disabled:opacity-30 text-sm"
              >
                ‹
              </button>
              <span className="text-xs text-gray-400">{weekDates[0].label} — {weekDates[6].label}</span>
              <button
                onClick={() => setWeekOffset(weekOffset + 1)}
                className="px-2 py-1 rounded text-gray-400 hover:text-white text-sm"
              >
                ›
              </button>
            </div>
          </div>

          {/* Week header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDates.map(d => (
              <button
                key={d.date}
                onClick={() => { setSelectedDate(d.date); setSelectedSlot(''); }}
                disabled={d.date < today}
                className={`py-2 rounded-lg text-center transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                  selectedDate === d.date
                    ? 'bg-[#c9a96e] text-[#1a1a1a]'
                    : d.date === today
                    ? 'bg-[#c9a96e]/10 border border-[#c9a96e]/30 text-[#c9a96e]'
                    : 'hover:bg-gray-800/50 text-gray-400'
                }`}
              >
                <div className="text-[9px] font-medium">{d.dayName}</div>
                <div className="text-xs font-semibold">{d.label.split(' ')[1]}</div>
              </button>
            ))}
          </div>

          {/* Time slots */}
          {selectedDate ? (
            <div>
              <p className="text-xs text-gray-500 mb-3 mt-4">Available slots for {selectedDate}</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {amenity.slots.map(slot => {
                  const booked = isSlotBooked(amenity.id, selectedDate, slot);
                  const mine = myBookings.some(b => b.date === selectedDate && b.slot === slot);
                  return (
                    <button
                      key={slot}
                      onClick={() => !booked && setSelectedSlot(slot)}
                      disabled={booked}
                      className={`py-2 rounded-lg text-[11px] font-medium transition-all ${
                        mine
                          ? 'bg-[#c9a96e]/20 text-[#c9a96e] border border-[#c9a96e]/30 cursor-not-allowed'
                          : booked
                          ? 'bg-gray-800/30 text-gray-600 cursor-not-allowed line-through'
                          : selectedSlot === slot
                          ? 'bg-[#c9a96e] text-[#1a1a1a]'
                          : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                      }`}
                    >
                      {mine ? '' : booked ? '' : ''}{slot}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-6">Select a date to see available time slots</p>
          )}
        </div>

        {/* Rules */}
        <div className="glass-card rounded-xl p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5"><ClipboardList className="w-3.5 h-3.5 text-[#c9a96e]" /> Rules &amp; Requirements</h4>
          <ul className="space-y-1">
            {amenity.rules.map((rule, i) => (
              <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                <span className="text-[#c9a96e] mt-0.5">•</span>
                {rule}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Booking form */}
      <div className="space-y-4">
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setActiveTab('book')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === 'book' ? 'bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/30' : 'glass-card text-gray-400'}`}
          >
            New Booking
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === 'my' ? 'bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/30' : 'glass-card text-gray-400'}`}
          >
            My Bookings {myBookings.length > 0 && `(${myBookings.length})`}
          </button>
        </div>

        {activeTab === 'book' ? (
          <div className="glass-card rounded-xl p-5 space-y-4">
            {success && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-400">
                 Booking confirmed!
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-400 mb-1">Selected Date</label>
              <p className="text-sm font-medium text-gray-200">
                {selectedDate || <span className="text-gray-500 text-xs">← Pick from calendar</span>}
              </p>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Selected Time</label>
              <p className="text-sm font-medium text-gray-200">
                {selectedSlot || <span className="text-gray-500 text-xs">← Pick a time slot</span>}
              </p>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Purpose / Notes</label>
              <textarea
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                placeholder="e.g., Birthday party, lap swimming, family gathering..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none resize-none"
              />
            </div>

            <button
              onClick={handleBook}
              disabled={!selectedDate || !selectedSlot || !purpose.trim()}
              className="w-full py-3 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] disabled:opacity-50 text-sm font-medium transition-all"
            >
              Confirm Booking
            </button>
          </div>
        ) : (
          <div className="glass-card rounded-xl p-5 space-y-3">
            {myBookings.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No bookings yet</p>
            ) : (
              myBookings
                .sort((a, b) => a.date.localeCompare(b.date))
                .map(b => (
                  <div key={b.id} className="p-3 rounded-lg bg-gray-800/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-200">{b.date} · {b.slot}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${b.status === 'confirmed' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-500'}`}>
                        {b.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">{b.purpose}</p>
                    {b.status === 'confirmed' && b.date >= today && (
                      <button
                        onClick={() => cancelBooking(b.id)}
                        className="text-[10px] text-red-400 hover:text-red-300"
                      >
                        Cancel booking
                      </button>
                    )}
                  </div>
                ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
