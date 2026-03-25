'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { publicClient, CHAIN_ID } from '@/lib/publicClient';
import { getContracts } from '@/config/contracts';
import PropertyNFTAbi from '@/config/abis/PropertyNFT.json';

// ─── Types ──────────────────────────────────────────────────────────────────

export type AlertType = 'emergency' | 'urgent' | 'info';

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;   // ISO
  expiresAt: string | null; // ISO or null = no expiry
  dismissed: string[]; // wallet addresses that dismissed
}

// ─── Storage ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'suvren-hoa-alerts-v1';

function loadAlerts(): Alert[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Alert[];
  } catch {
    return [];
  }
}

function saveAlerts(alerts: Alert[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

// ─── Role check ──────────────────────────────────────────────────────────────

const REGISTRAR_ROLE =
  '0xe2f4eaae4a9751e85a3e4a7b9587827a877f29914755229b07a7a2da98b9b55b' as `0x${string}`;
const DEFAULT_ADMIN_ROLE =
  '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;

export async function checkIsBoardMember(address: `0x${string}`): Promise<boolean> {
  try {
    const contracts = getContracts(CHAIN_ID);
    const [isRegistrar, isAdmin] = await Promise.all([
      publicClient.readContract({
        address: contracts.propertyNFT,
        abi: PropertyNFTAbi,
        functionName: 'hasRole',
        args: [REGISTRAR_ROLE, address],
      }),
      publicClient.readContract({
        address: contracts.propertyNFT,
        abi: PropertyNFTAbi,
        functionName: 'hasRole',
        args: [DEFAULT_ADMIN_ROLE, address],
      }),
    ]);
    return Boolean(isRegistrar) || Boolean(isAdmin);
  } catch {
    return false;
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAlerts() {
  const { address } = useAccount();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isBoardMember, setIsBoardMember] = useState(false);
  const [boardChecked, setBoardChecked] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setAlerts(loadAlerts());
  }, []);

  // Check board role when address changes
  useEffect(() => {
    if (!address) {
      setIsBoardMember(false);
      setBoardChecked(true);
      return;
    }
    setBoardChecked(false);
    checkIsBoardMember(address).then((result) => {
      setIsBoardMember(result);
      setBoardChecked(true);
    });
  }, [address]);

  // ── Derived ──────────────────────────────────────────────────────────────

  const now = new Date().toISOString();

  function isExpired(alert: Alert): boolean {
    return alert.expiresAt !== null && alert.expiresAt <= now;
  }

  function isDismissedByMe(alert: Alert): boolean {
    if (!address) return false;
    return alert.dismissed.includes(address.toLowerCase());
  }

  /** Active = not expired + not dismissed by current user */
  const getActiveAlerts = useCallback((): Alert[] => {
    const current = new Date().toISOString();
    return alerts.filter(
      (a) =>
        (a.expiresAt === null || a.expiresAt > current) &&
        (!address || !a.dismissed.includes(address.toLowerCase()))
    );
  }, [alerts, address]);

  /** History = expired or all past, sorted newest first */
  const getAlertHistory = useCallback((): Alert[] => {
    const current = new Date().toISOString();
    return alerts
      .filter((a) => a.expiresAt !== null && a.expiresAt <= current)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [alerts]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const createAlert = useCallback(
    async (data: {
      type: AlertType;
      title: string;
      description: string;
      expiresInHours: number | null;
    }) => {
      if (!address || !isBoardMember) {
        throw new Error('Board member wallet required');
      }
      const alert: Alert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: data.type,
        title: data.title.trim(),
        description: data.description.trim(),
        createdBy: address.toLowerCase(),
        createdAt: new Date().toISOString(),
        expiresAt:
          data.expiresInHours !== null
            ? new Date(Date.now() + data.expiresInHours * 3_600_000).toISOString()
            : null,
        dismissed: [],
      };
      const updated = [alert, ...alerts];
      setAlerts(updated);
      saveAlerts(updated);
      return alert;
    },
    [address, isBoardMember, alerts]
  );

  const dismissAlert = useCallback(
    (alertId: string) => {
      if (!address) return;
      const updated = alerts.map((a) =>
        a.id === alertId
          ? { ...a, dismissed: [...new Set([...a.dismissed, address.toLowerCase()])] }
          : a
      );
      setAlerts(updated);
      saveAlerts(updated);
    },
    [address, alerts]
  );

  const deleteAlert = useCallback(
    (alertId: string) => {
      if (!isBoardMember) return;
      const updated = alerts.filter((a) => a.id !== alertId);
      setAlerts(updated);
      saveAlerts(updated);
    },
    [isBoardMember, alerts]
  );

  return {
    alerts,
    isBoardMember,
    boardChecked,
    getActiveAlerts,
    getAlertHistory,
    createAlert,
    dismissAlert,
    deleteAlert,
    isExpired,
    isDismissedByMe,
  };
}
