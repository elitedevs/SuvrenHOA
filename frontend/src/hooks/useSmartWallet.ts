'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, usePublicClient } from 'wagmi';

export type WalletType = 'smart' | 'eoa' | 'none';

export function useSmartWallet() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [walletType, setWalletType] = useState<WalletType>('none');
  const [isLoading, setIsLoading] = useState(false);

  // Detect if connected wallet is a smart contract (ERC-4337) or EOA
  useEffect(() => {
    if (!address || !isConnected || !publicClient) {
      setWalletType('none');
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    publicClient
      .getCode({ address })
      .then((code) => {
        if (cancelled) return;
        // If code exists at the address, it's a smart contract wallet
        const isContract = !!code && code !== '0x';
        setWalletType(isContract ? 'smart' : 'eoa');
      })
      .catch(() => {
        if (!cancelled) setWalletType('eoa'); // default to EOA on error
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [address, isConnected, publicClient]);

  const isSmartWallet = walletType === 'smart';

  /**
   * Placeholder for adding an external signer (Ledger/MetaMask) to a smart wallet.
   * In production, this calls the smart wallet's addOwner function.
   */
  const addExternalSigner = useCallback(
    async (signerAddress: `0x${string}`) => {
      if (!isSmartWallet) {
        throw new Error('Only smart wallets support adding external signers');
      }
      // This would call the CoinbaseSmartWallet.addOwnerAddress(signerAddress)
      // via a user operation. For now, return the intent — the actual contract
      // call requires the smart wallet's ABI and a writeContract call.
      return signerAddress;
    },
    [isSmartWallet]
  );

  return {
    walletType,
    isSmartWallet,
    isLoading,
    addExternalSigner,
  };
}
