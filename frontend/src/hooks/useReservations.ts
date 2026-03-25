'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Reservation {
  id: string;
  amenity_id: string;
  wallet_address: string;
  lot_number: number | null;
  date: string;
  time_slot: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes: string | null;
  created_at: string;
}

export function useReservations(amenityId?: string | null) {
  return useQuery<Reservation[]>({
    queryKey: ['reservations', amenityId],
    queryFn: async () => {
      const params = amenityId ? `?amenity=${amenityId}` : '';
      const res = await fetch(`/api/reservations${params}`);
      if (!res.ok) throw new Error('Failed to fetch reservations');
      return res.json();
    },
    staleTime: 30_000,
  });
}

export function useCreateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reservation: {
      amenity_id: string;
      wallet_address: string;
      lot_number?: number;
      date: string;
      time_slot: string;
      notes?: string;
    }) => {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservation),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create reservation');
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}
