import { supabaseAdmin } from '@/lib/supabase';
import { PLAN_CONFIGS, GRACE_PERIOD_DAYS, type PlanTier, type PlanFeature } from '@/lib/plan-limits';

type SubscriptionRow = {
  id: string;
  community_id: string;
  plan: PlanTier;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';
  trial_end: string | null;
  current_period_end: string | null;
};

export type PlanCheckResult = {
  hasSubscription: boolean;
  plan: PlanTier | null;
  status: string | null;
  isActive: boolean;
  isReadOnly: boolean;
  maxProperties: number;
};

/**
 * Server-side plan check for API routes and middleware.
 * Returns subscription status for a community.
 */
export async function checkCommunityPlan(communityId: string): Promise<PlanCheckResult> {
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('id, community_id, plan, status, trial_end, current_period_end')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!subscription) {
    return {
      hasSubscription: false,
      plan: null,
      status: null,
      isActive: false,
      isReadOnly: false,
      maxProperties: 0,
    };
  }

  const sub = subscription as SubscriptionRow;
  const isTrialingOrActive = sub.status === 'trialing' || sub.status === 'active';

  // Check grace period for past_due
  let inGracePeriod = false;
  if (sub.status === 'past_due' && sub.current_period_end) {
    const periodEnd = new Date(sub.current_period_end);
    const graceEnd = new Date(periodEnd.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
    inGracePeriod = new Date() < graceEnd;
  }

  const isActive = isTrialingOrActive || inGracePeriod;
  const isReadOnly = !isActive && sub.status !== null;

  return {
    hasSubscription: true,
    plan: sub.plan,
    status: sub.status,
    isActive,
    isReadOnly,
    maxProperties: sub.plan ? PLAN_CONFIGS[sub.plan].maxProperties : 0,
  };
}

/**
 * Server-side feature check.
 */
export function checkFeatureAccess(plan: PlanTier | null, feature: PlanFeature): boolean {
  if (!plan) return false;
  return PLAN_CONFIGS[plan].features.includes(feature);
}

/**
 * Higher-order function for API routes that need plan enforcement.
 * Wraps a handler and injects plan status.
 */
export function withPlanCheck(
  communityIdExtractor: (request: Request) => Promise<string | null>,
  handler: (request: Request, planCheck: PlanCheckResult) => Promise<Response>
) {
  return async (request: Request) => {
    const communityId = await communityIdExtractor(request);

    if (!communityId) {
      return new Response(JSON.stringify({ error: 'Community ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const planCheck = await checkCommunityPlan(communityId);

    // If read-only, block write operations
    if (planCheck.isReadOnly && request.method !== 'GET') {
      return new Response(
        JSON.stringify({
          error: 'Subscription expired or canceled. Your community is in read-only mode.',
          code: 'PLAN_EXPIRED',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return handler(request, planCheck);
  };
}
