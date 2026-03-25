'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { address } = useAccount();

  const { data, isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications', address],
    queryFn: async () => {
      if (!address) return [];
      const res = await fetch(`/api/notifications?wallet=${address}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!address,
    staleTime: 30_000,
    refetchInterval: 60_000, // Check every minute
  });

  const unreadCount = (data || []).filter(n => !n.read).length;

  return {
    notifications: data || [],
    unreadCount,
    isLoading,
  };
}

export function useMarkRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await fetch(`/api/notifications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notificationId }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
