'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { PLAN_CONFIGS, FEATURE_LABELS, TRIAL_DURATION_DAYS, type PlanTier, type PlanFeature } from '@/lib/plan-limits';

const ALL_FEATURES: PlanFeature[] = [
  'basic_governance',
  'treasury_management',
  'document_storage',
  'community_forum',
  'maintenance_tracking',
  'health_score',
  'advanced_reports',
  'custom_branding',
  'api_access',
  'white_label',
  'priority_support',
  'bulk_operations',
];

const TIERS: PlanTier[] = ['starter', 'professional', 'enterprise'];

export default function CheckoutPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const communityId = searchParams.get('community');

  async function handleSelectPlan(tier: PlanTier) {
    if (!communityId) {
      router.push('/create-community');
      return;
    }

    setLoadingTier(tier);
    setError(null);

    try {
      // First, ensure products exist in Stripe
      const setupRes = await fetch('/api/stripe/setup', { method: 'POST' });
      const setupData = await setupRes.json();

      const tierData = setupData[tier];
      if (!tierData) {
        throw new Error('Plan not configured in Stripe. Run setup first.');
      }

      const priceId = billingCycle === 'annual' ? tierData.annualPriceId : tierData.monthlyPriceId;

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, communityId, plan: tier, billingCycle }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoadingTier(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto animate-fadeInUp">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="font-serif text-3xl sm:text-4xl text-[var(--text-heading)] mb-3">
          Choose Your Plan
        </h1>
        <p className="text-[var(--text-body)] max-w-2xl mx-auto">
          Start with a {TRIAL_DURATION_DAYS}-day free trial. No credit card required.
          Cancel anytime.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="max-w-md mx-auto mb-6 p-3 rounded-lg bg-[var(--glow-red)] border border-[rgba(107,58,58,0.25)] text-sm text-[var(--rosewood)]">
          {error}
        </div>
      )}

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            billingCycle === 'monthly'
              ? 'bg-[var(--aged-brass-dim)] text-[var(--aged-brass)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle('annual')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            billingCycle === 'annual'
              ? 'bg-[var(--aged-brass-dim)] text-[var(--aged-brass)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'
          }`}
        >
          Annual
          <span className="ml-2 text-xs text-[var(--verdigris)]">Save 2 months</span>
        </button>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {TIERS.map((tier) => {
          const config = PLAN_CONFIGS[tier];
          const price = billingCycle === 'monthly' ? config.monthlyPrice : config.annualPrice;
          const isPopular = tier === 'professional';

          return (
            <div
              key={tier}
              className={`relative bg-[var(--surface-1)] rounded-lg p-6 flex flex-col ${
                isPopular ? 'ring-1 ring-[var(--aged-brass)] ring-opacity-40' : ''
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-[var(--aged-brass)] text-[var(--obsidian)] text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-serif text-xl text-[var(--text-heading)] mb-1">
                  {config.name}
                </h3>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  {config.description}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-serif text-[var(--text-heading)]">
                    ${billingCycle === 'monthly' ? price : Math.round(price / 12)}
                  </span>
                  <span className="text-[var(--text-muted)] text-sm">/mo</span>
                </div>
                {billingCycle === 'annual' && (
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    ${price}/year billed annually
                  </p>
                )}
                <p className="text-xs text-[var(--verdigris)] mt-2">
                  Up to {config.maxProperties === Infinity ? 'unlimited' : config.maxProperties} properties
                </p>
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {config.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-[var(--verdigris)] mt-0.5 shrink-0" />
                    <span className="text-[var(--text-body)]">{FEATURE_LABELS[feature]}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(tier)}
                disabled={loadingTier !== null}
                className={`w-full py-3 rounded-md text-sm font-semibold transition-all ${
                  isPopular
                    ? 'bg-[var(--aged-brass)] text-[var(--obsidian)] hover:opacity-90'
                    : 'bg-[var(--surface-2)] text-[var(--text-heading)] hover:bg-[var(--surface-3)]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loadingTier === tier ? 'Redirecting...' : 'Start Free Trial'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="bg-[var(--surface-1)] rounded-lg overflow-hidden">
        <div className="p-6 border-b border-[var(--divider)]">
          <h2 className="font-serif text-xl text-[var(--text-heading)]">
            Feature Comparison
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--divider)]">
                <th className="text-left p-4 text-sm font-medium text-[var(--text-muted)]">
                  Feature
                </th>
                {TIERS.map((tier) => (
                  <th
                    key={tier}
                    className="p-4 text-center text-sm font-medium text-[var(--text-heading)]"
                  >
                    {PLAN_CONFIGS[tier].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_FEATURES.map((feature) => (
                <tr key={feature} className="border-b border-[var(--divider)] last:border-0">
                  <td className="p-4 text-sm text-[var(--text-body)]">
                    {FEATURE_LABELS[feature]}
                  </td>
                  {TIERS.map((tier) => (
                    <td key={tier} className="p-4 text-center">
                      {PLAN_CONFIGS[tier].features.includes(feature) ? (
                        <Check className="w-4 h-4 text-[var(--verdigris)] mx-auto" />
                      ) : (
                        <span className="text-[var(--text-disabled)]">&mdash;</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-b border-[var(--divider)]">
                <td className="p-4 text-sm text-[var(--text-body)]">Max Properties</td>
                <td className="p-4 text-center text-sm text-[var(--text-body)]">50</td>
                <td className="p-4 text-center text-sm text-[var(--text-body)]">200</td>
                <td className="p-4 text-center text-sm text-[var(--text-body)]">Unlimited</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
