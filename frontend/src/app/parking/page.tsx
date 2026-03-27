'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useParking, ParkingSpot } from '@/hooks/useParking';

export default function ParkingPage() {
  const { isConnected } = useAccount();
  if (!isConnected) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <p className="text-gray-400 mb-4">Sign in to manage parking</p>
      <ConnectButton label="Sign In" />
    </div>
  );
  return <ParkingContent />;
}

function ParkingContent() {
  const { spots, activePasses, loaded, assignSpot, releaseSpot, issueVisitorPass, expirePass } = useParking();
  const [selected, setSelected] = useState<ParkingSpot | null>(null);
  const [tab, setTab] = useState<'map' | 'passes'>('map');
  const [assignForm, setAssignForm] = useState({ lotNumber: '', name: '' });
  const [visitorForm, setVisitorForm] = useState({ name: '', lot: '', plate: '', hours: '24' });
  const [filter, setFilter] = useState<'all' | 'available' | 'assigned' | 'visitor'>('all');

  if (!loaded) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  const filtered = filter === 'all' ? spots : spots.filter(s => s.status === filter);
  const counts = {
    available: spots.filter(s => s.status === 'available').length,
    assigned: spots.filter(s => s.status === 'assigned').length,
    visitor: spots.filter(s => s.status === 'visitor').length,
  };

  const spotColor = (status: string) => {
    if (status === 'available') return 'bg-green-500/20 border-green-500/40 text-green-400 hover:bg-green-500/30';
    if (status === 'assigned') return 'bg-[#c9a96e]/20 border-[#c9a96e]/40 text-[#c9a96e] hover:bg-[#c9a96e]/30';
    return 'bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Parking Management</h1>
          <p className="text-sm text-gray-400 mt-1">50 community parking spots — click to manage</p>
        </div>
        <div className="flex gap-2">
          {(['map', 'passes'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${tab === t ? 'bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/30' : 'glass-card text-gray-400'}`}>
              {t === 'map' ? '🅿️ Spot Map' : `🎫 Passes (${activePasses.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Available', count: counts.available, color: 'text-green-400', dot: 'bg-green-400' },
          { label: 'Assigned', count: counts.assigned, color: 'text-[#c9a96e]', dot: 'bg-[#c9a96e]' },
          { label: 'Visitor', count: counts.visitor, color: 'text-red-400', dot: 'bg-red-400' },
        ].map(({ label, count, color, dot }) => (
          <div key={label} className="glass-card rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
              <span className="text-xs text-gray-400">{label}</span>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{count}</p>
          </div>
        ))}
      </div>

      {tab === 'map' ? (
        <>
          {/* Filter */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {(['all', 'available', 'assigned', 'visitor'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter === f ? 'bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/30' : 'glass-card text-gray-400'}`}>
                {f}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 mb-6">
            {filtered.map(spot => (
              <button key={spot.id} onClick={() => setSelected(selected?.id === spot.id ? null : spot)}
                className={`relative rounded-xl border p-3 text-center transition-all ${spotColor(spot.status)} ${selected?.id === spot.id ? 'ring-2 ring-[#c9a96e]' : ''}`}>
                <p className="text-[11px] font-bold">{spot.number}</p>
                {spot.status === 'assigned' && spot.assignedTo && (
                  <p className="text-[9px] mt-0.5 truncate">#{spot.assignedTo}</p>
                )}
                {spot.status === 'visitor' && <p className="text-[9px] mt-0.5">VIS</p>}
              </button>
            ))}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="glass-card rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Spot #{selected.number}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  selected.status === 'available' ? 'bg-green-500/10 text-green-400' :
                  selected.status === 'assigned' ? 'bg-[#c9a96e]/10 text-[#c9a96e]' :
                  'bg-red-500/10 text-red-400'
                }`}>{selected.status}</span>
              </div>

              {selected.status === 'available' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Lot Number</label>
                      <input value={assignForm.lotNumber} onChange={e => setAssignForm({ ...assignForm, lotNumber: e.target.value })}
                        placeholder="e.g. 42" className="w-full px-3 py-2 rounded-lg bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Resident Name</label>
                      <input value={assignForm.name} onChange={e => setAssignForm({ ...assignForm, name: e.target.value })}
                        placeholder="Full name" className="w-full px-3 py-2 rounded-lg bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      if (assignForm.lotNumber && assignForm.name) {
                        assignSpot(selected.id, assignForm.lotNumber, assignForm.name);
                        setAssignForm({ lotNumber: '', name: '' });
                        setSelected(null);
                      }
                    }} className="flex-1 py-2.5 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] text-sm font-medium transition-all">
                      Assign Spot
                    </button>
                    <button onClick={() => {
                      if (visitorForm.name && visitorForm.lot) {
                        issueVisitorPass(selected.id, visitorForm.name, visitorForm.lot, visitorForm.plate || undefined, parseInt(visitorForm.hours));
                        setVisitorForm({ name: '', lot: '', plate: '', hours: '24' });
                        setSelected(null);
                      }
                    }} className="flex-1 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-medium transition-all">
                      Visitor Pass
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <input value={visitorForm.name} onChange={e => setVisitorForm({...visitorForm, name: e.target.value})} placeholder="Visitor name"
                      className="px-3 py-2 rounded-lg bg-gray-800/80 border border-gray-700 text-xs focus:border-red-400/50 focus:outline-none" />
                    <input value={visitorForm.lot} onChange={e => setVisitorForm({...visitorForm, lot: e.target.value})} placeholder="Host lot#"
                      className="px-3 py-2 rounded-lg bg-gray-800/80 border border-gray-700 text-xs focus:border-red-400/50 focus:outline-none" />
                    <input value={visitorForm.plate} onChange={e => setVisitorForm({...visitorForm, plate: e.target.value})} placeholder="License plate"
                      className="px-3 py-2 rounded-lg bg-gray-800/80 border border-gray-700 text-xs focus:border-red-400/50 focus:outline-none" />
                    <select value={visitorForm.hours} onChange={e => setVisitorForm({...visitorForm, hours: e.target.value})}
                      className="px-3 py-2 rounded-lg bg-gray-800/80 border border-gray-700 text-xs focus:outline-none">
                      <option value="4">4 hrs</option>
                      <option value="8">8 hrs</option>
                      <option value="24">24 hrs</option>
                      <option value="48">48 hrs</option>
                      <option value="72">72 hrs</option>
                    </select>
                  </div>
                </div>
              )}

              {selected.status === 'assigned' && (
                <div>
                  <p className="text-sm text-gray-300 mb-3">
                    Assigned to <span className="text-[#c9a96e] font-medium">{selected.assignedName}</span> (Lot #{selected.assignedTo})
                  </p>
                  <button onClick={() => { releaseSpot(selected.id); setSelected(null); }}
                    className="px-4 py-2 rounded-xl border border-gray-700 text-sm hover:bg-gray-800/50 transition-colors">
                    Release Spot
                  </button>
                </div>
              )}

              {selected.status === 'visitor' && selected.visitorPass && (
                <div>
                  <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10 mb-3">
                    <p className="text-sm text-gray-300">Visitor: <span className="text-red-400 font-medium">{selected.visitorPass.visitorName}</span></p>
                    {selected.visitorPass.licensePlate && <p className="text-xs text-gray-500">Plate: {selected.visitorPass.licensePlate}</p>}
                    <p className="text-xs text-gray-500">Expires: {new Date(selected.visitorPass.expiresAt).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Pass ID: {selected.visitorPass.id}</p>
                  </div>
                  <button onClick={() => { expirePass(selected.visitorPass!.id); setSelected(null); }}
                    className="px-4 py-2 rounded-xl border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-colors">
                    Revoke Pass
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          {activePasses.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <p className="text-4xl mb-3">🎫</p>
              <p className="text-gray-400">No active visitor passes</p>
            </div>
          ) : activePasses.map(pass => {
            const expires = new Date(pass.expiresAt);
            const hoursLeft = Math.max(0, (expires.getTime() - Date.now()) / 3600000);
            return (
              <div key={pass.id} className="glass-card rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-sm">{pass.visitorName}</p>
                  <p className="text-xs text-gray-500">Spot #{pass.spotId} · Hosted by Lot #{pass.issuedBy}</p>
                  {pass.licensePlate && <p className="text-xs text-gray-500">Plate: {pass.licensePlate}</p>}
                  <p className="text-xs text-gray-500">Expires in {hoursLeft.toFixed(1)}h · {pass.id}</p>
                </div>
                <button onClick={() => expirePass(pass.id)}
                  className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-xs hover:bg-red-500/10 transition-colors shrink-0">
                  Revoke
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
