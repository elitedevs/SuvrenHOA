'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useSupabaseAuth } from '@/context/AuthContext';
import { useSmartWallet } from '@/hooks/useSmartWallet';
import { GettingStartedChecklist } from '@/components/GettingStartedChecklist';
import Link from 'next/link';
import {
  Home, User, Wallet, Compass, CheckCircle2,
  ChevronRight, ArrowLeft, Sparkles,
  Vote, Landmark, BookOpen, Shield,
} from 'lucide-react';

// ── Confetti ────────────────────────────────────────────────────────────────
function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => i);
  const colors = ['#B09B71', '#D4C4A0', '#b8942e', '#3A7D6F', '#5A7A9A', '#8B5A5A'];
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-50">
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .confetti-piece {
          position: absolute;
          top: -20px;
          animation: confetti-fall linear forwards;
        }
      `}</style>
      {pieces.map((i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: `${Math.random() * 100}%`,
            width: `${6 + Math.random() * 8}px`,
            height: `${6 + Math.random() * 8}px`,
            backgroundColor: colors[i % colors.length],
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animationDuration: `${2 + Math.random() * 3}s`,
            animationDelay: `${Math.random() * 1.5}s`,
          }}
        />
      ))}
    </div>
  );
}

// ── Step Indicator ──────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs tracking-widest uppercase text-[var(--text-disabled)]">
          Step {current} of {total}
        </span>
        <span className="text-xs text-[#B09B71] font-medium">
          {Math.round((current / total) * 100)}%
        </span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-all duration-500"
            style={{
              background:
                i < current
                  ? 'linear-gradient(90deg, #B09B71, #b8942e)'
                  : 'rgba(255,255,255,0.08)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Feature Card (for tour) ─────────────────────────────────────────────────
function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="glass-card rounded-xl p-5 flex items-start gap-4">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}15`, border: `1px solid ${color}30` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--parchment)] mb-0.5">{title}</p>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const { user, profile } = useSupabaseAuth();
  const router = useRouter();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!user && profile === null) {
      // Allow brief loading period
      const timeout = setTimeout(() => {
        if (!user) router.push('/login');
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [user, profile, router]);

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center page-enter">
        <div className="w-12 h-12 rounded-xl bg-[rgba(176,155,113,0.08)] flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Home className="w-6 h-6 text-[#B09B71] opacity-60" />
        </div>
        <p className="text-sm text-[var(--text-muted)]">Loading...</p>
      </div>
    );
  }

  return <OnboardingWizard />;
}

// ── Wizard ──────────────────────────────────────────────────────────────────
function OnboardingWizard() {
  const { user, profile, refreshProfile } = useSupabaseAuth();
  const { isConnected } = useAccount();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const TOTAL_STEPS = 5;

  // Profile form state
  const [name, setName] = useState(profile?.full_name || '');
  const [lotNumber, setLotNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Sync profile data
  useEffect(() => {
    if (profile?.full_name) setName(profile.full_name);
  }, [profile]);

  const goNext = useCallback(() => {
    if (step < TOTAL_STEPS) setStep(s => s + 1);
  }, [step]);

  const goBack = useCallback(() => {
    if (step > 1) setStep(s => s - 1);
  }, [step]);

  // Save profile to Supabase
  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: profile?.wallet_address || user?.id,
          display_name: name,
          lot_number: lotNumber ? parseInt(lotNumber, 10) : null,
          phone: phone || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to save profile');
      await refreshProfile();
      goNext();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Complete onboarding
  const handleComplete = () => {
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
      router.push('/dashboard');
    }, 3000);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-10 page-enter">
      {showConfetti && <Confetti />}

      {/* Header */}
      {step <= TOTAL_STEPS && (
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-medium gradient-text mb-1">
            Welcome to SuvrenHOA
          </h1>
          <p className="text-sm text-[var(--text-disabled)]">
            {user?.email || 'New Member'}
          </p>
        </div>
      )}

      {step <= TOTAL_STEPS && <StepIndicator current={step} total={TOTAL_STEPS} />}

      {/* ── Step 1: Welcome + Community Info ── */}
      {step === 1 && (
        <div className="glass-card rounded-xl p-8 animate-fade-in">
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-[rgba(176,155,113,0.10)] border border-[rgba(176,155,113,0.20)] flex items-center justify-center">
              <Home className="w-8 h-8 text-[#B09B71]" />
            </div>
          </div>
          <h2 className="text-2xl font-normal text-center mb-2">Welcome!</h2>
          <p className="text-[var(--text-muted)] text-center text-sm mb-7 leading-relaxed">
            You&apos;ve been invited to your community on SuvrenHOA — the modern, transparent
            way to manage your homeowners association. Let&apos;s get you set up in just a few minutes.
          </p>

          <div className="space-y-3 mb-7">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[rgba(245,240,232,0.03)]">
              <Shield className="w-5 h-5 text-[#3A7D6F]" />
              <p className="text-sm text-[var(--text-body)]">Tamper-proof governance on the blockchain</p>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[rgba(245,240,232,0.03)]">
              <Landmark className="w-5 h-5 text-[#B09B71]" />
              <p className="text-sm text-[var(--text-body)]">Transparent treasury management</p>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[rgba(245,240,232,0.03)]">
              <Vote className="w-5 h-5 text-[#5A7A9A]" />
              <p className="text-sm text-[var(--text-body)]">Direct democracy — every vote counts</p>
            </div>
          </div>

          <button
            onClick={goNext}
            className="w-full py-3.5 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[#0C0C0E] font-medium text-sm transition-all duration-200 min-h-[44px]"
          >
            Get Started <ChevronRight className="w-4 h-4 inline ml-1" />
          </button>
        </div>
      )}

      {/* ── Step 2: Complete Profile ── */}
      {step === 2 && (
        <div className="glass-card rounded-xl p-7 animate-fade-in">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[rgba(176,155,113,0.10)] border border-[rgba(176,155,113,0.20)] flex items-center justify-center">
              <User className="w-5 h-5 text-[#B09B71]" />
            </div>
            <div>
              <h2 className="text-xl font-medium">Complete Your Profile</h2>
              <p className="text-xs text-[var(--text-disabled)]">Help your neighbors know who you are</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs tracking-widest uppercase text-[var(--text-disabled)] block mb-1.5">
                Full Name
              </label>
              <input
                className="w-full bg-[rgba(26,26,30,0.60)] border border-[rgba(245,240,232,0.08)] rounded-xl px-4 py-3 text-sm text-[var(--parchment)] placeholder-[rgba(245,240,232,0.25)] focus:outline-none focus:border-[rgba(176,155,113,0.50)]"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs tracking-widest uppercase text-[var(--text-disabled)] block mb-1.5">
                Lot Number
              </label>
              <input
                type="number"
                className="w-full bg-[rgba(26,26,30,0.60)] border border-[rgba(245,240,232,0.08)] rounded-xl px-4 py-3 text-sm text-[var(--parchment)] placeholder-[rgba(245,240,232,0.25)] focus:outline-none focus:border-[rgba(176,155,113,0.50)]"
                placeholder="Your lot number (e.g., 42)"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs tracking-widest uppercase text-[var(--text-disabled)] block mb-1.5">
                Phone <span className="normal-case text-[var(--text-disabled)]">(optional)</span>
              </label>
              <input
                type="tel"
                className="w-full bg-[rgba(26,26,30,0.60)] border border-[rgba(245,240,232,0.08)] rounded-xl px-4 py-3 text-sm text-[var(--parchment)] placeholder-[rgba(245,240,232,0.25)] focus:outline-none focus:border-[rgba(176,155,113,0.50)]"
                placeholder="For emergency alerts"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {saveError && (
            <div className="mt-4 px-4 py-3 rounded-xl bg-[rgba(107,58,58,0.15)] border border-[rgba(139,90,90,0.30)] text-[#8B5A5A] text-sm">
              {saveError}
            </div>
          )}

          <div className="flex gap-3 mt-7">
            <button
              onClick={goBack}
              className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-[rgba(26,26,30,0.60)] border border-[rgba(245,240,232,0.08)] text-[var(--text-muted)] hover:text-[var(--parchment)] font-medium text-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[#0C0C0E] font-medium text-sm transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Connect Wallet (Optional) ── */}
      {step === 3 && (
        <div className="glass-card rounded-xl p-7 animate-fade-in">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[rgba(176,155,113,0.10)] border border-[rgba(176,155,113,0.20)] flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[#B09B71]" />
            </div>
            <div>
              <h2 className="text-xl font-medium">Connect Your Wallet</h2>
              <p className="text-xs text-[var(--text-disabled)]">Optional — required for voting and dues</p>
            </div>
          </div>

          <p className="text-sm text-[var(--text-muted)] mb-6 leading-relaxed">
            A wallet is your &ldquo;governance key&rdquo; — it lets you vote on proposals, pay dues,
            and receive your property NFT. We recommend the Coinbase Smart Wallet for the easiest setup.
          </p>

          {isConnected ? (
            <div className="px-4 py-4 rounded-xl bg-[rgba(42,93,79,0.10)] border border-[rgba(42,93,79,0.20)] mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#3A7D6F]" />
                <p className="text-sm font-medium text-[#3A7D6F]">Wallet Connected</p>
              </div>
              <p className="text-xs text-[var(--text-disabled)] mt-1">
                Your governance key is linked to your account.
              </p>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              <Link
                href="/settings/wallet"
                className="flex items-center justify-between w-full px-5 py-4 rounded-xl bg-[rgba(176,155,113,0.08)] border border-[rgba(176,155,113,0.15)] hover:border-[rgba(176,155,113,0.30)] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-[#B09B71]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--parchment)]">Smart Wallet</p>
                    <p className="text-xs text-[var(--text-disabled)]">Easiest — uses your passkey, no app needed</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-disabled)] group-hover:text-[#B09B71] transition-colors" />
              </Link>

              <Link
                href="/settings/wallet"
                className="flex items-center justify-between w-full px-5 py-4 rounded-xl bg-[rgba(245,240,232,0.03)] border border-[rgba(245,240,232,0.06)] hover:border-[rgba(245,240,232,0.12)] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-[var(--text-muted)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--parchment)]">MetaMask / WalletConnect</p>
                    <p className="text-xs text-[var(--text-disabled)]">Use an existing wallet you already have</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-disabled)] group-hover:text-[var(--text-body)] transition-colors" />
              </Link>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={goBack}
              className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-[rgba(26,26,30,0.60)] border border-[rgba(245,240,232,0.08)] text-[var(--text-muted)] hover:text-[var(--parchment)] font-medium text-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={goNext}
              className="flex-1 py-3 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[#0C0C0E] font-medium text-sm transition-all"
            >
              {isConnected ? 'Continue' : 'Skip for Now'}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Tour of Key Features ── */}
      {step === 4 && (
        <div className="glass-card rounded-xl p-7 animate-fade-in">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[rgba(90,122,154,0.10)] border border-[rgba(90,122,154,0.20)] flex items-center justify-center">
              <Compass className="w-5 h-5 text-[#5A7A9A]" />
            </div>
            <div>
              <h2 className="text-xl font-medium">Key Features</h2>
              <p className="text-xs text-[var(--text-disabled)]">Here&apos;s what you can do with SuvrenHOA</p>
            </div>
          </div>

          <div className="space-y-3 mb-7">
            <FeatureCard
              icon={Vote}
              title="Vote on Proposals"
              description="Every resident gets a voice. Vote directly on community decisions — budgets, rules, improvements."
              color="#5A7A9A"
            />
            <FeatureCard
              icon={Landmark}
              title="Transparent Treasury"
              description="See exactly where every dollar goes. All transactions are recorded on the blockchain."
              color="#B09B71"
            />
            <FeatureCard
              icon={BookOpen}
              title="Community Documents"
              description="Access CC&Rs, meeting minutes, and bylaws — all tamper-proof and always available."
              color="#3A7D6F"
            />
            <FeatureCard
              icon={Shield}
              title="Secure & Private"
              description="Your data is protected. Governance is transparent, but personal info stays private."
              color="#6B3A3A"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={goBack}
              className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-[rgba(26,26,30,0.60)] border border-[rgba(245,240,232,0.08)] text-[var(--text-muted)] hover:text-[var(--parchment)] font-medium text-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={goNext}
              className="flex-1 py-3 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[#0C0C0E] font-medium text-sm transition-all"
            >
              Almost Done <ChevronRight className="w-4 h-4 inline ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 5: Getting Started Checklist ── */}
      {step === 5 && (
        <div className="animate-fade-in">
          <div className="glass-card rounded-xl p-7 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[rgba(42,93,79,0.10)] border border-[rgba(42,93,79,0.20)] flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#3A7D6F]" />
              </div>
              <div>
                <h2 className="text-xl font-medium">You&apos;re All Set!</h2>
                <p className="text-xs text-[var(--text-disabled)]">Complete these items to get the most out of your community</p>
              </div>
            </div>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              Your account is ready. Use the checklist below to explore your community
              and unlock all features. You can always find this on your dashboard.
            </p>
          </div>

          <GettingStartedChecklist
            welcomeMessage="Welcome aboard! Take a few minutes to explore — every step brings you closer to full community participation."
          />

          {/* Sample proposal CTA */}
          <div className="glass-card rounded-xl p-6 mb-6 border border-[rgba(90,122,154,0.15)]">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[rgba(90,122,154,0.10)] border border-[rgba(90,122,154,0.20)] flex items-center justify-center shrink-0">
                <Vote className="w-5 h-5 text-[#5A7A9A]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--parchment)] mb-1">Cast Your First Vote</p>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-3">
                  There may be active proposals waiting for your input. Check the governance page to see
                  what your community is deciding.
                </p>
                <Link
                  href="/proposals"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[rgba(90,122,154,0.12)] hover:bg-[rgba(90,122,154,0.20)] text-sm text-[#5A7A9A] font-medium transition-all"
                >
                  View Proposals <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={goBack}
              className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-[rgba(26,26,30,0.60)] border border-[rgba(245,240,232,0.08)] text-[var(--text-muted)] hover:text-[var(--parchment)] font-medium text-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleComplete}
              className="flex-1 py-3.5 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[#0C0C0E] font-medium text-sm transition-all shadow-[0_0_20px_rgba(176,155,113,0.12)] hover:shadow-[0_0_28px_rgba(176,155,113,0.28)]"
            >
              Go to Dashboard <ChevronRight className="w-4 h-4 inline ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
