"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";

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
  const [data, setData] = useState<OnboardingData>(DEFAULT_DATA);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage when address changes
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

  const complete = useCallback(() => {
    save({ completedAt: new Date().toISOString() });
  }, [save]);

  const reset = useCallback(() => {
    if (!address) return;
    localStorage.removeItem(storageKey(address));
    setData(DEFAULT_DATA);
  }, [address]);

  const isCompleted = !!data.completedAt;

  return { data, save, complete, reset, isCompleted, loaded, address };
}
