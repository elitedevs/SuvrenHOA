import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events for subscription lifecycle.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Signature verification failed';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

/** Extract subscription ID from an invoice's parent */
function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  if (!invoice.parent) return null;
  if (invoice.parent.type !== 'subscription_details') return null;
  const sub = invoice.parent.subscription_details?.subscription;
  if (!sub) return null;
  return typeof sub === 'string' ? sub : sub.id;
}

/** Get current_period_end from the first subscription item */
function getItemPeriodEnd(subscription: Stripe.Subscription): number | null {
  const firstItem = subscription.items?.data?.[0];
  return firstItem?.current_period_end ?? null;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const communityId = session.metadata?.community_id;
  const plan = session.metadata?.plan;
  const billingCycle = session.metadata?.billing_cycle || 'monthly';

  if (!communityId || !plan) {
    console.error('Missing metadata on checkout session:', session.id);
    return;
  }

  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id;

  let trialEnd: string | null = null;
  let currentPeriodEnd: string | null = null;

  if (subscriptionId) {
    const sub = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items'],
    });
    if (sub.trial_end) {
      trialEnd = new Date(sub.trial_end * 1000).toISOString();
    }
    const periodEnd = getItemPeriodEnd(sub);
    if (periodEnd) {
      currentPeriodEnd = new Date(periodEnd * 1000).toISOString();
    }
  }

  const customerId = typeof session.customer === 'string'
    ? session.customer
    : session.customer?.id || '';

  await supabaseAdmin
    .from('subscriptions')
    .upsert(
      {
        community_id: communityId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId || null,
        plan,
        billing_cycle: billingCycle,
        status: 'trialing',
        trial_end: trialEnd,
        current_period_end: currentPeriodEnd,
      },
      { onConflict: 'stripe_subscription_id' }
    );
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = getSubscriptionIdFromInvoice(invoice);
  if (!subscriptionId) return;

  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'active' })
    .eq('stripe_subscription_id', subscriptionId);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = getSubscriptionIdFromInvoice(invoice);
  if (!subscriptionId) return;

  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', subscriptionId);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const plan = subscription.metadata?.plan;
  const billingCycle = subscription.metadata?.billing_cycle;

  const periodEnd = getItemPeriodEnd(subscription);

  const updates: Record<string, unknown> = {
    status: mapStripeStatus(subscription.status),
    cancel_at_period_end: subscription.cancel_at_period_end,
    current_period_end: periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : null,
  };

  if (plan) updates.plan = plan;
  if (billingCycle) updates.billing_cycle = billingCycle;

  if (subscription.trial_end) {
    updates.trial_end = new Date(subscription.trial_end * 1000).toISOString();
  }

  await supabaseAdmin
    .from('subscriptions')
    .update(updates)
    .eq('stripe_subscription_id', subscription.id);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'canceled' })
    .eq('stripe_subscription_id', subscription.id);
}

function mapStripeStatus(status: string): string {
  switch (status) {
    case 'trialing': return 'trialing';
    case 'active': return 'active';
    case 'past_due': return 'past_due';
    case 'canceled':
    case 'unpaid': return 'canceled';
    case 'incomplete_expired': return 'expired';
    default: return 'active';
  }
}
