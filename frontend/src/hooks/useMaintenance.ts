'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface MaintenanceRequest {
  id: string;
  request_number: string;
  wallet_address: string;
  lot_number: number | null;
  title: string;
  description: string;
  category: string;
  location: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'scheduled' | 'resolved' | 'closed';
  assigned_to: string | null;
  estimated_completion: string | null;
  created_at: string;
  updated_at: string;
  hoa_maintenance_updates: { id: string; text: string; updated_by: string; created_at: string }[];
}

export function useMaintenanceRequests(status?: string | null) {
  return useQuery<MaintenanceRequest[]>({
    queryKey: ['maintenance', status],
    queryFn: async () => {
      const params = status && status !== 'all' ? `?status=${status}` : '';
      const res = await fetch(`/api/maintenance${params}`);
      if (!res.ok) throw new Error('Failed to fetch maintenance requests');
      return res.json();
    },
    staleTime: 30_000,
  });
}

export function useCreateMaintenanceRequest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (request: {
      wallet_address: string;
      lot_number?: number;
      title: string;
      description: string;
      category: string;
      location: string;
      priority: string;
    }) => {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!res.ok) throw new Error('Failed to create request');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance'] });
    },
  });
}
