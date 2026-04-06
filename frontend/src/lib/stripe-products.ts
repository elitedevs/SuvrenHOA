/**
 * Stripe product/price configuration.
 * Price IDs are populated after running the /api/stripe/setup endpoint.
 * In production, these would be set as env vars after initial setup.
 */

export type StripePriceConfig = {
  product: string;
  monthlyPriceId: string;
  annualPriceId: string;
};

// These get populated by the setup endpoint or env vars
export const STRIPE_PRICES: Record<string, StripePriceConfig> = {
  starter: {
    product: process.env.STRIPE_PRODUCT_STARTER || '',
    monthlyPriceId: process.env.STRIPE_PRICE_STARTER_MONTHLY || '',
    annualPriceId: process.env.STRIPE_PRICE_STARTER_ANNUAL || '',
  },
  professional: {
    product: process.env.STRIPE_PRODUCT_PROFESSIONAL || '',
    monthlyPriceId: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY || '',
    annualPriceId: process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL || '',
  },
  enterprise: {
    product: process.env.STRIPE_PRODUCT_ENTERPRISE || '',
    monthlyPriceId: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '',
    annualPriceId: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL || '',
  },
};
