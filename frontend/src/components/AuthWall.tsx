'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Shield } from 'lucide-react';

interface AuthWallProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function AuthWall({ title, description, icon }: AuthWallProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'rgba(176,155,113,0.08)', border: '1px solid rgba(176,155,113,0.15)' }}
      >
        {icon || <Shield className="w-8 h-8 text-[#B09B71]" />}
      </div>
      <h1 className="text-3xl sm:text-4xl font-medium gradient-text mb-3">{title}</h1>
      <p className="text-[var(--text-muted)] text-base max-w-md mb-8 leading-relaxed">
        {description}
      </p>
      <div className="wallet-wrapper">
        <ConnectButton label="Connect Wallet to Continue" />
      </div>
      <p className="text-[11px] text-[var(--text-disabled)] mt-4 max-w-sm">
        Your wallet is your identity. No passwords, no emails — just cryptographic proof of ownership.
      </p>
    </div>
  );
}
