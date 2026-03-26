'use client';

import { useState, useEffect, useCallback } from 'react';

export interface PetPlaydate {
  id: string;
  date: string; // ISO date string
  time: string; // HH:MM
  location: 'Park' | 'Yard' | 'Common Area';
  description?: string;
  petsInvited: string[]; // pet names
  organizer: string; // lot# or display name
  rsvps: { name: string; status: 'yes' | 'no' | 'maybe' }[];
  createdAt: string;
}

const STORAGE_KEY = 'hoa_pet_playdates';

const SAMPLE_PLAYDATES: PetPlaydate[] = [
  {
    id: 'pd1',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '10:00',
    location: 'Park',
    description: 'Casual morning meetup at the dog park!',
    petsInvited: ['Buddy', 'Max', 'Bella'],
    organizer: 'Lot 12',
    rsvps: [
      { name: 'Lot 5', status: 'yes' },
      { name: 'Lot 8', status: 'maybe' },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pd2',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '16:30',
    location: 'Common Area',
    description: 'Afternoon play session — all breeds welcome',
    petsInvited: ['Luna', 'Charlie', 'Daisy'],
    organizer: 'Lot 3',
    rsvps: [{ name: 'Lot 7', status: 'yes' }],
    createdAt: new Date().toISOString(),
  },
];

export function usePetPlaydates() {
  const [playdates, setPlaydates] = useState<PetPlaydate[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setPlaydates(JSON.parse(raw));
      } else {
        setPlaydates(SAMPLE_PLAYDATES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_PLAYDATES));
      }
    } catch {
      setPlaydates(SAMPLE_PLAYDATES);
    }
    setLoaded(true);
  }, []);

  const save = useCallback((data: PetPlaydate[]) => {
    setPlaydates(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  const addPlaydate = useCallback((playdate: Omit<PetPlaydate, 'id' | 'createdAt' | 'rsvps'>) => {
    const newPd: PetPlaydate = {
      ...playdate,
      id: `pd_${Date.now()}`,
      createdAt: new Date().toISOString(),
      rsvps: [],
    };
    setPlaydates(prev => {
      const updated = [newPd, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    return newPd;
  }, []);

  const rsvp = useCallback((id: string, name: string, status: 'yes' | 'no' | 'maybe') => {
    setPlaydates(prev => {
      const updated = prev.map(pd => {
        if (pd.id !== id) return pd;
        const existingIdx = pd.rsvps.findIndex(r => r.name === name);
        const newRsvps = [...pd.rsvps];
        if (existingIdx >= 0) {
          newRsvps[existingIdx] = { name, status };
        } else {
          newRsvps.push({ name, status });
        }
        return { ...pd, rsvps: newRsvps };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removePlaydate = useCallback((id: string) => {
    setPlaydates(prev => {
      const updated = prev.filter(pd => pd.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const upcomingPlaydates = playdates
    .filter(pd => new Date(pd.date) >= new Date(new Date().toDateString()))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return { playdates, upcomingPlaydates, loaded, addPlaydate, rsvp, removePlaydate };
}
