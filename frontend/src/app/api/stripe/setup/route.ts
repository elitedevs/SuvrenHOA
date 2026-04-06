import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

/**
 * POST /api/stripe/setup
 * One-time setup: creates Stripe Products + Prices for all 3 tiers.
 * Returns the created IDs so they can be stored as env vars.
 */
export async function POST() {
  try {
    // Check if products already exist by searching metadata
    const existingProducts = await stripe.products.list({ limit: 10 });
    const alreadySetUp = existingProducts.data.some(
      (p) => p.metadata?.suvren_tier === 'starter'
    );

    if (alreadySetUp) {
      // Return existing product/price info
      const prices = await stripe.prices.list({ limit: 20, active: true });
      const result = buildResult(existingProducts.data, prices.data);
      return NextResponse.json({ message: 'Already set up', ...result });
    }

    // Create 3 products
    const starter = await stripe.products.create({
      name: 'SuvrenHOA Starter',
      description: 'For small communities — up to 50 properties. Governance, treasury, documents, forum, maintenance.',
      metadata: { suvren_tier: 'starter' },
    });

    const professional = await stripe.products.create({
      name: 'SuvrenHOA Professional',
      description: 'For growing communities — up to 200 properties. Health score, advanced reports, custom branding.',
      metadata: { suvren_tier: 'professional' },
    });

    const enterprise = await stripe.products.create({
      name: 'SuvrenHOA Enterprise',
      description: 'For large communities — unlimited properties. API access, white-label, priority support.',
      metadata: { suvren_tier: 'enterprise' },
    });

    // Create 6 prices (monthly + annual for each)
    const starterMonthly = await stripe.prices.create({
      product: starter.id,
      unit_amount: 4900, // $49.00
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { suvren_tier: 'starter', suvren_cycle: 'monthly' },
    });

    const starterAnnual = await stripe.prices.create({
      product: starter.id,
      unit_amount: 47000, // $470.00 (2 months free)
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: { suvren_tier: 'starter', suvren_cycle: 'annual' },
    });

    const professionalMonthly = await stripe.prices.create({
      product: professional.id,
      unit_amount: 12900, // $129.00
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { suvren_tier: 'professional', suvren_cycle: 'monthly' },
    });

    const professionalAnnual = await stripe.prices.create({
      product: professional.id,
      unit_amount: 123800, // $1,238.00 (2 months free)
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: { suvren_tier: 'professional', suvren_cycle: 'annual' },
    });

    const enterpriseMonthly = await stripe.prices.create({
      product: enterprise.id,
      unit_amount: 24900, // $249.00
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { suvren_tier: 'enterprise', suvren_cycle: 'monthly' },
    });

    const enterpriseAnnual = await stripe.prices.create({
      product: enterprise.id,
      unit_amount: 239000, // $2,390.00 (2 months free)
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: { suvren_tier: 'enterprise', suvren_cycle: 'annual' },
    });

    const result = {
      starter: {
        productId: starter.id,
        monthlyPriceId: starterMonthly.id,
        annualPriceId: starterAnnual.id,
      },
      professional: {
        productId: professional.id,
        monthlyPriceId: professionalMonthly.id,
        annualPriceId: professionalAnnual.id,
      },
      enterprise: {
        productId: enterprise.id,
        monthlyPriceId: enterpriseMonthly.id,
        annualPriceId: enterpriseAnnual.id,
      },
    };

    return NextResponse.json({
      message: 'Stripe products and prices created successfully',
      ...result,
      envVars: {
        STRIPE_PRODUCT_STARTER: starter.id,
        STRIPE_PRICE_STARTER_MONTHLY: starterMonthly.id,
        STRIPE_PRICE_STARTER_ANNUAL: starterAnnual.id,
        STRIPE_PRODUCT_PROFESSIONAL: professional.id,
        STRIPE_PRICE_PROFESSIONAL_MONTHLY: professionalMonthly.id,
        STRIPE_PRICE_PROFESSIONAL_ANNUAL: professionalAnnual.id,
        STRIPE_PRODUCT_ENTERPRISE: enterprise.id,
        STRIPE_PRICE_ENTERPRISE_MONTHLY: enterpriseMonthly.id,
        STRIPE_PRICE_ENTERPRISE_ANNUAL: enterpriseAnnual.id,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildResult(
  products: { id: string; metadata: Record<string, string> }[],
  prices: { id: string; product: string | { id: string }; recurring: { interval: string } | null; metadata: Record<string, string> }[]
) {
  const tiers = ['starter', 'professional', 'enterprise'] as const;
  const result: Record<string, Record<string, string>> = {};

  for (const tier of tiers) {
    const product = products.find((p) => p.metadata?.suvren_tier === tier);
    if (!product) continue;

    const productId = typeof product.id === 'string' ? product.id : product.id;
    const monthly = prices.find(
      (p) => {
        const pid = typeof p.product === 'string' ? p.product : p.product.id;
        return pid === productId && p.recurring?.interval === 'month';
      }
    );
    const annual = prices.find(
      (p) => {
        const pid = typeof p.product === 'string' ? p.product : p.product.id;
        return pid === productId && p.recurring?.interval === 'year';
      }
    );

    result[tier] = {
      productId: product.id,
      monthlyPriceId: monthly?.id || '',
      annualPriceId: annual?.id || '',
    };
  }

  return result;
}
