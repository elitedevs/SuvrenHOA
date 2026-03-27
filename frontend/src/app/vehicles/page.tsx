'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProperty } from '@/hooks/useProperty';

export default function VehiclesPage() {
  const { isConnected, address } = useAccount();
  const { tokenId } = useProperty();
  const [showRegister, setShowRegister] = useState(false);
  const [showGuest, setShowGuest] = useState(false);

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => { const res = await fetch('/api/vehicles'); return res.ok ? res.json() : []; },
    staleTime: 60_000,
  });

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 mb-4">Sign in to manage vehicles</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  const myVehicles = (vehicles || []).filter((v: any) => v.wallet_address === address?.toLowerCase());
  const guestPasses = (vehicles || []).filter((v: any) => v.is_guest);
  const residentVehicles = (vehicles || []).filter((v: any) => !v.is_guest);

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold"> Vehicle Registration</h1>
          <p className="text-sm text-gray-400 mt-1">Register vehicles and issue guest parking passes</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowRegister(!showRegister); setShowGuest(false); }}
            className="px-4 py-2 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] text-sm font-medium transition-all">
            {showRegister ? '← Back' : ' Add Vehicle'}
          </button>
          <button onClick={() => { setShowGuest(!showGuest); setShowRegister(false); }}
            className="px-4 py-2 rounded-xl border border-[#c9a96e]/30 text-[#c9a96e] hover:bg-[#c9a96e]/8 text-sm font-medium transition-all">
            {showGuest ? '← Back' : ' Guest Pass'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass-card rounded-xl hover-lift p-4 text-center">
          <p className="text-2xl font-bold text-[#c9a96e]">{residentVehicles.length}</p>
          <p className="text-[10px] text-gray-500">Registered Vehicles</p>
        </div>
        <div className="glass-card rounded-xl hover-lift p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{guestPasses.length}</p>
          <p className="text-[10px] text-gray-500">Active Guest Passes</p>
        </div>
        <div className="glass-card rounded-xl hover-lift p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{myVehicles.length}</p>
          <p className="text-[10px] text-gray-500">My Vehicles</p>
        </div>
      </div>

      {/* Community Vehicle Overview */}
      {!showRegister && !showGuest && !isLoading && (vehicles || []).length > 0 && (
        <div className="glass-card rounded-lg p-5 mb-5">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-4">Community Vehicle Overview</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { type: 'car', label: 'Cars', icon: '', color: 'blue' },
              { type: 'truck', label: 'Trucks', icon: '', color: 'amber' },
              { type: 'motorcycle', label: 'Motorcycles', icon: '', color: 'purple' },
              { type: 'other', label: 'Other', icon: '', color: 'gray' },
            ].map(({ type, label, icon, color }) => {
              const count = residentVehicles.filter((v: any) => (v.vehicle_type || 'car') === type).length;
              return (
                <div key={type} className="rounded-xl bg-gray-800/40 border border-gray-700/40 p-3 text-center">
                  <p className="text-xl mb-1">{icon}</p>
                  <p className="text-lg font-bold text-[#c9a96e]">{count}</p>
                  <p className="text-[10px] text-gray-500">{label}</p>
                </div>
              );
            })}
          </div>
          {/* Parking utilization bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] text-gray-400">Parking Utilization</p>
              <p className="text-[11px] text-[#c9a96e] font-semibold">
                {Math.min(Math.round((residentVehicles.length / Math.max(residentVehicles.length * 1.5, 1)) * 100), 100)}%
              </p>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#b8942e] to-[#c9a96e] rounded-full transition-all duration-700"
                style={{ width: `${Math.min(Math.round((residentVehicles.length / Math.max(residentVehicles.length * 1.5, 1)) * 100), 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-600 mt-1">{residentVehicles.length} registered of estimated {Math.ceil(residentVehicles.length * 1.5)} capacity</p>
          </div>
        </div>
      )}

      {(showRegister || showGuest) ? (
        <VehicleForm isGuest={showGuest} onClose={() => { setShowRegister(false); setShowGuest(false); }} />
      ) : isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading vehicles...</div>
      ) : (vehicles || []).length === 0 ? (
        <div className="glass-card rounded-xl hover-lift p-12 text-center">
          <p className="text-5xl mb-4"></p>
          <h3 className="text-lg font-medium mb-2">No vehicles registered</h3>
          <p className="text-sm text-gray-400">Register your vehicles for parking management and security</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(vehicles || []).map((v: any) => (
            <div key={v.id} className={`glass-card rounded-xl hover-lift p-4 flex items-center gap-4 ${v.is_guest ? 'border-l-4 border-l-amber-500' : ''}`}>
              <div className="w-10 h-10 rounded-lg bg-[#c9a96e]/8 flex items-center justify-center text-lg">
                {v.vehicle_type === 'motorcycle' ? '' : v.vehicle_type === 'truck' ? '' : v.vehicle_type === 'suv' ? '' : ''}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm">{v.year} {v.make} {v.model}</h4>
                  {v.is_guest && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">Guest</span>}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-gray-500">
                  <span>{v.color}</span>
                  <span className="font-mono">{v.license_plate} ({v.state})</span>
                  <span>Lot #{v.lot_number}</span>
                  {v.guest_name && <span>Guest: {v.guest_name}</span>}
                  {v.valid_until && <span>Until: {new Date(v.valid_until).toLocaleDateString()}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VehicleForm({ isGuest, onClose }: { isGuest: boolean; onClose: () => void }) {
  const { address } = useAccount();
  const { tokenId } = useProperty();
  const qc = useQueryClient();
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [plate, setPlate] = useState('');
  const [state, setState] = useState('NC');
  const [type, setType] = useState('car');
  const [guestName, setGuestName] = useState('');
  const [validUntil, setValidUntil] = useState('');

  const register = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/vehicles', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: address, lot_number: tokenId, make, model, year: year ? parseInt(year) : null,
          color, license_plate: plate, state, vehicle_type: type,
          is_guest: isGuest, guest_name: isGuest ? guestName : null, valid_until: isGuest ? validUntil : null,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); onClose(); },
  });

  return (
    <div className="glass-card rounded-xl hover-lift p-6 space-y-5">
      <h2 className="text-lg font-semibold">{isGuest ? ' Issue Guest Pass' : ' Register Vehicle'}</h2>

      {isGuest && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-sm text-gray-400 mb-2">Guest Name</label>
            <input type="text" value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="John Smith"
              className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" /></div>
          <div><label className="block text-sm text-gray-400 mb-2">Valid Until</label>
            <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" /></div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div><label className="block text-xs text-gray-400 mb-1">Make</label>
          <input type="text" value={make} onChange={e => setMake(e.target.value)} placeholder="Toyota"
            className="w-full px-3 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" /></div>
        <div><label className="block text-xs text-gray-400 mb-1">Model</label>
          <input type="text" value={model} onChange={e => setModel(e.target.value)} placeholder="Camry"
            className="w-full px-3 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" /></div>
        <div><label className="block text-xs text-gray-400 mb-1">Year</label>
          <input type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="2024"
            className="w-full px-3 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" /></div>
        <div><label className="block text-xs text-gray-400 mb-1">Color</label>
          <input type="text" value={color} onChange={e => setColor(e.target.value)} placeholder="Silver"
            className="w-full px-3 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" /></div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div><label className="block text-xs text-gray-400 mb-1">License Plate</label>
          <input type="text" value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} placeholder="ABC-1234"
            className="w-full px-3 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-sm font-mono focus:border-[#c9a96e]/50 focus:outline-none" /></div>
        <div><label className="block text-xs text-gray-400 mb-1">State</label>
          <input type="text" value={state} onChange={e => setState(e.target.value.toUpperCase())} maxLength={2}
            className="w-full px-3 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" /></div>
        <div><label className="block text-xs text-gray-400 mb-1">Type</label>
          <select value={type} onChange={e => setType(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none">
            <option value="car">Car</option><option value="truck">Truck</option><option value="suv">SUV</option>
            <option value="van">Van</option><option value="motorcycle">Motorcycle</option><option value="other">Other</option>
          </select></div>
      </div>

      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-700 text-sm font-medium hover:bg-gray-800/50 transition-colors">Cancel</button>
        <button disabled={!make || !model || !color || !plate || register.isPending} onClick={() => register.mutate()}
          className="flex-1 py-3 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] disabled:opacity-50 text-sm font-medium transition-all">
          {register.isPending ? ' Registering...' : isGuest ? ' Issue Pass' : ' Register'}
        </button>
      </div>
    </div>
  );
}
