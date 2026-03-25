'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author_name: string;
  author_role: string;
  priority: 'urgent' | 'important' | 'info';
  read_by: number;
  total_residents: number;
  created_at: string;
}

export function useAnnouncements() {
  return useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: async () => {
      const res = await fetch('/api/announcements');
      if (!res.ok) throw new Error('Failed to fetch announcements');
      return res.json();
    },
    staleTime: 60_000,
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (announcement: { title: string; content: string; author_name: string; author_role?: string; priority?: string }) => {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcement),
      });
      if (!res.ok) throw new Error('Failed to create announcement');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}
