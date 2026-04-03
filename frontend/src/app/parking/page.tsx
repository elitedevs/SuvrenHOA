'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useParking, ParkingSpot } from '@/hooks/useParking';
import { TicketCheck } from 'lucide-react';

export default function ParkingPage() {
  const { isConnected } = useAccount();
  if (!isConnected) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <p className="text-[var(--text-muted)] mb-4">Sign in to manage parking</p>
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

  if (!loaded) return <div className="text-center py-12 text-[var(--text-disabled)]">Loading...</div>;

  const filtered = filter === 'all' ? spots : spots.filter(s => s.status === filter);
  const counts = {
    available: spots.filter(s => s.status === 'available').length,
    assigned: spots.filter(s => s.status === 'assigned').length,
    visitor: spots.filter(s => s.status === 'visitor').length,
  };

  const spotColor = (status: string) => {
    if (status === 'available') return 'bg-[rgba(42,93,79,0.15)] border-[rgba(42,93,79,0.30)] text-[#3A7D6F] hover:bg-[rgba(42,93,79,0.30)]';
    if (status === 'assigned') return 'bg-[#B09B71]/20 border-[#B09B71]/40 text-[#B09B71] hover:bg-[#B09B71]/30';
    return 'bg-[rgba(107,58,58,0.15)] border-[rgba(107,58,58,0.30)] text-[#8B5A5A] hover:bg-[#8B5A5A]/30';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-medium gradient-text sm:">Parking Management</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">50 community parking spots — click to manage</p>
        </div>
        <div className="flex gap-2">
          {(['map', 'passes'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${tab === t ? 'bg-[#B09B71]/15 text-[#B09B71] border border-[#B09B71]/30' : 'glass-card text-[var(--text-muted)]'}`}>
              {t === 'map' ? ' Spot Map' : ` Passes (${activePasses.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Available', count: counts.available, color: 'text-[#3A7D6F]', dot: 'bg-[#3A7D6F]' },
          { label: 'Assigned', count: counts.assigned, color: 'text-[#B09B71]', dot: 'bg-[#B09B71]' },
          { label: 'Visitor', count: counts.visitor, color: 'text-[#8B5A5A]', dot: 'bg-[#8B5A5A]' },
        ].map(({ label, count, color, dot }) => (
          <div key={label} className="glass-card rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
              <span className="text-xs text-[var(--text-muted)]">{label}</span>
            </div>
            <p className={`text-2xl font-medium ${color}`}>{count}</p>
          </div>
        ))}
      </div>

      {tab === 'map' ? (
        <>
          {/* Filter */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {(['all', 'available', 'assigned', 'visitor'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter === f ? 'bg-[#B09B71]/15 text-[#B09B71] border border-[#B09B71]/30' : 'glass-card text-[var(--text-muted)]'}`}>
                {f}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 mb-6">
            {filtered.map(spot => (
              <button key={spot.id} onClick={() => setSelected(selected?.id === spot.id ? null : spot)}
                className={`relative rounded-xl border p-3 text-center transition-all ${spotColor(spot.status)} ${selected?.id === spot.id ? 'ring-2 ring-[#B09B71]' : ''}`}>
                <p className="text-[11px] font-medium">{spot.number}</p>
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
                <h3 className="font-medium">Spot #{selected.number}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  selected.status === 'available' ? 'bg-[rgba(42,93,79,0.10)] text-[#3A7D6F]' :
                  selected.status === 'assigned' ? 'bg-[#B09B71]/10 text-[#B09B71]' :
                  'bg-[rgba(107,58,58,0.10)] text-[#8B5A5A]'
                }`}>{selected.status}</span>
              </div>

              {selected.status === 'available' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">Lot Number</label>
                      <input value={assignForm.lotNumber} onChange={e => setAssignForm({ ...assignForm, lotNumber: e.target.value })}
                        placeholder="e.g. 42" className="w-full px-3 py-2 rounded-lg bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[#B09B71]/50 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">Resident Name</label>
                      <input value={assignForm.name} onChange={e => setAssignForm({ ...assignForm, name: e.target.value })}
                        placeholder="Full name" className="w-full px-3 py-2 rounded-lg bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[#B09B71]/50 focus:outline-none" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      if (assignForm.lotNumber && assignForm.name) {
                        assignSpot(selected.id, assignForm.lotNumber, assignForm.name);
                        setAssignForm({ lotNumber: '', name: '' });
                        setSelected(null);
                      }
                    }} className="flex-1 py-2.5 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] text-sm font-medium transition-all">
                      Assign Spot
                    </button>
                    <button onClick={() => {
                      if (visitorForm.name && visitorForm.lot) {
                        issueVisitorPass(selected.id, visitorForm.name, visitorForm.lot, visitorForm.plate || undefined, parseInt(visitorForm.hours));
                        setVisitorForm({ name: '', lot: '', plate: '', hours: '24' });
                        setSelected(null);
                      }
                    }} className="flex-1 py-2.5 rounded-xl border border-[rgba(107,58,58,0.25)] text-[#8B5A5A] hover:bg-[rgba(107,58,58,0.10)] text-sm font-medium transition-all">
                      Visitor Pass
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <input value={visitorForm.name} onChange={e => setVisitorForm({...visitorForm, name: e.target.value})} placeholder="Visitor name"
                      className="px-3 py-2 rounded-lg bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-xs focus:border-[rgba(139,90,90,0.50)] focus:outline-none" />
                    <input value={visitorForm.lot} onChange={e => setVisitorForm({...visitorForm, lot: e.target.value})} placeholder="Host lot#"
                      className="px-3 py-2 rounded-lg bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-xs focus:border-[rgba(139,90,90,0.50)] focus:outline-none" />
                    <input value={visitorForm.plate} onChange={e => setVisitorForm({...visitorForm, plate: e.target.value})} placeholder="License plate"
                      className="px-3 py-2 rounded-lg bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-xs focus:border-[rgba(139,90,90,0.50)] focus:outline-none" />
                    <select value={visitorForm.hours} onChange={e => setVisitorForm({...visitorForm, hours: e.target.value})}
                      className="px-3 py-2 rounded-lg bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-xs focus:outline-none">
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
                  <p className="text-sm text-[var(--text-body)] mb-3">
                    Assigned to <span className="text-[#B09B71] font-medium">{selected.assignedName}</span> (Lot #{selected.assignedTo})
                  </p>
                  <button onClick={() => { releaseSpot(selected.id); setSelected(null); }}
                    className="px-4 py-2 rounded-xl border border-[rgba(245,240,232,0.08)] text-sm hover:bg-[rgba(245,240,232,0.04)] transition-colors">
                    Release Spot
                  </button>
                </div>
              )}

              {selected.status === 'visitor' && selected.visitorPass && (
                <div>
                  <div className="p-3 rounded-lg bg-[#8B5A5A]/5 border border-[rgba(139,90,90,0.10)] mb-3">
                    <p className="text-sm text-[var(--text-body)]">Visitor: <span className="text-[#8B5A5A] font-medium">{selected.visitorPass.visitorName}</span></p>
                    {selected.visitorPass.licensePlate && <p className="text-xs text-[var(--text-disabled)]">Plate: {selected.visitorPass.licensePlate}</p>}
                    <p className="text-xs text-[var(--text-disabled)]">Expires: {new Date(selected.visitorPass.expiresAt).toLocaleString()}</p>
                    <p className="text-xs text-[var(--text-disabled)]">Pass ID: {selected.visitorPass.id}</p>
                  </div>
                  <button onClick={() => { expirePass(selected.visitorPass!.id); setSelected(null); }}
                    className="px-4 py-2 rounded-xl border border-[rgba(107,58,58,0.25)] text-[#8B5A5A] text-sm hover:bg-[rgba(107,58,58,0.10)] transition-colors">
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
              <TicketCheck className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-3" />
              <p className="text-[var(--text-muted)]">No active visitor passes</p>
            </div>
          ) : activePasses.map(pass => {
            const expires = new Date(pass.expiresAt);
            const hoursLeft = Math.max(0, (expires.getTime() - Date.now()) / 3600000);
            return (
              <div key={pass.id} className="glass-card rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-sm">{pass.visitorName}</p>
                  <p className="text-xs text-[var(--text-disabled)]">Spot #{pass.spotId} · Hosted by Lot #{pass.issuedBy}</p>
                  {pass.licensePlate && <p className="text-xs text-[var(--text-disabled)]">Plate: {pass.licensePlate}</p>}
                  <p className="text-xs text-[var(--text-disabled)]">Expires in {hoursLeft.toFixed(1)}h · {pass.id}</p>
                </div>
                <button onClick={() => expirePass(pass.id)}
                  className="px-3 py-1.5 rounded-lg border border-[rgba(107,58,58,0.25)] text-[#8B5A5A] text-xs hover:bg-[rgba(107,58,58,0.10)] transition-colors shrink-0">
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
