'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';

export function useAuth() {
  const { address: walletAddress, chain } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [address, setAddress] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check existing session on mount
  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        setAddress(data.address);
        setIsAuthenticated(data.isAuthenticated);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  // Auto-link: when a wallet connects for the first time, save it to the user's profile
  useEffect(() => {
    if (!walletAddress || !isAuthenticated) return;

    fetch('/api/profile/link-wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_address: walletAddress }),
    }).catch(() => {
      // Silent — linking is best-effort on connect
    });
  }, [walletAddress, isAuthenticated]);

  const authenticate = useCallback(async () => {
    if (!walletAddress) throw new Error('Wallet not connected');

    // 1. Get nonce
    const nonceRes = await fetch('/api/auth/nonce');
    const { nonce } = await nonceRes.json();

    // 2. Create SIWE message
    const message = new SiweMessage({
      domain: window.location.host,
      address: walletAddress,
      statement: 'Sign in to Faircroft DAO',
      uri: window.location.origin,
      version: '1',
      chainId: chain?.id ?? 84532,
      nonce,
    });
    const messageString = message.prepareMessage();

    // 3. Sign
    const signature = await signMessageAsync({ message: messageString });

    // 4. Verify with backend
    const verifyRes = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: messageString, signature }),
    });

    if (!verifyRes.ok) {
      const err = await verifyRes.json();
      throw new Error(err.error || 'Verification failed');
    }

    const { address: verifiedAddress } = await verifyRes.json();
    setAddress(verifiedAddress);
    setIsAuthenticated(true);
    return verifiedAddress;
  }, [walletAddress, chain, signMessageAsync]);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAddress(null);
    setIsAuthenticated(false);
  }, []);

  return { authenticate, logout, address, isAuthenticated, isLoading };
}
