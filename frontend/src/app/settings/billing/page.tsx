'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, ExternalLink, AlertTriangle, Check, Clock } from 'lucide-react';
import { useSupabaseAuth } from '@/context/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { PLAN_CONFIGS, FEATURE_LABELS, TRIAL_DURATION_DAYS, GRACE_PERIOD_DAYS, type PlanTier } from '@/lib/plan-limits';

const TIERS: PlanTier[] = ['starter', 'professional', 'enterprise'];

export default function BillingPage() {
  const { user } = useSupabaseAuth();
  const router = useRouter();
  const [portalLoading, setPortalLoading] = useState(false);

  // TODO: Replace with actual community ID from context/selector
  const communityId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('community')
    : null;

  const {
    subscription,
    plan,
    status,
    planConfig,
    loading,
    trialDaysRemaining,
    isInGracePeriod,
    graceDaysRemaining,
    isActive,
    isReadOnly,
  } = useSubscription(communityId);

  async function openPortal() {
    if (!communityId) return;
    setPortalLoading(true);

    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communityId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Portal error — silently fail
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-fadeInUp">
        <h1 className="font-serif text-2xl text-[var(--text-heading)] mb-8">Billing</h1>
        <div className="bg-[var(--surface-1)] rounded-lg p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 bg-[var(--surface-2)] rounded" />
            <div className="h-4 w-72 bg-[var(--surface-2)] rounded" />
            <div className="h-4 w-64 bg-[var(--surface-2)] rounded" />
          </div>
        </div>
      </div>
    );
  }

  // No subscription yet — prompt to choose plan
  if (!subscription) {
    return (
      <div className="max-w-4xl mx-auto animate-fadeInUp">
        <h1 className="font-serif text-2xl text-[var(--text-heading)] mb-8">Billing</h1>

        <div className="bg-[var(--surface-1)] rounded-lg p-8 text-center">
          <CreditCard className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-4" />
          <h2 className="font-serif text-xl text-[var(--text-heading)] mb-2">
            No Active Plan
          </h2>
          <p className="text-sm text-[var(--text-muted)] mb-6 max-w-md mx-auto">
            Start your {TRIAL_DURATION_DAYS}-day free trial to unlock all features.
            No credit card required.
          </p>
          <button
            onClick={() => router.push(`/checkout${communityId ? `?community=${communityId}` : ''}`)}
            className="bg-[var(--aged-brass)] text-[var(--obsidian)] px-6 py-3 rounded-md font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Choose a Plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fadeInUp">
      <h1 className="font-serif text-2xl text-[var(--text-heading)] mb-8">Billing</h1>

      {/* Status Banners */}
      {status === 'past_due' && (
        <div className="mb-6 p-4 rounded-lg bg-[var(--glow-red)] border border-[rgba(107,58,58,0.25)] flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[var(--rosewood)] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[var(--rosewood)]">Payment Failed</p>
            <p className="text-xs text-[var(--text-body)] mt-1">
              {isInGracePeriod
                ? `Your account will become read-only in ${graceDaysRemaining} day${graceDaysRemaining !== 1 ? 's' : ''}. Update your payment method to avoid interruption.`
                : 'Your account is now in read-only mode. Update your payment method to restore full access.'}
            </p>
          </div>
        </div>
      )}

      {isReadOnly && status === 'canceled' && (
        <div className="mb-6 p-4 rounded-lg bg-[var(--aged-brass-glow)] border border-[rgba(176,155,113,0.20)] flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[var(--aged-brass)] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[var(--aged-brass)]">Subscription Canceled</p>
            <p className="text-xs text-[var(--text-body)] mt-1">
              Your community is in read-only mode. Resubscribe to restore full access.
            </p>
          </div>
        </div>
      )}

      {/* Current Plan */}
      <div className="bg-[var(--surface-1)] rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs tracking-widest uppercase text-[var(--text-muted)] mb-1">
              Current Plan
            </p>
            <h2 className="font-serif text-2xl text-[var(--text-heading)]">
              {planConfig?.name || 'Unknown'}
            </h2>
          </div>
          <StatusBadge status={status!} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <InfoBlock
            label="Billing"
            value={subscription.billing_cycle === 'annual' ? 'Annual' : 'Monthly'}
          />
          <InfoBlock
            label="Price"
            value={planConfig
              ? `$${subscription.billing_cycle === 'annual' ? planConfig.annualPrice : planConfig.monthlyPrice}/${subscription.billing_cycle === 'annual' ? 'yr' : 'mo'}`
              : '—'}
          />
          {status === 'trialing' && (
            <InfoBlock
              label="Trial Ends"
              value={subscription.trial_end
                ? new Date(subscription.trial_end).toLocaleDateString()
                : '—'}
            />
          )}
          {status === 'trialing' && (
            <InfoBlock
              label="Days Left"
              value={`${trialDaysRemaining}`}
            />
          )}
          {status === 'active' && (
            <InfoBlock
              label="Next Billing"
              value={subscription.current_period_end
                ? new Date(subscription.current_period_end).toLocaleDateString()
                : '—'}
            />
          )}
          <InfoBlock
            label="Max Properties"
            value={planConfig
              ? planConfig.maxProperties === Infinity ? 'Unlimited' : `${planConfig.maxProperties}`
              : '—'}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {subscription.stripe_customer_id && (
            <button
              onClick={openPortal}
              disabled={portalLoading}
              className="flex items-center gap-2 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-heading)] px-4 py-2.5 rounded-md text-sm font-medium transition-all disabled:opacity-50"
            >
              <ExternalLink className="w-4 h-4" />
              {portalLoading ? 'Opening...' : 'Manage on Stripe'}
            </button>
          )}
          {(status === 'canceled' || status === 'expired') && (
            <button
              onClick={() => router.push(`/checkout${communityId ? `?community=${communityId}` : ''}`)}
              className="bg-[var(--aged-brass)] text-[var(--obsidian)] px-4 py-2.5 rounded-md text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Resubscribe
            </button>
          )}
        </div>
      </div>

      {/* Plan Comparison */}
      <div className="bg-[var(--surface-1)] rounded-lg overflow-hidden">
        <div className="p-6 border-b border-[var(--divider)]">
          <h2 className="font-serif text-lg text-[var(--text-heading)]">
            All Plans
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-x divide-[var(--divider)]">
          {TIERS.map((tier) => {
            const config = PLAN_CONFIGS[tier];
            const isCurrent = plan === tier;

            return (
              <div key={tier} className={`p-6 ${isCurrent ? 'bg-[var(--aged-brass-glow)]' : ''}`}>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-serif text-lg text-[var(--text-heading)]">
                    {config.name}
                  </h3>
                  {isCurrent && (
                    <span className="text-xs bg-[var(--aged-brass-dim)] text-[var(--aged-brass)] px-2 py-0.5 rounded-full font-medium">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-2xl font-serif text-[var(--text-heading)] mb-1">
                  ${config.monthlyPrice}
                  <span className="text-sm text-[var(--text-muted)] font-sans">/mo</span>
                </p>
                <p className="text-xs text-[var(--text-muted)] mb-4">
                  or ${config.annualPrice}/yr (save 2 months)
                </p>
                <ul className="space-y-2">
                  {config.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-xs text-[var(--text-body)]">
                      <Check className="w-3.5 h-3.5 text-[var(--verdigris)] mt-0.5 shrink-0" />
                      {FEATURE_LABELS[feature]}
                    </li>
                  ))}
                </ul>
                {!isCurrent && isActive && (
                  <button
                    onClick={openPortal}
                    className="mt-4 w-full py-2 rounded-md text-xs font-medium bg-[var(--surface-2)] text-[var(--text-body)] hover:bg-[var(--surface-3)] transition-all"
                  >
                    {TIERS.indexOf(tier) > TIERS.indexOf(plan!) ? 'Upgrade' : 'Downgrade'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    trialing: 'bg-[rgba(90,122,154,0.15)] text-[var(--steel)]',
    active: 'bg-[var(--glow-green)] text-[var(--verdigris)]',
    past_due: 'bg-[var(--glow-red)] text-[var(--rosewood)]',
    canceled: 'bg-[var(--aged-brass-glow)] text-[var(--aged-brass)]',
    expired: 'bg-[rgba(245,240,232,0.05)] text-[var(--text-disabled)]',
  };

  const icons: Record<string, React.ReactNode> = {
    trialing: <Clock className="w-3.5 h-3.5" />,
    active: <Check className="w-3.5 h-3.5" />,
    past_due: <AlertTriangle className="w-3.5 h-3.5" />,
    canceled: <AlertTriangle className="w-3.5 h-3.5" />,
    expired: <AlertTriangle className="w-3.5 h-3.5" />,
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${styles[status] || styles.expired}`}>
      {icons[status]}
      {status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--text-muted)] mb-0.5">{label}</p>
      <p className="text-sm font-medium text-[var(--text-heading)]">{value}</p>
    </div>
  );
}
