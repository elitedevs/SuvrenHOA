'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Post {
  id: string;
  wallet_address: string;
  lot_number: number | null;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  likes_count: number;
  replies_count: number;
  created_at: string;
}

export function usePosts(category?: string | null) {
  return useQuery<Post[]>({
    queryKey: ['posts', category],
    queryFn: async () => {
      const params = category && category !== 'all' ? `?category=${category}` : '';
      const res = await fetch(`/api/posts${params}`);
      if (!res.ok) throw new Error('Failed to fetch posts');
      return res.json();
    },
    staleTime: 30_000,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (post: { wallet_address: string; lot_number?: number; title: string; content: string; category: string }) => {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
      });
      if (!res.ok) throw new Error('Failed to create post');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
