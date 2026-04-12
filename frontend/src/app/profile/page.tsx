'use client';
import { AuthWall } from '@/components/AuthWall';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useProperty } from '@/hooks/useProperty';
import { useBadges } from '@/hooks/useBadges';
import { useDuesStatus } from '@/hooks/useTreasury';
import { X, AlertCircle, Check } from 'lucide-react';

export default function ProfilePage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return <AuthWall title="Your Profile" description="Manage your resident profile, notification preferences, and account settings." />;
  }

  return <ProfileForm />;
}

function ProfileForm() {
  const { address } = useAccount();
  const { profile, isLoading, error: profileError } = useProfile();
  const { tokenId, propertyInfo, votes } = useProperty();
  const updateProfile = useUpdateProfile();
  const { isCurrent } = useDuesStatus(tokenId);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [saved, setSaved] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [nameError, setNameError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [dismissedError, setDismissedError] = useState(false);
  const [dismissedHookError, setDismissedHookError] = useState(false);

  // Badge inputs from localStorage — safe fallback if storage was cleared
  const voteCount = (() => {
    try { return typeof window !== 'undefined' ? parseInt(localStorage.getItem('voteCount') || '0', 10) : 0; }
    catch { return 0; }
  })();
  const messageCount = (() => {
    try { return typeof window !== 'undefined' ? parseInt(localStorage.getItem('messageCount') || '0', 10) : 0; }
    catch { return 0; }
  })();
  const documentCount = (() => {
    try { return typeof window !== 'undefined' ? parseInt(localStorage.getItem('documentCount') || '0', 10) : 0; }
    catch { return 0; }
  })();

  const badges = useBadges({
    tokenId: tokenId ?? undefined,
    duesCurrents: isCurrent,
    voteCount,
    messageCount,
    documentCount,
  });

  useEffect(() => {
    if (profile) {
      setName(profile.display_name || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  const validateEmail = (val: string) => {
    if (!val) return '';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? '' : 'Enter a valid email address';
  };

  const handleSave = () => {
    if (!address) return;
    const nameErr = name.trim() === '' ? 'Display name is required' : '';
    const emailErr = validateEmail(email);
    setNameError(nameErr);
    if (nameErr || emailErr) { setEmailError(emailErr); return; }
    setSaveError('');
    setDismissedError(false);
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
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Failed to save profile. Please try again.';
          setSaveError(msg);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter animate-pulse">
        <div className="h-8 w-40 bg-[rgba(245,240,232,0.08)] rounded mb-2" />
        <div className="h-4 w-64 bg-[rgba(245,240,232,0.06)] rounded mb-8" />
        <div className="glass-card rounded-lg p-5 mb-6">
          <div className="h-3 w-32 bg-[rgba(245,240,232,0.06)] rounded mb-3" />
          <div className="grid grid-cols-2 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i}>
                <div className="h-2 w-16 bg-[rgba(245,240,232,0.05)] rounded mb-1" />
                <div className="h-4 w-32 bg-[rgba(245,240,232,0.08)] rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card rounded-lg p-6 mb-6">
          <div className="h-3 w-40 bg-[rgba(245,240,232,0.06)] rounded mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-16 bg-[rgba(245,240,232,0.06)] rounded-lg" />
            ))}
          </div>
        </div>
        <div className="glass-card rounded-lg p-6">
          <div className="h-3 w-28 bg-[rgba(245,240,232,0.06)] rounded mb-4" />
          <div className="h-12 w-full bg-[rgba(245,240,232,0.06)] rounded-lg mb-4" />
          <div className="h-12 w-full bg-[rgba(245,240,232,0.06)] rounded-lg" />
        </div>
      </div>
    );
  }

  const earnedCount = badges.filter(b => b.earned).length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      {/* Hook error banner */}
      {profileError && !dismissedHookError && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <span className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4 shrink-0" /> {profileError}</span>
          <button onClick={() => setDismissedHookError(true)} className="text-red-400/60 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Save error banner */}
      {saveError && !dismissedError && (
        <div className="flex items-center justify-between gap-3 mb-4 px-4 py-3 rounded-xl bg-[rgba(107,58,58,0.15)] border border-[rgba(139,90,90,0.30)] text-[#8B5A5A] text-sm">
          <span>{saveError}</span>
          <button onClick={() => setDismissedError(true)} className="shrink-0 hover:opacity-70 transition-opacity" aria-label="Dismiss error">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <h1 className="text-3xl sm:text-4xl font-medium gradient-text sm: mb-2">Your Profile</h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">
        Set your display name so neighbors see a real name instead of a wallet address
      </p>

      {/* Property Info (read-only) */}
      <div className="glass-card rounded-lg p-5 mb-6">
        <h3 className="text-xs uppercase tracking-wider text-[var(--text-disabled)] font-medium mb-3">Verified Identity</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-[var(--text-disabled)]">Wallet</p>
            <p className="text-xs font-mono">{address?.slice(0, 10)}...{address?.slice(-8)}</p>
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-disabled)]">Lot</p>
            <p className="text-xs">{tokenId !== undefined ? `#${tokenId}` : 'No property'}</p>
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-disabled)]">Address</p>
            <p className="text-xs">{propertyInfo?.streetAddress || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-disabled)]">Voting Power</p>
            <p className="text-xs text-[#B09B71] font-medium">{votes} vote{votes !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Achievements / Badges */}
      <div className="glass-card rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs uppercase tracking-wider text-[var(--text-disabled)] font-medium">Resident Achievements</h3>
            <p className="text-[10px] text-[var(--text-disabled)] mt-0.5">{earnedCount} of {badges.length} earned</p>
          </div>
          <div className="px-3 py-1 rounded-full bg-[rgba(176,155,113,0.10)] border border-[rgba(176,155,113,0.20)]">
            <span className="text-xs font-medium text-[#B09B71]">{earnedCount}/{badges.length}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {badges.map(badge => (
            <div
              key={badge.id}
              className={`flex items-center gap-3 rounded-lg p-3 transition-all ${
                badge.earned
                  ? 'bg-[rgba(176,155,113,0.10)] border border-[rgba(176,155,113,0.30)] shadow-[0_0_12px_rgba(201,169,110,0.15)]'
                  : 'bg-[rgba(26,26,30,0.40)] border border-[rgba(245,240,232,0.06)] opacity-40'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                badge.earned
                  ? 'bg-[rgba(176,155,113,0.20)] shadow-[0_0_8px_rgba(201,169,110,0.3)]'
                  : 'bg-[rgba(34,34,40,0.40)]'
              }`}>
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-medium truncate ${badge.earned ? 'text-[#D4C4A0]' : 'text-[var(--text-disabled)]'}`}>
                  {badge.name}
                  {badge.earned && <span className="ml-1.5 text-[10px] text-[#B09B71]"> Earned</span>}
                </p>
                <p className="text-[10px] text-[var(--text-disabled)] leading-tight">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editable Profile */}
      <div className="glass-card rounded-lg p-6 space-y-5">
        <h3 className="text-xs uppercase tracking-wider text-[var(--text-disabled)] font-medium">Profile Settings</h3>

        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-2">Display Name <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); if (nameError) setNameError(''); }}
            placeholder="How neighbors will see you (e.g., Rick Morang)"
            className={`w-full px-4 py-3 rounded-lg bg-[rgba(26,26,30,0.80)] border text-sm placeholder-[rgba(245,240,232,0.25)] focus:outline-none ${nameError ? 'border-[rgba(139,90,90,0.60)] focus:border-[#8B5A5A]' : 'border-[rgba(245,240,232,0.08)] focus:border-[rgba(176,155,113,0.50)]'}`}
          />
          {nameError && <p className="text-xs text-[#8B5A5A] mt-1">{nameError}</p>}
          <p className="text-[10px] text-[var(--text-disabled)] mt-1">This replaces your wallet address in community posts and comments</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-2">Email (optional)</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setEmailError(validateEmail(e.target.value)); }}
              placeholder="For notifications"
              className={`w-full px-4 py-3 rounded-lg bg-[rgba(26,26,30,0.80)] border text-sm placeholder-[rgba(245,240,232,0.25)] focus:outline-none ${emailError ? 'border-[rgba(139,90,90,0.60)] focus:border-[#8B5A5A]' : 'border-[rgba(245,240,232,0.08)] focus:border-[rgba(176,155,113,0.50)]'}`}
            />
            {emailError && <p className="text-xs text-[#8B5A5A] mt-1">{emailError}</p>}
          </div>
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-2">Phone (optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="For urgent alerts"
              className="w-full px-4 py-3 rounded-lg bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm placeholder-[rgba(245,240,232,0.25)] focus:border-[rgba(176,155,113,0.50)] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-2">Bio (optional)</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="A bit about yourself for the community directory"
            rows={3}
            className="w-full px-4 py-3 rounded-lg bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm placeholder-[rgba(245,240,232,0.25)] focus:border-[rgba(176,155,113,0.50)] focus:outline-none resize-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={updateProfile.isPending || !!emailError}
          className="w-full py-3 rounded-lg bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all"
        >
          {updateProfile.isPending ? 'Saving…' : saved ? <><Check className="w-4 h-4 inline mr-1" /> Saved</> : 'Save Profile'}
        </button>
      </div>

      {/* Privacy note */}
      <div className="mt-6 p-4 rounded-lg glass-card">
        <h4 className="text-xs font-medium text-[#B09B71] mb-1">Privacy</h4>
        <p className="text-[10px] text-[var(--text-muted)]">
          Your email and phone are never shared publicly. They&apos;re only used for notifications you opt into.
          Your display name and lot number are visible to the community. Your wallet address is publicly visible on the network.
        </p>
      </div>
    </div>
  );
}
