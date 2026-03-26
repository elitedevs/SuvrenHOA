'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProperty } from '@/hooks/useProperty';
import { usePetPlaydates, type PetPlaydate } from '@/hooks/usePetPlaydates';
import { X, Plus, Calendar, MapPin, Users, PawPrint, CheckCircle } from 'lucide-react';

const SPECIES_ICONS: Record<string, string> = { dog: '🐕', cat: '🐱', bird: '🐦', fish: '🐟', reptile: '🦎', other: '🐾' };

const LOCATION_ICONS: Record<string, string> = { Park: '🌳', Yard: '🏡', 'Common Area': '🏛️' };

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ── Playdates Tab ─────────────────────────────────────────────────────────────

function PlaydatesTab() {
  const { upcomingPlaydates, addPlaydate, rsvp, loaded } = usePetPlaydates();
  const [showAdd, setShowAdd] = useState(false);
  const [myName, setMyName] = useState('');
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    location: 'Park' as PetPlaydate['location'],
    description: '',
    petsInvited: '',
    organizer: '',
  });

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.organizer) return;
    addPlaydate({
      date: form.date,
      time: form.time,
      location: form.location,
      description: form.description,
      petsInvited: form.petsInvited.split(',').map(p => p.trim()).filter(Boolean),
      organizer: form.organizer,
    });
    setShowAdd(false);
    setForm({ date: new Date().toISOString().split('T')[0], time: '10:00', location: 'Park', description: '', petsInvited: '', organizer: '' });
  };

  if (!loaded) {
    return <div className="text-center py-12 text-gray-500 animate-pulse">Loading playdates...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-100">🐾 Upcoming Playdates</h2>
          <p className="text-xs text-gray-500 mt-0.5">Schedule hangouts for your furry friends</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] text-sm font-semibold transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Schedule
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="glass-card rounded-2xl p-5 border border-[#c9a96e]/20">
          <h3 className="text-sm font-bold text-gray-200 mb-4">Schedule a Playdate</h3>
          <form onSubmit={handleSchedule} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1 block">Date</label>
                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required
                  className="w-full px-3 py-2 rounded-xl bg-gray-800/80 border border-gray-700 text-sm text-gray-200 focus:border-[#c9a96e]/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1 block">Time</label>
                <input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})}
                  className="w-full px-3 py-2 rounded-xl bg-gray-800/80 border border-gray-700 text-sm text-gray-200 focus:border-[#c9a96e]/50 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 mb-1 block">Location</label>
              <div className="flex gap-2">
                {(['Park', 'Yard', 'Common Area'] as const).map(loc => (
                  <button key={loc} type="button" onClick={() => setForm({...form, location: loc})}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      form.location === loc ? 'bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/30' : 'glass-card text-gray-400 border border-white/[0.04]'
                    }`}>
                    {LOCATION_ICONS[loc]} {loc}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1 block">Your Lot #</label>
                <input value={form.organizer} onChange={e => setForm({...form, organizer: e.target.value})} placeholder="Lot 5" required
                  className="w-full px-3 py-2 rounded-xl bg-gray-800/80 border border-gray-700 text-sm text-gray-200 focus:border-[#c9a96e]/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1 block">Pets Invited (comma-sep)</label>
                <input value={form.petsInvited} onChange={e => setForm({...form, petsInvited: e.target.value})} placeholder="Buddy, Luna"
                  className="w-full px-3 py-2 rounded-xl bg-gray-800/80 border border-gray-700 text-sm text-gray-200 focus:border-[#c9a96e]/50 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 mb-1 block">Description (optional)</label>
              <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Casual morning play session!"
                className="w-full px-3 py-2 rounded-xl bg-gray-800/80 border border-gray-700 text-sm text-gray-200 focus:border-[#c9a96e]/50 focus:outline-none" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowAdd(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-700 text-sm text-gray-400 hover:text-gray-200 cursor-pointer">Cancel</button>
              <button type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] text-sm font-semibold cursor-pointer">Schedule 🐾</button>
            </div>
          </form>
        </div>
      )}

      {/* RSVP name */}
      {upcomingPlaydates.length > 0 && (
        <div className="glass-card rounded-xl p-3 border border-white/[0.04]">
          <label className="text-xs font-semibold text-gray-400 mb-1 block">Your name for RSVPs:</label>
          <input value={myName} onChange={e => setMyName(e.target.value)} placeholder="Lot 5 or your name"
            className="w-full px-3 py-2 rounded-xl bg-gray-800/80 border border-gray-700 text-sm text-gray-200 focus:border-[#c9a96e]/50 focus:outline-none" />
        </div>
      )}

      {/* Playdate Cards */}
      {upcomingPlaydates.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <div className="text-4xl mb-3">🐾</div>
          <p className="text-gray-400 text-sm">No upcoming playdates. Schedule one!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {upcomingPlaydates.map(pd => {
            const yesCount = pd.rsvps.filter(r => r.status === 'yes').length;
            const myRsvp = myName ? pd.rsvps.find(r => r.name === myName)?.status : undefined;

            return (
              <div key={pd.id} className="glass-card rounded-2xl p-5 border border-white/[0.04] hover-lift">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{LOCATION_ICONS[pd.location]}</span>
                      <span className="text-base font-bold text-gray-100">{pd.location}</span>
                    </div>
                    {pd.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{pd.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-[#c9a96e]">{formatDate(pd.date)}</div>
                    <div className="text-xs text-gray-500">{pd.time}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <span>By {pd.organizer}</span>
                  {pd.petsInvited.length > 0 && (
                    <span>🐾 {pd.petsInvited.join(', ')}</span>
                  )}
                  <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-400" /> {yesCount} going</span>
                </div>

                {/* RSVP buttons */}
                <div className="flex gap-2">
                  {(['yes', 'maybe', 'no'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => myName && rsvp(pd.id, myName, status)}
                      disabled={!myName}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer disabled:opacity-40 ${
                        myRsvp === status
                          ? status === 'yes' ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : status === 'maybe' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-white/[0.03] text-gray-500 border-white/[0.06] hover:text-gray-300'
                      }`}
                    >
                      {status === 'yes' ? '✅ Going' : status === 'maybe' ? '🤔 Maybe' : '❌ Can\'t'}
                    </button>
                  ))}
                </div>

                {pd.rsvps.length > 0 && (
                  <div className="mt-2 text-[10px] text-gray-600">
                    RSVPs: {pd.rsvps.map(r => `${r.name} (${r.status})`).join(', ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Pet Registry Tab ─────────────────────────────────────────────────────

export default function PetsPage() {
  const { isConnected, address } = useAccount();
  const [showRegister, setShowRegister] = useState(false);
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'registry' | 'playdates'>('registry');

  const { data: pets, isLoading } = useQuery({
    queryKey: ['pets'],
    queryFn: async () => { const res = await fetch('/api/pets'); return res.ok ? res.json() : []; },
    staleTime: 60_000,
  });

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 mb-4">Sign in to view the pet registry</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  const filtered = filter === 'all' ? (pets || []) : (pets || []).filter((p: any) => p.species === filter);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2"><PawPrint className="w-7 h-7 text-[#c9a96e]" /> Pet Registry</h1>
          <p className="text-sm text-gray-400 mt-1">Register pets and schedule playdates</p>
        </div>
        {activeTab === 'registry' && (
          <button onClick={() => setShowRegister(!showRegister)}
            className="px-5 py-2.5 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] text-sm font-medium transition-all shrink-0 cursor-pointer">
            {showRegister ? '← Back' : '🐾 Register Pet'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('registry')}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'registry'
              ? 'bg-[#c9a96e]/15 text-[#e8d5a3] border border-[#c9a96e]/25'
              : 'glass text-gray-400 border border-white/[0.04] hover:text-gray-200'
          }`}
        >
          🐾 Registry
        </button>
        <button
          onClick={() => setActiveTab('playdates')}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'playdates'
              ? 'bg-[#c9a96e]/15 text-[#e8d5a3] border border-[#c9a96e]/25'
              : 'glass text-gray-400 border border-white/[0.04] hover:text-gray-200'
          }`}
        >
          📅 Playdates
        </button>
      </div>

      {activeTab === 'playdates' ? (
        <PlaydatesTab />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
            {['all', 'dog', 'cat', 'bird', 'fish', 'reptile'].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`glass-card rounded-xl hover-lift p-3 text-center transition-all cursor-pointer ${filter === s ? 'ring-1 ring-[#c9a96e]/30' : ''}`}>
                <p className="text-lg">{s === 'all' ? '🐾' : SPECIES_ICONS[s]}</p>
                <p className="text-[10px] text-gray-500 capitalize">{s === 'all' ? `All (${(pets || []).length})` : `${s === 'fish' ? 'Fish' : s + 's'} (${(pets || []).filter((p: any) => p.species === s).length})`}</p>
              </button>
            ))}
          </div>

          {/* Pet of the Month */}
          {!showRegister && (pets || []).length > 0 && (() => {
            const potm = (pets || [])[0];
            return (
              <div className="glass-card rounded-2xl p-5 mb-6 border border-[#c9a96e]/20 bg-gradient-to-br from-[#c9a96e]/5 to-transparent">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🏆</span>
                  <p className="text-xs font-bold text-[#c9a96e] uppercase tracking-widest">Pet of the Month</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#c9a96e]/10 border border-[#c9a96e]/25 flex items-center justify-center text-3xl shadow-[0_0_16px_rgba(201,169,110,0.2)]">
                    {SPECIES_ICONS[potm.species] || '🐾'}
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-[#e8d5a3]">{potm.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{potm.breed || potm.species} · Lot #{potm.lot_number}</p>
                    <p className="text-[10px] text-[#c9a96e] mt-1">⭐ Community favorite this month</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {showRegister ? (
            <RegisterPet onClose={() => setShowRegister(false)} />
          ) : isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading pets...</div>
          ) : filtered.length === 0 ? (
            <div className="glass-card rounded-xl hover-lift p-12 text-center">
              <p className="text-5xl mb-4">🐾</p>
              <h3 className="text-lg font-medium mb-2">No pets registered yet</h3>
              <p className="text-sm text-gray-400">Register your pets so neighbors know who's who on walks!</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">
                Community Gallery · {filtered.length} pet{filtered.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((pet: any) => (
                  <div key={pet.id} className="glass-card rounded-xl hover-lift p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-[#c9a96e]/8 border border-[#c9a96e]/20 flex items-center justify-center text-2xl">
                        {SPECIES_ICONS[pet.species] || '🐾'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{pet.name}</h3>
                        <p className="text-[10px] text-gray-500 capitalize">{pet.breed || pet.species} · Lot #{pet.lot_number}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      {pet.color && <div><span className="text-gray-500">Color:</span> <span className="text-gray-300">{pet.color}</span></div>}
                      {pet.weight && <div><span className="text-gray-500">Weight:</span> <span className="text-gray-300">{pet.weight}</span></div>}
                      {pet.age && <div><span className="text-gray-500">Age:</span> <span className="text-gray-300">{pet.age}</span></div>}
                    </div>
                    <div className="flex gap-2 mt-3">
                      {pet.vaccinated && <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 flex items-center gap-0.5"><CheckCircle className="w-2.5 h-2.5" /> Vaccinated</span>}
                      {pet.microchipped && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">📍 Microchipped</span>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function RegisterPet({ onClose }: { onClose: () => void }) {
  const { address } = useAccount();
  const { tokenId } = useProperty();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('dog');
  const [breed, setBreed] = useState('');
  const [color, setColor] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [vaccinated, setVaccinated] = useState(false);
  const [microchipped, setMicrochipped] = useState(false);

  const register = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/pets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: address, lot_number: tokenId, name, species, breed, color, weight, age, vaccinated, microchipped }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pets'] }); onClose(); },
  });

  return (
    <div className="glass-card rounded-xl hover-lift p-6 space-y-5">
      <h2 className="text-lg font-semibold">Register Your Pet</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Pet Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Buddy"
            className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Species</label>
          <div className="flex gap-2">
            {Object.entries(SPECIES_ICONS).map(([s, icon]) => (
              <button key={s} onClick={() => setSpecies(s)}
                className={`flex-1 py-2 rounded-xl text-xs transition-all cursor-pointer ${species === s ? 'bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/30' : 'glass-card text-gray-400'}`}>
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div><label className="block text-xs text-gray-400 mb-1">Breed</label>
          <input type="text" value={breed} onChange={e => setBreed(e.target.value)} placeholder="Lab mix"
            className="w-full px-3 py-2 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" /></div>
        <div><label className="block text-xs text-gray-400 mb-1">Color</label>
          <input type="text" value={color} onChange={e => setColor(e.target.value)} placeholder="Golden"
            className="w-full px-3 py-2 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" /></div>
        <div><label className="block text-xs text-gray-400 mb-1">Weight</label>
          <input type="text" value={weight} onChange={e => setWeight(e.target.value)} placeholder="65 lbs"
            className="w-full px-3 py-2 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" /></div>
        <div><label className="block text-xs text-gray-400 mb-1">Age</label>
          <input type="text" value={age} onChange={e => setAge(e.target.value)} placeholder="3 years"
            className="w-full px-3 py-2 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" /></div>
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={vaccinated} onChange={e => setVaccinated(e.target.checked)} className="rounded border-gray-700 bg-gray-800" />
          <span className="text-sm text-gray-400">Vaccinated</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={microchipped} onChange={e => setMicrochipped(e.target.checked)} className="rounded border-gray-700 bg-gray-800" />
          <span className="text-sm text-gray-400">Microchipped</span>
        </label>
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-700 text-sm font-medium hover:bg-gray-800/50 transition-colors cursor-pointer">Cancel</button>
        <button disabled={!name.trim() || register.isPending} onClick={() => register.mutate()}
          className="flex-1 py-3 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] disabled:opacity-50 text-sm font-medium transition-all cursor-pointer">
          {register.isPending ? '⏳ Registering...' : '🐾 Register Pet'}
        </button>
      </div>
    </div>
  );
}
