'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useReservations, useCreateReservation } from '@/hooks/useReservations';
import { useProperty } from '@/hooks/useProperty';

interface Amenity {
  id: string;
  name: string;
  icon: string;
  description: string;
  rules: string[];
  hours: string;
  capacity: number;
  requiresKey: boolean;
  image?: string;
}



const AMENITIES: Amenity[] = [
  {
    id: 'pool', name: 'Community Pool', icon: '', hours: '7am — 9pm (May–Sep)',
    description: 'Olympic-sized pool with lap lanes, shallow end, and splash pad for kids.',
    rules: ['No glass containers', 'Children under 12 must have adult supervision', 'No diving in shallow end', 'Shower before entering'],
    capacity: 50, requiresKey: true,
  },
  {
    id: 'clubhouse', name: 'Clubhouse', icon: '', hours: '8am — 10pm',
    description: 'Indoor event space with kitchen, seating for 80, A/V equipment, and patio access.',
    rules: ['$100 refundable deposit required', 'Clean up after use', 'No amplified music after 9pm', 'Reserve at least 48 hours in advance'],
    capacity: 80, requiresKey: true,
  },
  {
    id: 'tennis', name: 'Tennis Courts', icon: '', hours: '6am — 10pm',
    description: 'Two lighted tennis courts. First come, first served — or reserve a 1-hour slot.',
    rules: ['Proper tennis shoes required', 'Max 1-hour reservation during peak times', 'Turn off lights when done'],
    capacity: 8, requiresKey: false,
  },
  {
    id: 'playground', name: 'Playground', icon: '', hours: 'Dawn — Dusk',
    description: 'Fenced playground with equipment for ages 2-12. Adjacent to the picnic pavilion.',
    rules: ['Children must be supervised', 'No food on equipment', 'Report damaged equipment immediately'],
    capacity: 30, requiresKey: false,
  },
  {
    id: 'pavilion', name: 'Picnic Pavilion', icon: '', hours: '8am — Dusk',
    description: 'Covered pavilion with 4 picnic tables, 2 grills, and power outlets. Great for cookouts.',
    rules: ['Clean grills after use', 'Dispose of charcoal properly', 'Reserve for groups of 10+'],
    capacity: 40, requiresKey: false,
  },
  {
    id: 'lake', name: 'Lake Trail', icon: '', hours: 'Dawn — Dusk',
    description: '1.2 mile walking trail around the community lake. Catch-and-release fishing permitted.',
    rules: ['No swimming', 'Dogs must be leashed', 'Stay on marked trail', 'No motorized boats'],
    capacity: 0, requiresKey: false,
  },
];



export default function ReservationsPage() {
  const { isConnected } = useAccount();
  const [selectedAmenity, setSelectedAmenity] = useState<string | null>(null);
  const [showReserve, setShowReserve] = useState(false);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-[var(--text-muted)] mb-4">Sign in to view amenities and make reservations</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  const { data: reservations } = useReservations(selectedAmenity);
  const selected = AMENITIES.find(a => a.id === selectedAmenity);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-medium gradient-text sm:">Amenities & Reservations</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Community amenities, hours, rules, and booking
          </p>
        </div>
      </div>

      {/* Amenity Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {AMENITIES.map(amenity => (
          <button
            key={amenity.id}
            onClick={() => { setSelectedAmenity(amenity.id); setShowReserve(false); }}
            className={`glass-card rounded-xl p-5 text-left transition-all ${
              selectedAmenity === amenity.id ? 'ring-1 ring-[rgba(176,155,113,0.40)] border-[rgba(176,155,113,0.20)]' : ''
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{amenity.icon}</span>
              <div>
                <h3 className="font-medium text-sm">{amenity.name}</h3>
                <p className="text-[10px] text-[var(--text-disabled)]">{amenity.hours}</p>
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)] line-clamp-2">{amenity.description}</p>
            <div className="flex items-center gap-3 mt-3 text-[10px] text-[var(--text-disabled)]">
              {amenity.capacity > 0 && <span> Cap: {amenity.capacity}</span>}
              {amenity.requiresKey && <span> Key required</span>}
            </div>
          </button>
        ))}
      </div>

      {/* Selected Amenity Detail */}
      {selected && (
        <div className="glass-card rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{selected.icon}</span>
              <div>
                <h2 className="text-xl font-medium">{selected.name}</h2>
                <p className="text-sm text-[var(--text-muted)]">{selected.hours}</p>
              </div>
            </div>
            {selected.id !== 'lake' && selected.id !== 'playground' && (
              <button
                onClick={() => setShowReserve(!showReserve)}
                className="px-5 py-2.5 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] text-sm font-medium transition-all"
              >
                {showReserve ? '← Back' : ' Reserve'}
              </button>
            )}
          </div>

          <p className="text-sm text-[var(--text-muted)] mb-4">{selected.description}</p>

          {showReserve ? (
            <ReserveForm amenity={selected} onClose={() => setShowReserve(false)} />
          ) : (
            <>
              <div className="mb-4">
                <h4 className="text-xs uppercase tracking-wider text-[var(--text-disabled)] font-medium mb-2">Rules</h4>
                <ul className="space-y-1">
                  {selected.rules.map((rule, i) => (
                    <li key={i} className="text-xs text-[var(--text-muted)] flex items-start gap-2">
                      <span className="text-[#B09B71] mt-0.5">•</span>
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Upcoming reservations for this amenity */}
              <div>
                <h4 className="text-xs uppercase tracking-wider text-[var(--text-disabled)] font-medium mb-2">Upcoming Reservations</h4>
                {(reservations || []).filter((r: any) => r.amenity_id === selected.id).length === 0 ? (
                  <p className="text-xs text-[var(--text-disabled)]">No upcoming reservations</p>
                ) : (
                  <div className="space-y-2">
                    {(reservations || []).filter((r: any) => r.amenity_id === selected.id).map(res => (
                      <div key={res.id} className="flex items-center justify-between p-3 rounded-lg bg-[rgba(26,26,30,0.30)]">
                        <div className="text-xs">
                          <span className="font-medium">{res.date}</span>
                          <span className="text-[var(--text-disabled)] ml-2">{res.time_slot}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-[var(--text-disabled)]">Lot #{res.lot_number}</span>
                          <span className={`px-1.5 py-0.5 rounded ${
                            res.status === 'confirmed' ? 'bg-[rgba(42,93,79,0.10)] text-[#3A7D6F]' : 'bg-[rgba(176,155,113,0.10)] text-[#B09B71]'
                          }`}>
                            {res.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ReserveForm({ amenity, onClose }: { amenity: Amenity; onClose: () => void }) {
  const { address } = useAccount();
  const { tokenId } = useProperty();
  const createReservation = useCreateReservation();
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');

  const timeSlots = amenity.id === 'clubhouse'
    ? ['Morning (8am-12pm)', 'Afternoon (12pm-5pm)', 'Evening (5pm-10pm)', 'All Day']
    : ['6am-7am', '7am-8am', '8am-9am', '9am-10am', '10am-11am', '11am-12pm', '12pm-1pm', '1pm-2pm', '2pm-3pm', '3pm-4pm', '4pm-5pm', '5pm-6pm', '6pm-7pm', '7pm-8pm', '8pm-9pm'];

  return (
    <div className="space-y-4 pt-4 border-t border-[rgba(245,240,232,0.05)]">
      <h4 className="font-medium text-sm">Reserve {amenity.name}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-2">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-2">Time Slot</label>
          <select value={timeSlot} onChange={e => setTimeSlot(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none">
            <option value="">Select time</option>
            {timeSlots.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-[rgba(245,240,232,0.08)] text-sm font-medium hover:bg-[rgba(245,240,232,0.04)] transition-colors">Cancel</button>
        <button 
            disabled={!date || !timeSlot || createReservation.isPending}
            onClick={() => {
              if (!address) return;
              createReservation.mutate(
                { amenity_id: amenity.id, wallet_address: address, lot_number: tokenId, date, time_slot: timeSlot },
                { onSuccess: () => onClose() }
              );
            }}
            className="flex-1 py-3 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] disabled:opacity-50 text-sm font-medium transition-all">
            {createReservation.isPending ? ' Booking...' : 'Confirm Reservation'}
          </button>
      </div>
    </div>
  );
}
