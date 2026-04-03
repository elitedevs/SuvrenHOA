'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

export interface Profile {
  wallet_address: string;
  display_name: string | null;
  lot_number: number | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
  theme: string;
}

export function useProfile() {
  const { address } = useAccount();

  const { data, isLoading, error } = useQuery<Profile | null>({
    queryKey: ['profile', address],
    queryFn: async () => {
      if (!address) return null;
      const res = await fetch(`/api/profile?wallet=${address}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!address,
    staleTime: 60_000,
  });

  const needsSetup = !!address && !isLoading && (!data?.display_name);

  return {
    profile: data || null,
    isLoading,
    needsSetup,
    displayName: data?.display_name || shortenAddress(address),
    error: error ? (error as Error).message : null,
  };
}

export function useUpdateProfile() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (profile: Partial<Profile> & { wallet_address: string }) => {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

function shortenAddress(address?: string): string {
  if (!address) return 'Unknown';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
