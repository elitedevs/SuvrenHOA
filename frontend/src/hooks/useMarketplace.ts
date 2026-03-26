'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useProperty } from '@/hooks/useProperty';

export type MarketplaceCategory = 'Furniture' | 'Electronics' | 'Garden' | 'Kids' | 'Other';
export type MarketplaceType = 'sale' | 'free' | 'wanted';

export interface MarketplaceListing {
  id: string;
  type: MarketplaceType;
  title: string;
  description: string;
  price: number | null; // null = free or wanted
  category: MarketplaceCategory;
  lotNumber: number | null;
  postedBy: string; // wallet address
  postedAt: string;
  active: boolean;
}

const LS_KEY = 'suvren_marketplace_listings';

function loadListings(): MarketplaceListing[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch { return []; }
}

function saveListings(listings: MarketplaceListing[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(listings));
}

export function useMarketplace() {
  const { address } = useAccount();
  const { tokenId } = useProperty();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);

  useEffect(() => {
    setListings(loadListings());
  }, []);

  const addListing = useCallback((input: Omit<MarketplaceListing, 'id' | 'postedBy' | 'postedAt' | 'active' | 'lotNumber'>) => {
    if (!address) return;
    const next: MarketplaceListing = {
      ...input,
      id: `ml_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      postedBy: address,
      lotNumber: tokenId ? Number(tokenId) : null,
      postedAt: new Date().toISOString(),
      active: true,
    };
    const updated = [next, ...loadListings()];
    saveListings(updated);
    setListings(updated);
  }, [address, tokenId]);

  const removeListing = useCallback((id: string) => {
    const updated = loadListings().map(l => l.id === id ? { ...l, active: false } : l);
    saveListings(updated);
    setListings(updated);
  }, []);

  const activeListings = listings.filter(l => l.active);

  return { listings: activeListings, addListing, removeListing, address };
}
