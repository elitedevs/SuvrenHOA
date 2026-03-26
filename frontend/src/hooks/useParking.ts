'use client';

import { useState, useEffect, useCallback } from 'react';

export type SpotStatus = 'available' | 'assigned' | 'visitor';

export interface ParkingSpot {
  id: number;
  number: number;
  status: SpotStatus;
  assignedTo?: string; // lot number
  assignedName?: string;
  visitorPass?: VisitorPass;
}

export interface VisitorPass {
  id: string;
  spotId: number;
  visitorName: string;
  issuedBy: string; // lot number
  issuedAt: string;
  expiresAt: string;
  licensePlate?: string;
}

const STORAGE_KEY = 'faircroft_parking_v1';
const PASSES_KEY = 'faircroft_visitor_passes_v1';

function defaultSpots(): ParkingSpot[] {
  return Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    number: i + 1,
    status: 'available' as SpotStatus,
  }));
}

export function useParking() {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [passes, setPasses] = useState<VisitorPass[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const passRaw = localStorage.getItem(PASSES_KEY);
    setSpots(raw ? JSON.parse(raw) : defaultSpots());
    setPasses(passRaw ? JSON.parse(passRaw) : []);
    setLoaded(true);
  }, []);

  const save = useCallback((next: ParkingSpot[]) => {
    setSpots(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const savePasses = useCallback((next: VisitorPass[]) => {
    setPasses(next);
    localStorage.setItem(PASSES_KEY, JSON.stringify(next));
  }, []);

  const assignSpot = useCallback((spotId: number, lotNumber: string, name: string) => {
    save(spots.map(s =>
      s.id === spotId ? { ...s, status: 'assigned', assignedTo: lotNumber, assignedName: name } : s
    ));
  }, [spots, save]);

  const releaseSpot = useCallback((spotId: number) => {
    save(spots.map(s =>
      s.id === spotId ? { id: s.id, number: s.number, status: 'available' } : s
    ));
  }, [spots, save]);

  const issueVisitorPass = useCallback((spotId: number, visitorName: string, issuedBy: string, licensePlate?: string, hours = 24) => {
    const pass: VisitorPass = {
      id: `VP-${Date.now()}`,
      spotId,
      visitorName,
      issuedBy,
      licensePlate,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + hours * 3600000).toISOString(),
    };
    const nextPasses = [...passes, pass];
    savePasses(nextPasses);
    save(spots.map(s =>
      s.id === spotId ? { ...s, status: 'visitor', visitorPass: pass } : s
    ));
    return pass;
  }, [spots, passes, save, savePasses]);

  const expirePass = useCallback((passId: string) => {
    const pass = passes.find(p => p.id === passId);
    if (!pass) return;
    savePasses(passes.filter(p => p.id !== passId));
    save(spots.map(s =>
      s.id === pass.spotId ? { id: s.id, number: s.number, status: 'available' } : s
    ));
  }, [spots, passes, save, savePasses]);

  const activePasses = passes.filter(p => new Date(p.expiresAt) > new Date());

  return { spots, passes, activePasses, loaded, assignSpot, releaseSpot, issueVisitorPass, expirePass };
}
