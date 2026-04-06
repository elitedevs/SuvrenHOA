'use client';

import { useState, useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useContracts } from '@/hooks/useContracts';
import { createSupabaseBrowser } from '@/lib/supabase-browser';

export interface PropertyAssignment {
  id: string;
  community_id: string;
  lot_number: number;
  profile_id: string | null;
  wallet_address: string | null;
  nft_token_id: number | null;
  status: 'unassigned' | 'pending_wallet' | 'assigned' | 'minted';
  assigned_by: string | null;
  created_at: string;
  updated_at: string;
  // joined fields
  profile_name?: string | null;
  profile_email?: string | null;
}

export interface CSVRow {
  lot_number: string;
  wallet_address: string;
}

export function usePropertyAdmin(communityId: string | null) {
  const supabase = createSupabaseBrowser();
  const { propertyNFT } = useContracts();
  const { writeContract, data: txHash, isPending: isMinting } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isMinted } = useWaitForTransactionReceipt({ hash: txHash });

  const [assignments, setAssignments] = useState<PropertyAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all assignments for the community
  const fetchAssignments = useCallback(async () => {
    if (!communityId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('property_assignments')
        .select('*')
        .eq('community_id', communityId)
        .order('lot_number', { ascending: true });

      if (err) throw err;
      setAssignments(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  }, [communityId, supabase]);

  // Create a single property assignment
  const assignProperty = useCallback(async (
    lotNumber: number,
    profileId: string | null,
    walletAddress: string | null,
  ) => {
    if (!communityId) return;
    setError(null);

    const status = walletAddress ? 'assigned' : profileId ? 'pending_wallet' : 'unassigned';

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: err } = await supabase
        .from('property_assignments')
        .upsert({
          community_id: communityId,
          lot_number: lotNumber,
          profile_id: profileId,
          wallet_address: walletAddress,
          status,
          assigned_by: user?.id || null,
        }, { onConflict: 'community_id,lot_number' });

      if (err) throw err;
      await fetchAssignments();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to assign property');
      throw e;
    }
  }, [communityId, supabase, fetchAssignments]);

  // Batch import from CSV data
  const batchImport = useCallback(async (rows: CSVRow[]) => {
    if (!communityId) return;
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const records = rows.map(row => ({
        community_id: communityId,
        lot_number: parseInt(row.lot_number, 10),
        wallet_address: row.wallet_address?.trim() || null,
        status: row.wallet_address?.trim() ? 'assigned' : 'unassigned',
        assigned_by: user?.id || null,
      }));

      const { error: err } = await supabase
        .from('property_assignments')
        .upsert(records, { onConflict: 'community_id,lot_number' });

      if (err) throw err;
      await fetchAssignments();
      return records.length;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to batch import');
      throw e;
    }
  }, [communityId, supabase, fetchAssignments]);

  // Mint a property NFT on-chain for an assignment
  const mintProperty = useCallback((
    walletAddress: string,
    lotNumber: number,
    streetAddress: string,
    squareFootage: number,
  ) => {
    writeContract({
      ...propertyNFT,
      functionName: 'mintProperty',
      args: [
        walletAddress as `0x${string}`,
        BigInt(lotNumber),
        streetAddress,
        BigInt(squareFootage),
      ],
    });
  }, [writeContract, propertyNFT]);

  // Update assignment status after successful mint
  const markMinted = useCallback(async (lotNumber: number, tokenId: number) => {
    if (!communityId) return;
    try {
      const { error: err } = await supabase
        .from('property_assignments')
        .update({ status: 'minted', nft_token_id: tokenId })
        .eq('community_id', communityId)
        .eq('lot_number', lotNumber);

      if (err) throw err;
      await fetchAssignments();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update mint status');
    }
  }, [communityId, supabase, fetchAssignments]);

  // Stats
  const stats = {
    total: assignments.length,
    unassigned: assignments.filter(a => a.status === 'unassigned').length,
    pendingWallet: assignments.filter(a => a.status === 'pending_wallet').length,
    assigned: assignments.filter(a => a.status === 'assigned').length,
    minted: assignments.filter(a => a.status === 'minted').length,
  };

  return {
    assignments,
    loading,
    error,
    stats,
    fetchAssignments,
    assignProperty,
    batchImport,
    mintProperty,
    markMinted,
    isMinting,
    isConfirming,
    isMinted,
    txHash,
  };
}
