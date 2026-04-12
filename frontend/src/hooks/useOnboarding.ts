'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useProperty } from '@/hooks/useProperty';

export interface PetEntry {
  id: string;
  name: string;
  type: "dog" | "cat" | "other";
  breed: string;
  weight: string;
}

export interface VehicleEntry {
  id: string;
  make: string;
  model: string;
  year: string;
  color: string;
  plate: string;
}

export interface OnboardingProfile {
  displayName: string;
  email: string;
  phone: string;
  messagingOptIn: boolean;
}

export interface OnboardingData {
  profile: OnboardingProfile;
  pets: PetEntry[];
  vehicles: VehicleEntry[];
  ccrAcknowledged: boolean;
  completedAt: string | null;
}

const DEFAULT_DATA: OnboardingData = {
  profile: { displayName: "", email: "", phone: "", messagingOptIn: false },
  pets: [],
  vehicles: [],
  ccrAcknowledged: false,
  completedAt: null,
};

function storageKey(address: string) {
  return `suvren_onboarding_${address.toLowerCase()}`;
}

export function useOnboarding() {
  const { address } = useAccount();
  const { tokenId } = useProperty();
  const [data, setData] = useState<OnboardingData>(DEFAULT_DATA);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!address) {
      setData(DEFAULT_DATA);
      setLoaded(false);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey(address));
      if (raw) {
        setData({ ...DEFAULT_DATA, ...JSON.parse(raw) });
      } else {
        setData(DEFAULT_DATA);
      }
    } catch {
      setData(DEFAULT_DATA);
    }
    setLoaded(true);
  }, [address]);

  const save = useCallback(
    (updates: Partial<OnboardingData>) => {
      if (!address) return;
      setData((prev) => {
        const next = { ...prev, ...updates };
        try {
          localStorage.setItem(storageKey(address), JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [address]
  );

  const complete = useCallback(async () => {
    if (!address) return;

    // Sync pets to Supabase
    for (const pet of data.pets) {
      if (!pet.name) continue;
      try {
        await fetch('/api/pets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet_address: address.toLowerCase(),
            lot_number: tokenId ? Number(tokenId) : null,
            name: pet.name,
            species: pet.type || 'other',
            breed: pet.breed || null,
            color: null,
            weight: pet.weight || null,
            age: null,
            vaccinated: false,
            microchipped: false,
          }),
        });
      } catch (e) {
        // Sync failure is non-blocking
      }
    }

    // Sync vehicles to Supabase
    for (const v of data.vehicles) {
      if (!v.make) continue;
      try {
        await fetch('/api/vehicles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet_address: address.toLowerCase(),
            lot_number: tokenId ? Number(tokenId) : null,
            make: v.make,
            model: v.model || null,
            year: v.year ? parseInt(v.year) : null,
            color: v.color || null,
            license_plate: v.plate || null,
          }),
        });
      } catch (e) {
        // Sync failure is non-blocking
      }
    }

    save({ completedAt: new Date().toISOString() });
  }, [save, data.pets, data.vehicles, address, tokenId]);

  const reset = useCallback(() => {
    if (!address) return;
    localStorage.removeItem(storageKey(address));
    setData(DEFAULT_DATA);
  }, [address]);

  const isCompleted = !!data.completedAt;

  return { data, save, complete, reset, isCompleted, loaded, address };
}
