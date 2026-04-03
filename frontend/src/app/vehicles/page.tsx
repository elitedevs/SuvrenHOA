'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProperty } from '@/hooks/useProperty';
import { Car, Truck, Bike, Bus, TicketCheck, Loader2 } from 'lucide-react';

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
        <p className="text-[var(--text-muted)] mb-4">Sign in to manage vehicles</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  const myVehicles = (vehicles || []).filter((v: any) => v.wallet_address === address?.toLowerCase());
  const guestPasses = (vehicles || []).filter((v: any) => v.is_guest);
  const residentVehicles = (vehicles || []).filter((v: any) => !v.is_guest);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-medium gradient-text sm: flex items-center gap-2"><Car className="w-6 h-6 text-[#B09B71]" /> Vehicle Registration</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Register vehicles and issue guest parking passes</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowRegister(!showRegister); setShowGuest(false); }}
            className="px-4 py-2 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] text-sm font-medium transition-all">
            {showRegister ? '← Back' : <span className="flex items-center gap-1.5"><Car className="w-4 h-4" /> Add Vehicle</span>}
          </button>
          <button onClick={() => { setShowGuest(!showGuest); setShowRegister(false); }}
            className="px-4 py-2 rounded-xl border border-[#B09B71]/30 text-[#B09B71] hover:bg-[#B09B71]/8 text-sm font-medium transition-all">
            {showGuest ? '← Back' : <span className="flex items-center gap-1.5"><TicketCheck className="w-4 h-4" /> Guest Pass</span>}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass-card rounded-xl hover-lift p-4 text-center">
          <p className="text-2xl font-medium text-[#B09B71]">{residentVehicles.length}</p>
          <p className="text-[10px] text-[var(--text-disabled)]">Registered Vehicles</p>
        </div>
        <div className="glass-card rounded-xl hover-lift p-4 text-center">
          <p className="text-2xl font-medium text-[#B09B71]">{guestPasses.length}</p>
          <p className="text-[10px] text-[var(--text-disabled)]">Active Guest Passes</p>
        </div>
        <div className="glass-card rounded-xl hover-lift p-4 text-center">
          <p className="text-2xl font-medium text-[var(--steel)]">{myVehicles.length}</p>
          <p className="text-[10px] text-[var(--text-disabled)]">My Vehicles</p>
        </div>
      </div>

      {/* Community Vehicle Overview */}
      {!showRegister && !showGuest && !isLoading && (vehicles || []).length > 0 && (
        <div className="glass-card rounded-xl p-5 mb-5">
          <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-4">Community Vehicle Overview</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { type: 'car', label: 'Cars', icon: <Car className="w-5 h-5 text-[#B09B71]" />, color: 'blue' },
              { type: 'truck', label: 'Trucks', icon: <Truck className="w-5 h-5 text-[#B09B71]" />, color: 'amber' },
              { type: 'motorcycle', label: 'Motorcycles', icon: <Bike className="w-5 h-5 text-[#B09B71]" />, color: 'purple' },
              { type: 'other', label: 'Other', icon: <Bus className="w-5 h-5 text-[#B09B71]" />, color: 'gray' },
            ].map(({ type, label, icon, color }) => {
              const count = residentVehicles.filter((v: any) => (v.vehicle_type || 'car') === type).length;
              return (
                <div key={type} className="rounded-xl bg-[rgba(26,26,30,0.40)] border border-[rgba(245,240,232,0.06)] p-3 text-center">
                  <div className="flex justify-center mb-1">{icon}</div>
                  <p className="text-lg font-medium text-[#B09B71]">{count}</p>
                  <p className="text-[10px] text-[var(--text-disabled)]">{label}</p>
                </div>
              );
            })}
          </div>
          {/* Parking utilization bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] text-[var(--text-muted)]">Parking Utilization</p>
              <p className="text-[11px] text-[#B09B71] font-medium">
                {Math.min(Math.round((residentVehicles.length / Math.max(residentVehicles.length * 1.5, 1)) * 100), 100)}%
              </p>
            </div>
            <div className="h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--brass-deep)] to-[#B09B71] rounded-full transition-all duration-700"
                style={{ width: `${Math.min(Math.round((residentVehicles.length / Math.max(residentVehicles.length * 1.5, 1)) * 100), 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-[var(--text-disabled)] mt-1">{residentVehicles.length} registered of estimated {Math.ceil(residentVehicles.length * 1.5)} capacity</p>
          </div>
        </div>
      )}

      {(showRegister || showGuest) ? (
        <VehicleForm isGuest={showGuest} onClose={() => { setShowRegister(false); setShowGuest(false); }} />
      ) : isLoading ? (
        <div className="text-center py-12 text-[var(--text-disabled)]">Loading vehicles...</div>
      ) : (vehicles || []).length === 0 ? (
        <div className="glass-card rounded-xl hover-lift p-12 text-center">
          <Car className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No vehicles registered</h3>
          <p className="text-sm text-[var(--text-muted)]">Register your vehicles for parking management and security</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(vehicles || []).map((v: any) => (
            <div key={v.id} className={`glass-card rounded-xl hover-lift p-4 flex items-center gap-4 ${v.is_guest ? 'border-l-4 border-l-amber-500' : ''}`}>
              <div className="w-10 h-10 rounded-lg bg-[#B09B71]/8 flex items-center justify-center">
                {v.vehicle_type === 'motorcycle' ? <Bike className="w-5 h-5 text-[#B09B71]" /> : v.vehicle_type === 'truck' ? <Truck className="w-5 h-5 text-[#B09B71]" /> : <Car className="w-5 h-5 text-[#B09B71]" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm">{v.year} {v.make} {v.model}</h4>
                  {v.is_guest && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[rgba(176,155,113,0.10)] text-[#B09B71]">Guest</span>}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-[var(--text-disabled)]">
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
      <h2 className="text-lg font-medium flex items-center gap-2">{isGuest ? <><TicketCheck className="w-5 h-5 text-[#B09B71]" /> Issue Guest Pass</> : <><Car className="w-5 h-5 text-[#B09B71]" /> Register Vehicle</>}</h2>

      {isGuest && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-sm text-[var(--text-muted)] mb-2">Guest Name</label>
            <input type="text" value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="John Smith"
              className="w-full px-4 py-3 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[#B09B71]/50 focus:outline-none" /></div>
          <div><label className="block text-sm text-[var(--text-muted)] mb-2">Valid Until</label>
            <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[#B09B71]/50 focus:outline-none" /></div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div><label className="block text-xs text-[var(--text-muted)] mb-1">Make</label>
          <input type="text" value={make} onChange={e => setMake(e.target.value)} placeholder="Toyota"
            className="w-full px-3 py-2.5 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[#B09B71]/50 focus:outline-none" /></div>
        <div><label className="block text-xs text-[var(--text-muted)] mb-1">Model</label>
          <input type="text" value={model} onChange={e => setModel(e.target.value)} placeholder="Camry"
            className="w-full px-3 py-2.5 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[#B09B71]/50 focus:outline-none" /></div>
        <div><label className="block text-xs text-[var(--text-muted)] mb-1">Year</label>
          <input type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="2024"
            className="w-full px-3 py-2.5 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[#B09B71]/50 focus:outline-none" /></div>
        <div><label className="block text-xs text-[var(--text-muted)] mb-1">Color</label>
          <input type="text" value={color} onChange={e => setColor(e.target.value)} placeholder="Silver"
            className="w-full px-3 py-2.5 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[#B09B71]/50 focus:outline-none" /></div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div><label className="block text-xs text-[var(--text-muted)] mb-1">License Plate</label>
          <input type="text" value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} placeholder="ABC-1234"
            className="w-full px-3 py-2.5 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm font-mono focus:border-[#B09B71]/50 focus:outline-none" /></div>
        <div><label className="block text-xs text-[var(--text-muted)] mb-1">State</label>
          <input type="text" value={state} onChange={e => setState(e.target.value.toUpperCase())} maxLength={2}
            className="w-full px-3 py-2.5 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[#B09B71]/50 focus:outline-none" /></div>
        <div><label className="block text-xs text-[var(--text-muted)] mb-1">Type</label>
          <select value={type} onChange={e => setType(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[#B09B71]/50 focus:outline-none">
            <option value="car">Car</option><option value="truck">Truck</option><option value="suv">SUV</option>
            <option value="van">Van</option><option value="motorcycle">Motorcycle</option><option value="other">Other</option>
          </select></div>
      </div>

      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-[rgba(245,240,232,0.08)] text-sm font-medium hover:bg-[rgba(245,240,232,0.04)] transition-colors">Cancel</button>
        <button disabled={!make || !model || !color || !plate || register.isPending} onClick={() => register.mutate()}
          className="flex-1 py-3 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] disabled:opacity-50 text-sm font-medium transition-all">
          {register.isPending ? <span className="flex items-center gap-1.5"><Loader2 className="w-4 h-4 animate-spin" /> Registering...</span> : isGuest ? <span className="flex items-center gap-1.5"><TicketCheck className="w-4 h-4" /> Issue Pass</span> : <span className="flex items-center gap-1.5"><Car className="w-4 h-4" /> Register</span>}
        </button>
      </div>
    </div>
  );
}
