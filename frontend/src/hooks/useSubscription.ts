'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import { PLAN_CONFIGS, GRACE_PERIOD_DAYS, type PlanTier, type PlanFeature } from '@/lib/plan-limits';

type Subscription = {
  id: string;
  community_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  plan: PlanTier;
  billing_cycle: 'monthly' | 'annual';
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';
  trial_end: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
};

export function useSubscription(communityId: string | null) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!communityId) {
      setLoading(false);
      return;
    }

    try {
      const supabase = createSupabaseBrowser();
      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw new Error(fetchError.message);
      setSubscription(data as Subscription | null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const plan = subscription?.plan || null;
  const status = subscription?.status || null;

  const trialDaysRemaining = useMemo(() => {
    if (!subscription?.trial_end) return 0;
    const trialEnd = new Date(subscription.trial_end);
    const now = new Date();
    const diff = trialEnd.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [subscription?.trial_end]);

  const isInGracePeriod = useMemo(() => {
    if (subscription?.status !== 'past_due') return false;
    if (!subscription.current_period_end) return false;
    const periodEnd = new Date(subscription.current_period_end);
    const graceEnd = new Date(periodEnd.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
    return new Date() < graceEnd;
  }, [subscription?.status, subscription?.current_period_end]);

  const graceDaysRemaining = useMemo(() => {
    if (!isInGracePeriod || !subscription?.current_period_end) return 0;
    const periodEnd = new Date(subscription.current_period_end);
    const graceEnd = new Date(periodEnd.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
    const diff = graceEnd.getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [isInGracePeriod, subscription?.current_period_end]);

  const isActive = status === 'active' || status === 'trialing' || isInGracePeriod;

  const isReadOnly = !isActive && subscription !== null;

  const isFeatureAvailable = useCallback(
    (feature: PlanFeature): boolean => {
      if (!plan) return false;
      if (!isActive) return false;
      return PLAN_CONFIGS[plan].features.includes(feature);
    },
    [plan, isActive]
  );

  const planConfig = plan ? PLAN_CONFIGS[plan] : null;

  return {
    subscription,
    plan,
    status,
    planConfig,
    loading,
    error,
    trialDaysRemaining,
    isInGracePeriod,
    graceDaysRemaining,
    isActive,
    isReadOnly,
    isFeatureAvailable,
    refresh: fetchSubscription,
  };
}
