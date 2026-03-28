'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProperty } from '@/hooks/useProperty';

const SPECIES_ICONS: Record<string, string> = { dog: '', cat: '', bird: '', fish: '', reptile: '', other: '' };

export default function PetsPage() {
  const { isConnected, address } = useAccount();
  const [showRegister, setShowRegister] = useState(false);
  const [filter, setFilter] = useState('all');

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
  const myPets = (pets || []).filter((p: any) => p.wallet_address === address?.toLowerCase());

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter" data-section="property">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold"> Pet Registry</h1>
          <p className="text-sm text-gray-400 mt-1">Register your pets and see your neighbors' furry friends</p>
        </div>
        <button onClick={() => setShowRegister(!showRegister)}
          className="px-5 py-2.5 rounded-md bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] text-sm font-medium transition-all shrink-0">
          {showRegister ? '← Back' : ' Register Pet'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
        {['all', 'dog', 'cat', 'bird', 'fish', 'reptile'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`glass-card rounded-md hover-lift p-3 text-center transition-all ${filter === s ? 'ring-1 ring-[#c9a96e]/30' : ''}`}>
            <p className="text-lg">{s === 'all' ? '' : SPECIES_ICONS[s]}</p>
            <p className="text-[10px] text-gray-500 capitalize">{s === 'all' ? `All (${(pets || []).length})` : `${s}s (${(pets || []).filter((p: any) => p.species === s).length})`}</p>
          </button>
        ))}
      </div>

      {/* Pet of the Month highlight */}
      {!showRegister && (pets || []).length > 0 && (() => {
        const potm = (pets || [])[0];
        return (
          <div className="glass-card rounded-lg p-5 mb-6 border border-[#c9a96e]/20 bg-gradient-to-br from-[#c9a96e]/5 to-transparent">
            <div className="flex items-center gap-2 mb-3">
              
              <p className="text-xs font-bold text-[#c9a96e] uppercase tracking-widest">Pet of the Month</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-[#c9a96e]/10 border border-[#c9a96e]/25 flex items-center justify-center text-3xl shadow-[0_0_16px_rgba(201,169,110,0.2)]">
                {SPECIES_ICONS[potm.species] || ''}
              </div>
              <div>
                <p className="text-xl font-normal text-[#e8d5a3]">{potm.name}</p>
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
        <div className="glass-card rounded-md hover-lift p-12 text-center">
                    <h3 style={{ fontFamily: "var(--font-heading), Georgia, serif", fontStyle: "italic", fontSize: "16px", fontWeight: 400, color: "var(--text-secondary)" }}>No pets registered</h3>
          <p className="text-sm text-gray-400">Register your pets so neighbors know who's who on walks!</p>
        </div>
      ) : (
        <>
          <p className="text-[11px] uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
            Community Gallery · {filtered.length} pet{filtered.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((pet: any) => (
            <div key={pet.id} className="glass-card rounded-md hover-lift p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-[#c9a96e]/8 border border-[#c9a96e]/20 flex items-center justify-center text-2xl">
                  {SPECIES_ICONS[pet.species] || ''}
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
                {pet.vaccinated && <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400"> Vaccinated</span>}
                {pet.microchipped && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400"> Microchipped</span>}
              </div>
            </div>
          ))}
        </div>
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
    <div className="glass-card rounded-md hover-lift p-6 space-y-5">
      <h2 className="text-lg font-semibold">Register Your Pet</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Pet Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Buddy"
            className="w-full px-4 py-3 rounded-md bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Species</label>
          <div className="flex gap-2">
            {Object.entries(SPECIES_ICONS).map(([s, icon]) => (
              <button key={s} onClick={() => setSpecies(s)}
                className={`flex-1 py-2 rounded-md text-xs transition-all ${species === s ? 'bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/30' : 'glass-card text-gray-400'}`}>
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div><label className="block text-xs text-gray-400 mb-1">Breed</label>
          <input type="text" value={breed} onChange={e => setBreed(e.target.value)} placeholder="Lab mix"
            className="w-full px-3 py-2 rounded-md bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" /></div>
        <div><label className="block text-xs text-gray-400 mb-1">Color</label>
          <input type="text" value={color} onChange={e => setColor(e.target.value)} placeholder="Golden"
            className="w-full px-3 py-2 rounded-md bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" /></div>
        <div><label className="block text-xs text-gray-400 mb-1">Weight</label>
          <input type="text" value={weight} onChange={e => setWeight(e.target.value)} placeholder="65 lbs"
            className="w-full px-3 py-2 rounded-md bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" /></div>
        <div><label className="block text-xs text-gray-400 mb-1">Age</label>
          <input type="text" value={age} onChange={e => setAge(e.target.value)} placeholder="3 years"
            className="w-full px-3 py-2 rounded-md bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" /></div>
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
        <button onClick={onClose} className="flex-1 py-3 rounded-md border border-gray-700 text-sm font-medium hover:bg-gray-800/50 transition-colors">Cancel</button>
        <button disabled={!name.trim() || register.isPending} onClick={() => register.mutate()}
          className="flex-1 py-3 rounded-md bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] disabled:opacity-50 text-sm font-medium transition-all">
          {register.isPending ? ' Registering...' : ' Register Pet'}
        </button>
      </div>
    </div>
  );
}
