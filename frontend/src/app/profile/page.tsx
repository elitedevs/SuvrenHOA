'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useProperty } from '@/hooks/useProperty';

export default function ProfilePage() {
  const { isConnected, address } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 mb-4">Sign in to manage your profile</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  return <ProfileForm />;
}

function ProfileForm() {
  const { address } = useAccount();
  const { profile, isLoading } = useProfile();
  const { tokenId, propertyInfo, votes } = useProperty();
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [saved, setSaved] = useState(false);

  // Populate from existing profile
  useEffect(() => {
    if (profile) {
      setName(profile.display_name || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  const handleSave = () => {
    if (!address) return;
    updateProfile.mutate(
      {
        wallet_address: address,
        display_name: name || null,
        lot_number: tokenId,
        email: email || null,
        phone: phone || null,
        bio: bio || null,
      },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        },
      }
    );
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading profile...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">Your Profile</h1>
      <p className="text-sm text-gray-400 mb-8">
        Set your display name so neighbors see a real name instead of a wallet address
      </p>

      {/* Property Info (read-only from chain) */}
      <div className="glass-card rounded-xl p-5 mb-6">
        <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">On-Chain Identity</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-gray-500">Wallet</p>
            <p className="text-xs font-mono">{address?.slice(0, 10)}...{address?.slice(-8)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500">Lot</p>
            <p className="text-xs">{tokenId !== undefined ? `#${tokenId}` : 'No property'}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500">Address</p>
            <p className="text-xs">{propertyInfo?.streetAddress || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500">Voting Power</p>
            <p className="text-xs text-purple-400 font-bold">{votes} vote{votes !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Editable Profile */}
      <div className="glass-card rounded-xl p-6 space-y-5">
        <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Profile Settings</h3>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Display Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="How neighbors will see you (e.g., Rick Morang)"
            className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-sm placeholder-gray-500 focus:border-purple-500/50 focus:outline-none"
          />
          <p className="text-[10px] text-gray-500 mt-1">This replaces your wallet address in community posts and comments</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Email (optional)</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="For notifications"
              className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-sm placeholder-gray-500 focus:border-purple-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Phone (optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="For urgent alerts"
              className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-sm placeholder-gray-500 focus:border-purple-500/50 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Bio (optional)</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="A bit about yourself for the community directory"
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-sm placeholder-gray-500 focus:border-purple-500/50 focus:outline-none resize-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={updateProfile.isPending}
          className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-sm font-medium transition-all"
        >
          {updateProfile.isPending ? '⏳ Saving...' : saved ? '✅ Saved!' : 'Save Profile'}
        </button>
      </div>

      {/* Privacy note */}
      <div className="mt-6 p-4 rounded-xl glass-card">
        <h4 className="text-xs font-medium text-purple-400 mb-1">🔒 Privacy</h4>
        <p className="text-[10px] text-gray-400">
          Your email and phone are never shared publicly. They&apos;re only used for notifications you opt into.
          Your display name and lot number are visible to the community. Your wallet address is always on-chain.
        </p>
      </div>
    </div>
  );
}
