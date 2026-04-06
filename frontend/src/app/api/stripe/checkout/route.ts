import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createSupabaseServer } from '@/lib/supabase-server';
import { TRIAL_DURATION_DAYS } from '@/lib/plan-limits';

export const dynamic = 'force-dynamic';

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout session with 60-day free trial (no CC for trial).
 * Body: { priceId, communityId, plan, billingCycle }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { priceId, communityId, plan, billingCycle } = await request.json();

    if (!priceId || !communityId || !plan) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify user is admin of this community
    const { data: membership } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', communityId)
      .eq('profile_id', user.id)
      .single();

    if (!membership || membership.role !== 'admin') {
      return NextResponse.json({ error: 'Only community admins can manage billing' }, { status: 403 });
    }

    // Check for existing Stripe customer
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('community_id', communityId)
      .maybeSingle();

    let customerId = existingSub?.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          community_id: communityId,
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // Create checkout session with trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_collection: 'if_required',
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: TRIAL_DURATION_DAYS,
        metadata: {
          community_id: communityId,
          plan,
          billing_cycle: billingCycle || 'monthly',
        },
      },
      metadata: {
        community_id: communityId,
        plan,
        billing_cycle: billingCycle || 'monthly',
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
