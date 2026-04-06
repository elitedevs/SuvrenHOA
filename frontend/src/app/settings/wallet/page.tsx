'use client';

import { useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useSmartWallet } from '@/hooks/useSmartWallet';
import { useAuth } from '@/hooks/useAuth';
import { isPaymasterConfigured } from '@/lib/paymaster';
import {
  Wallet, Shield, Key, ExternalLink, Copy, Check,
  Fingerprint, Plus, Zap,
} from 'lucide-react';

function shortenAddress(addr?: string): string {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="p-1.5 rounded-md transition-colors"
      style={{
        color: copied ? '#2A5D4F' : 'rgba(245,240,232,0.35)',
        background: copied ? 'rgba(42,93,79,0.12)' : 'transparent',
      }}
      title="Copy address"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

export default function WalletSettingsPage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const { walletType, isSmartWallet, isLoading: smartWalletLoading } = useSmartWallet();
  const { isAuthenticated } = useAuth();
  const [addSignerInput, setAddSignerInput] = useState('');
  const [addSignerStatus, setAddSignerStatus] = useState<string | null>(null);

  const hasPaymaster = isPaymasterConfigured();

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-2xl font-semibold mb-2"
          style={{ fontFamily: 'var(--font-heading)', color: '#F5F0E8' }}
        >
          Wallet Settings
        </h1>
        <p style={{ color: 'rgba(245,240,232,0.50)', fontSize: '15px' }}>
          Manage your wallet connection and smart account preferences.
        </p>
      </div>

      {/* Connected Wallet Status */}
      {isConnected && address ? (
        <div className="space-y-6">
          {/* Current Wallet Card */}
          <div
            className="rounded-xl p-6"
            style={{
              background: '#151518',
              border: '1px solid rgba(245,240,232,0.06)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              {isSmartWallet ? (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(42,93,79,0.15)' }}
                >
                  <Shield size={20} style={{ color: '#2A5D4F' }} />
                </div>
              ) : (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(176,155,113,0.12)' }}
                >
                  <Wallet size={20} style={{ color: '#B09B71' }} />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-medium"
                    style={{ color: '#F5F0E8' }}
                  >
                    {smartWalletLoading
                      ? 'Detecting wallet type...'
                      : isSmartWallet
                        ? 'Coinbase Smart Wallet'
                        : 'External Wallet (EOA)'}
                  </span>
                  {isSmartWallet && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: 'rgba(42,93,79,0.15)',
                        color: '#2A5D4F',
                      }}
                    >
                      ERC-4337
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className="text-sm font-mono"
                    style={{ color: 'rgba(245,240,232,0.55)' }}
                  >
                    {shortenAddress(address)}
                  </span>
                  <CopyButton text={address} />
                </div>
              </div>
            </div>

            {/* Smart wallet features */}
            {isSmartWallet && (
              <div
                className="rounded-lg p-4 mt-4 space-y-3"
                style={{
                  background: 'rgba(42,93,79,0.06)',
                  border: '1px solid rgba(42,93,79,0.12)',
                }}
              >
                <div className="flex items-center gap-2">
                  <Fingerprint size={15} style={{ color: '#2A5D4F' }} />
                  <span
                    className="text-sm"
                    style={{ color: 'rgba(245,240,232,0.65)' }}
                  >
                    Passkey authentication enabled
                  </span>
                </div>
                {hasPaymaster && (
                  <div className="flex items-center gap-2">
                    <Zap size={15} style={{ color: '#2A5D4F' }} />
                    <span
                      className="text-sm"
                      style={{ color: 'rgba(245,240,232,0.65)' }}
                    >
                      Gas-free transactions (sponsored)
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* EOA upgrade prompt */}
            {!isSmartWallet && walletType === 'eoa' && (
              <div
                className="rounded-lg p-4 mt-4"
                style={{
                  background: 'rgba(176,155,113,0.06)',
                  border: '1px solid rgba(176,155,113,0.10)',
                }}
              >
                <p
                  className="text-sm mb-3"
                  style={{ color: 'rgba(245,240,232,0.60)' }}
                >
                  Upgrade to a Smart Wallet for passkey sign-in and gas-free
                  transactions. Your current wallet can be added as a backup
                  signer.
                </p>
                <button
                  onClick={() => {
                    disconnect();
                    setTimeout(() => openConnectModal?.(), 300);
                  }}
                  className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  style={{
                    background: '#B09B71',
                    color: '#0C0C0E',
                  }}
                >
                  Create Smart Wallet
                </button>
              </div>
            )}

            <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(245,240,232,0.06)' }}>
              <button
                onClick={() => disconnect()}
                className="text-sm transition-colors"
                style={{ color: '#6B3A3A' }}
              >
                Disconnect Wallet
              </button>
            </div>
          </div>

          {/* Add External Signer (smart wallet only) */}
          {isSmartWallet && (
            <div
              className="rounded-xl p-6"
              style={{
                background: '#151518',
                border: '1px solid rgba(245,240,232,0.06)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Key size={18} style={{ color: '#B09B71' }} />
                <h2
                  className="text-lg font-medium"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    color: '#F5F0E8',
                  }}
                >
                  Backup Signer
                </h2>
              </div>
              <p
                className="text-sm mb-4"
                style={{ color: 'rgba(245,240,232,0.45)' }}
              >
                Add a hardware wallet (Ledger) or browser wallet (MetaMask) as
                a backup signer for your smart account. This gives you recovery
                options if you lose access to your passkey.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="0x... signer address"
                  value={addSignerInput}
                  onChange={(e) => setAddSignerInput(e.target.value)}
                  className="flex-1 rounded-lg px-3 py-2 text-sm font-mono"
                  style={{
                    background: '#0C0C0E',
                    border: '1px solid rgba(245,240,232,0.08)',
                    color: '#F5F0E8',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={async () => {
                    if (!/^0x[0-9a-fA-F]{40}$/.test(addSignerInput)) {
                      setAddSignerStatus('Invalid address');
                      return;
                    }
                    setAddSignerStatus('Adding signer...');
                    try {
                      // In production, this calls addOwnerAddress on the smart wallet contract
                      setAddSignerStatus(
                        'Signer registration will be available after contract deployment'
                      );
                    } catch {
                      setAddSignerStatus('Failed to add signer');
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    background: 'rgba(176,155,113,0.12)',
                    color: '#B09B71',
                  }}
                >
                  <Plus size={14} />
                  Add
                </button>
              </div>
              {addSignerStatus && (
                <p
                  className="text-xs mt-2"
                  style={{ color: 'rgba(245,240,232,0.45)' }}
                >
                  {addSignerStatus}
                </p>
              )}
            </div>
          )}

          {/* Explorer Link */}
          <a
            href={`https://sepolia.basescan.org/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm transition-colors"
            style={{ color: 'rgba(245,240,232,0.40)' }}
          >
            <ExternalLink size={14} />
            View on BaseScan
          </a>
        </div>
      ) : (
        /* Not connected — show creation / connection options */
        <div className="space-y-6">
          {/* Smart Wallet — Primary CTA */}
          <div
            className="rounded-xl p-6"
            style={{
              background: '#151518',
              border: '1px solid rgba(42,93,79,0.15)',
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(42,93,79,0.15)' }}
              >
                <Fingerprint size={20} style={{ color: '#2A5D4F' }} />
              </div>
              <div>
                <h2
                  className="text-lg font-medium"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    color: '#F5F0E8',
                  }}
                >
                  Create Smart Wallet
                </h2>
                <p
                  className="text-xs"
                  style={{ color: 'rgba(245,240,232,0.40)' }}
                >
                  Recommended for new users
                </p>
              </div>
            </div>
            <p
              className="text-sm mb-4"
              style={{ color: 'rgba(245,240,232,0.55)', lineHeight: 1.6 }}
            >
              Create a free wallet in seconds using your fingerprint or Face ID.
              No browser extension needed, no seed phrase to remember. Your
              wallet is secured by your device&apos;s passkey and all
              transaction fees are covered by the community.
            </p>
            <button
              onClick={() => openConnectModal?.()}
              className="w-full py-3 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: 'linear-gradient(135deg, #2A5D4F, #1e4a3d)',
                color: '#F5F0E8',
                border: '1px solid rgba(42,93,79,0.30)',
              }}
            >
              Create with Passkey
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div
              className="flex-1 h-px"
              style={{ background: 'rgba(245,240,232,0.06)' }}
            />
            <span
              className="text-xs"
              style={{ color: 'rgba(245,240,232,0.25)' }}
            >
              OR
            </span>
            <div
              className="flex-1 h-px"
              style={{ background: 'rgba(245,240,232,0.06)' }}
            />
          </div>

          {/* Traditional Wallet — Secondary */}
          <div
            className="rounded-xl p-6"
            style={{
              background: '#151518',
              border: '1px solid rgba(245,240,232,0.06)',
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(176,155,113,0.10)' }}
              >
                <Wallet size={20} style={{ color: '#B09B71' }} />
              </div>
              <div>
                <h2
                  className="text-lg font-medium"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    color: '#F5F0E8',
                  }}
                >
                  Connect Existing Wallet
                </h2>
                <p
                  className="text-xs"
                  style={{ color: 'rgba(245,240,232,0.40)' }}
                >
                  For power users with MetaMask, Ledger, etc.
                </p>
              </div>
            </div>
            <p
              className="text-sm mb-4"
              style={{ color: 'rgba(245,240,232,0.55)', lineHeight: 1.6 }}
            >
              Already have a crypto wallet? Connect MetaMask, Ledger,
              WalletConnect, or any Ethereum wallet. You&apos;ll manage your own
              keys and pay gas fees for on-chain actions.
            </p>
            <button
              onClick={() => openConnectModal?.()}
              className="w-full py-3 rounded-lg text-sm font-medium transition-all"
              style={{
                background: 'transparent',
                color: '#B09B71',
                border: '1px solid rgba(176,155,113,0.25)',
              }}
            >
              Connect Wallet
            </button>
          </div>

          {/* Explanation */}
          <div
            className="rounded-lg p-4"
            style={{ background: 'rgba(245,240,232,0.02)' }}
          >
            <h3
              className="text-sm font-medium mb-2"
              style={{ color: 'rgba(245,240,232,0.55)' }}
            >
              What&apos;s the difference?
            </h3>
            <ul
              className="space-y-2 text-xs"
              style={{ color: 'rgba(245,240,232,0.40)', lineHeight: 1.6 }}
            >
              <li>
                <strong style={{ color: 'rgba(245,240,232,0.55)' }}>
                  Smart Wallet
                </strong>{' '}
                &mdash; Uses your device&apos;s biometrics (fingerprint/Face
                ID). No seed phrase, no extension. Transaction fees are
                sponsored by the community. Best for most residents.
              </li>
              <li>
                <strong style={{ color: 'rgba(245,240,232,0.55)' }}>
                  Existing Wallet
                </strong>{' '}
                &mdash; For crypto-native users who already manage their own
                keys. Supports hardware wallets for maximum security. You pay
                your own gas fees.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
