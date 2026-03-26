'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Incident {
  id: string;
  type: 'crime' | 'maintenance' | 'road-closure' | 'community-event' | 'hazard' | 'noise' | 'other';
  title: string;
  description: string;
  location: string;
  lat: number;
  lng: number;
  date: string;
  status: 'active' | 'resolved';
  reportedBy: string;
  anonymous: boolean;
  createdAt: string;
}

const LS_KEY = 'suvren_incidents';

const SAMPLE_INCIDENTS: Incident[] = [
  {
    id: 'sample-1',
    type: 'maintenance',
    title: 'Street Light Outage',
    description: 'The street light at the corner has been out for two days. Visibility is very low at night.',
    location: '100 Faircroft Dr',
    lat: 35.8410,
    lng: -78.6410,
    date: '2026-03-24',
    status: 'active',
    reportedBy: '0x1234...abcd',
    anonymous: false,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'sample-2',
    type: 'road-closure',
    title: 'Road Work on Faircroft Ln',
    description: 'Utility crew working on water main. Expect delays and plan alternate routes through the neighborhood.',
    location: '200 Faircroft Ln',
    lat: 35.8418,
    lng: -78.6388,
    date: '2026-03-25',
    status: 'active',
    reportedBy: '0xabcd...1234',
    anonymous: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'sample-3',
    type: 'community-event',
    title: 'Spring Block Party',
    description: 'Annual spring block party! BBQ, lawn games, and great neighbors. Kids and pets welcome.',
    location: '300 Faircroft Ct',
    lat: 35.8420,
    lng: -78.6414,
    date: '2026-04-05',
    status: 'active',
    reportedBy: '0xdeaf...beef',
    anonymous: false,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'sample-4',
    type: 'hazard',
    title: 'Downed Tree Branch',
    description: 'Large oak branch fell across the sidewalk after last night\'s storm. Partially blocking the path.',
    location: '106 Faircroft Dr',
    lat: 35.8404,
    lng: -78.6404,
    date: '2026-03-23',
    status: 'active',
    reportedBy: '0x0000',
    anonymous: true,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'sample-5',
    type: 'noise',
    title: 'Late Night Construction',
    description: 'Construction crew operating loud equipment past 10pm on multiple nights this week.',
    location: '204 Faircroft Ln',
    lat: 35.8414,
    lng: -78.6384,
    date: '2026-03-22',
    status: 'resolved',
    reportedBy: '0xcafe...babe',
    anonymous: false,
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'sample-6',
    type: 'crime',
    title: 'Package Theft Reported',
    description: 'Several residents reported packages stolen from porches between 2–4pm. Please secure deliveries and check cameras.',
    location: '302 Faircroft Ct',
    lat: 35.8422,
    lng: -78.6416,
    date: '2026-03-21',
    status: 'active',
    reportedBy: '0x0000',
    anonymous: true,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

function loadIncidents(): Incident[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveIncidents(incidents: Incident[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_KEY, JSON.stringify(incidents));
}

export function useIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = loadIncidents();
    setIncidents(stored.length > 0 ? stored : SAMPLE_INCIDENTS);
    setLoading(false);
  }, []);

  const addIncident = useCallback((data: Omit<Incident, 'id' | 'createdAt' | 'status'>) => {
    const incident: Incident = {
      ...data,
      id: crypto.randomUUID(),
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    setIncidents((prev) => {
      const updated = [incident, ...prev];
      saveIncidents(updated);
      return updated;
    });
    return incident;
  }, []);

  const resolveIncident = useCallback((id: string) => {
    setIncidents((prev) => {
      const updated = prev.map((i) =>
        i.id === id ? { ...i, status: 'resolved' as const } : i
      );
      saveIncidents(updated);
      return updated;
    });
  }, []);

  const removeIncident = useCallback((id: string) => {
    setIncidents((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      saveIncidents(updated);
      return updated;
    });
  }, []);

  return { incidents, loading, addIncident, resolveIncident, removeIncident };
}
