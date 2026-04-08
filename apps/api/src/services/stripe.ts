import Stripe from 'stripe';
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '../db/schema';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('[stripe] STRIPE_SECRET_KEY not set — billing endpoints will not function');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
});

/**
 * Resolve the Stripe Price ID for a given tier.
 * In production, set STRIPE_PRICE_STARTER / STRIPE_PRICE_GROWTH / STRIPE_PRICE_SCALE.
 * For local dev without Stripe configured, we fall back to a stub sentinel so the
 * rest of the code can still run (checkout will fail gracefully at the Stripe call).
 */
export function getPriceId(tier: SubscriptionTier): string {
  const envMap: Record<SubscriptionTier, string> = {
    starter: process.env.STRIPE_PRICE_STARTER || 'price_starter_placeholder',
    growth: process.env.STRIPE_PRICE_GROWTH || 'price_growth_placeholder',
    scale: process.env.STRIPE_PRICE_SCALE || 'price_scale_placeholder',
  };
  return envMap[tier];
}

/** Create or retrieve the Stripe Customer for a brand. */
export async function ensureStripeCustomer(brandId: string, email: string, name: string): Promise<string> {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { brandId },
  });
  return customer.id;
}

/** Create a Stripe Checkout Session for a subscription tier. */
export async function createCheckoutSession(opts: {
  stripeCustomerId: string;
  tier: SubscriptionTier;
  brandId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer: opts.stripeCustomerId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [{ price: getPriceId(opts.tier), quantity: 1 }],
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    metadata: { brandId: opts.brandId, tier: opts.tier },
    subscription_data: {
      metadata: { brandId: opts.brandId, tier: opts.tier },
    },
  });
  return session.url!;
}

/** Create a Stripe Billing Portal session so brands can manage their subscription. */
export async function createBillingPortalSession(stripeCustomerId: string, returnUrl: string): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });
  return session.url;
}

/** Parse and verify a Stripe webhook event. */
export function constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET not set');
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}
