'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  Car, Plus, MapPin, Clock, Users, Calendar, User, X, ChevronRight, Repeat,
} from 'lucide-react';

interface CarpoolRoute {
  id: string;
  name: string;
  destination: string;
  pickupPoints: string[];
  departureTime: string;
  returnTime: string;
  days: string[];
  driverLot: string;
  driverName: string;
  riders: { lot: string; name: string; pickup: string }[];
  maxRiders: number;
  type: 'school' | 'work' | 'errands';
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TYPE_CONFIG = {
  school: { label: 'School Run', color: 'text-[#5A7A9A]', bg: 'bg-[#5A7A9A]/10', border: 'border-blue-400/20' },
  work: { label: 'Work Commute', color: 'text-[#B09B71]', bg: 'bg-[#B09B71]/10', border: 'border-[#B09B71]/20' },
  errands: { label: 'Errands', color: 'text-[#3A7D6F]', bg: 'bg-[#3A7D6F]/10', border: 'border-green-400/20' },
};

const DEMO_ROUTES: CarpoolRoute[] = [
  {
    id: '1',
    name: 'Lincoln Elementary Morning Run',
    destination: 'Lincoln Elementary School',
    pickupPoints: ['Lot 12 (Maple Dr)', 'Lot 34 (Oak Ave)', 'Lot 13 (Main Gate)'],
    departureTime: '07:45',
    returnTime: '15:30',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    driverLot: '34',
    driverName: 'Sarah K.',
    riders: [
      { lot: '12', name: 'Tom R.', pickup: 'Lot 12 (Maple Dr)' },
      { lot: '13', name: 'Amir P.', pickup: 'Lot 13 (Main Gate)' },
    ],
    maxRiders: 4,
    type: 'school',
  },
  {
    id: '2',
    name: 'Downtown Office Express',
    destination: 'Downtown Business District',
    pickupPoints: ['Lot 5 (North Entrance)', 'Lot 20 (Community Center)', 'Lot 88 (South Gate)'],
    departureTime: '08:15',
    returnTime: '17:45',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    driverLot: '20',
    driverName: 'Marcus B.',
    riders: [
      { lot: '5', name: 'Jenny W.', pickup: 'Lot 5 (North Entrance)' },
    ],
    maxRiders: 3,
    type: 'work',
  },
];

function RouteCard({ route, myLot, onJoin, onLeave }: {
  route: CarpoolRoute;
  myLot: string;
  onJoin: (routeId: string, pickup: string) => void;
  onLeave: (routeId: string) => void;
}) {
  const cfg = TYPE_CONFIG[route.type];
  const isMember = route.riders.some((r) => r.lot === myLot) || route.driverLot === myLot;
  const isDriver = route.driverLot === myLot;
  const spots = route.maxRiders - route.riders.length;
  const [showJoin, setShowJoin] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState(route.pickupPoints[0]);

  return (
    <div className={`glass-card rounded-xl border ${cfg.border} overflow-hidden`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${cfg.bg} border ${cfg.border}`}>
              <Car className={`w-5 h-5 ${cfg.color}`} />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">{route.name}</h3>
              <p className="text-xs text-[rgba(245,240,232,0.50)] mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {route.destination}
              </p>
            </div>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
            {cfg.label}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <p className="text-[10px] text-[rgba(245,240,232,0.35)] uppercase tracking-wider mb-1">Departs</p>
            <p className="text-sm font-semibold text-white flex items-center gap-1"><Clock className="w-3 h-3 text-[rgba(245,240,232,0.35)]" /> {route.departureTime}</p>
          </div>
          <div>
            <p className="text-[10px] text-[rgba(245,240,232,0.35)] uppercase tracking-wider mb-1">Returns</p>
            <p className="text-sm font-semibold text-white flex items-center gap-1"><Clock className="w-3 h-3 text-[rgba(245,240,232,0.35)]" /> {route.returnTime}</p>
          </div>
          <div>
            <p className="text-[10px] text-[rgba(245,240,232,0.35)] uppercase tracking-wider mb-1">Driver</p>
            <p className="text-sm font-semibold text-white">Lot #{route.driverLot}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {DAYS.map((day) => (
            <span
              key={day}
              className={`text-xs px-2 py-0.5 rounded font-medium ${route.days.includes(day) ? `${cfg.bg} ${cfg.color}` : 'bg-white/5 text-[rgba(245,240,232,0.25)]'}`}
            >
              {day}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[rgba(245,240,232,0.35)]" />
            <span className="text-xs text-[rgba(245,240,232,0.50)]">{route.riders.length}/{route.maxRiders} riders</span>
            {spots > 0 && !isDriver && (
              <span className="text-xs text-[#3A7D6F]">{spots} spot{spots > 1 ? 's' : ''} open</span>
            )}
          </div>
          {isDriver && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#B09B71]/15 text-[#B09B71] font-medium">You're driving</span>
          )}
          {isMember && !isDriver && (
            <button onClick={() => onLeave(route.id)} className="text-xs text-[#8B5A5A] hover:underline">Leave route</button>
          )}
          {!isMember && spots > 0 && (
            <button
              onClick={() => setShowJoin(!showJoin)}
              className="text-xs px-3 py-1.5 rounded-lg bg-[#B09B71] hover:bg-[#D4C4A0] text-[#1a1a1a] font-semibold transition-colors"
            >
              Join Route
            </button>
          )}
          {!isMember && spots === 0 && (
            <span className="text-xs text-[rgba(245,240,232,0.35)]">Full</span>
          )}
        </div>

        {showJoin && (
          <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
            <p className="text-xs text-[rgba(245,240,232,0.50)]">Select your pickup point:</p>
            <select
              value={selectedPickup}
              onChange={(e) => setSelectedPickup(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-white/10 text-sm text-white focus:border-[#B09B71]/50 focus:outline-none"
            >
              {route.pickupPoints.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={() => setShowJoin(false)} className="flex-1 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-[rgba(245,240,232,0.50)] hover:text-white transition-colors">Cancel</button>
              <button
                onClick={() => { onJoin(route.id, selectedPickup); setShowJoin(false); }}
                className="flex-1 px-3 py-1.5 rounded-lg bg-[#B09B71] hover:bg-[#D4C4A0] text-[#1a1a1a] text-xs font-semibold transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        )}
      </div>

      {route.riders.length > 0 && (
        <div className="px-4 pb-3">
          <div className="pt-3 border-t border-white/5">
            <p className="text-[10px] text-[rgba(245,240,232,0.35)] uppercase tracking-wider mb-2">Riders</p>
            <div className="flex flex-wrap gap-2">
              {route.riders.map((r) => (
                <span key={r.lot} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-[rgba(245,240,232,0.50)]">
                  Lot #{r.lot} · {r.pickup.split('(')[0].trim()}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CarpoolPage() {
  const { isConnected } = useAccount();
  const [routes, setRoutes] = useState<CarpoolRoute[]>(DEMO_ROUTES);
  const [myLot] = useState('42');
  const [activeDay, setActiveDay] = useState(DAYS[new Date().getDay() === 0 ? 0 : new Date().getDay() - 1] ?? 'Mon');

  useEffect(() => {
    const stored = localStorage.getItem('hoa_carpool_routes');
    if (stored) {
      try { setRoutes(JSON.parse(stored)); } catch {}
    }
  }, []);

  const saveRoutes = (r: CarpoolRoute[]) => {
    setRoutes(r);
    localStorage.setItem('hoa_carpool_routes', JSON.stringify(r));
  };

  const handleJoin = (routeId: string, pickup: string) => {
    saveRoutes(routes.map((r) => r.id === routeId
      ? { ...r, riders: [...r.riders, { lot: myLot, name: 'You', pickup }] }
      : r));
  };

  const handleLeave = (routeId: string) => {
    saveRoutes(routes.map((r) => r.id === routeId
      ? { ...r, riders: r.riders.filter((x) => x.lot !== myLot) }
      : r));
  };

  const filteredRoutes = routes.filter((r) => r.days.includes(activeDay));

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-[rgba(245,240,232,0.50)] mb-4">Sign in to join the carpool network</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Car className="w-7 h-7 text-[#B09B71]" />
            Carpool Scheduler
          </h1>
          <p className="text-sm text-[rgba(245,240,232,0.50)] mt-1">Coordinate rides for school, work, and errands</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Active Routes', value: routes.length, icon: Car, color: 'text-[#B09B71]' },
          { label: 'Total Riders', value: routes.reduce((s, r) => s + r.riders.length, 0), icon: Users, color: 'text-[#5A7A9A]' },
          { label: 'Open Spots', value: routes.reduce((s, r) => s + (r.maxRiders - r.riders.length), 0), icon: User, color: 'text-[#3A7D6F]' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card rounded-xl p-4 text-center">
            <Icon className={`w-5 h-5 ${color} mx-auto mb-2`} />
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-[rgba(245,240,232,0.35)] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Day filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
              activeDay === day
                ? 'bg-[#B09B71] text-[#1a1a1a]'
                : 'glass-card text-[rgba(245,240,232,0.50)] hover:text-white'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredRoutes.length === 0 && (
          <div className="glass-card rounded-xl p-8 text-center">
            <Car className="w-10 h-10 text-[rgba(245,240,232,0.25)] mx-auto mb-3" />
            <p className="text-[rgba(245,240,232,0.50)]">No carpool routes scheduled for {activeDay}</p>
          </div>
        )}
        {filteredRoutes.map((route) => (
          <RouteCard key={route.id} route={route} myLot={myLot} onJoin={handleJoin} onLeave={handleLeave} />
        ))}
      </div>
    </div>
  );
}
