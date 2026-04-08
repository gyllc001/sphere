import { Router, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { brands, SUBSCRIPTION_TIERS } from '../db/schema';
import { requireAuth, requireRole } from '../middleware/auth';
import {
  ensureStripeCustomer,
  createCheckoutSession,
  createBillingPortalSession,
  constructWebhookEvent,
} from '../services/stripe';
import type { SubscriptionTier } from '../db/schema';

const router = Router();

const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';

// ── GET /api/billing/subscription ────────────────────────────────────────────
// Return the brand's current subscription info.
router.get('/subscription', requireAuth, requireRole('brand'), async (req: Request, res: Response) => {
  const [brand] = await db
    .select({
      subscriptionTier: brands.subscriptionTier,
      subscriptionStatus: brands.subscriptionStatus,
      partnershipLimit: brands.partnershipLimit,
      stripeCustomerId: brands.stripeCustomerId,
    })
    .from(brands)
    .where(eq(brands.id, req.auth!.sub))
    .limit(1);

  if (!brand) return res.status(404).json({ error: 'Brand not found' });

  const tierInfo = brand.subscriptionTier ? SUBSCRIPTION_TIERS[brand.subscriptionTier] : null;

  return res.json({
    tier: brand.subscriptionTier,
    status: brand.subscriptionStatus,
    partnershipLimit: brand.partnershipLimit,
    tierDetails: tierInfo,
    tiers: SUBSCRIPTION_TIERS,
  });
});

// ── POST /api/billing/checkout ────────────────────────────────────────────────
// Create a Stripe Checkout session to start or change a subscription.
router.post('/checkout', requireAuth, requireRole('brand'), async (req: Request, res: Response) => {
  const schema = z.object({ tier: z.enum(['starter', 'growth', 'scale']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'tier must be starter, growth, or scale' });
  }
  const { tier } = parsed.data as { tier: SubscriptionTier };

  const [brand] = await db
    .select({ id: brands.id, email: brands.email, name: brands.name, stripeCustomerId: brands.stripeCustomerId })
    .from(brands)
    .where(eq(brands.id, req.auth!.sub))
    .limit(1);

  if (!brand) return res.status(404).json({ error: 'Brand not found' });

  try {
    let customerId = brand.stripeCustomerId;
    if (!customerId) {
      customerId = await ensureStripeCustomer(brand.id, brand.email, brand.name);
      await db.update(brands).set({ stripeCustomerId: customerId, updatedAt: new Date() }).where(eq(brands.id, brand.id));
    }

    const url = await createCheckoutSession({
      stripeCustomerId: customerId,
      tier,
      brandId: brand.id,
      successUrl: `${WEB_URL}/brand/dashboard?billing=success&tier=${tier}`,
      cancelUrl: `${WEB_URL}/brand/dashboard?billing=cancelled`,
    });

    return res.json({ url });
  } catch (err: any) {
    console.error('[billing] checkout error:', err.message);
    return res.status(502).json({ error: 'Failed to create checkout session', detail: err.message });
  }
});

// ── POST /api/billing/portal ──────────────────────────────────────────────────
// Create a Stripe Billing Portal session for managing subscription.
router.post('/portal', requireAuth, requireRole('brand'), async (req: Request, res: Response) => {
  const [brand] = await db
    .select({ stripeCustomerId: brands.stripeCustomerId })
    .from(brands)
    .where(eq(brands.id, req.auth!.sub))
    .limit(1);

  if (!brand?.stripeCustomerId) {
    return res.status(409).json({ error: 'No active subscription — use /api/billing/checkout to subscribe' });
  }

  try {
    const url = await createBillingPortalSession(
      brand.stripeCustomerId,
      `${WEB_URL}/brand/dashboard`,
    );
    return res.json({ url });
  } catch (err: any) {
    console.error('[billing] portal error:', err.message);
    return res.status(502).json({ error: 'Failed to create billing portal session', detail: err.message });
  }
});

// stripeWebhookHandler is exported and mounted separately in index.ts with raw body middleware.
export async function stripeWebhookHandler(req: Request, res: Response) {
  const signature = req.headers['stripe-signature'] as string;
  if (!signature) return res.status(400).json({ error: 'Missing stripe-signature header' });

  let event;
  try {
    event = constructWebhookEvent(req.body as Buffer, signature);
  } catch (err: any) {
    console.error('[billing] webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  try {
    await handleStripeEvent(event);
    return res.json({ received: true });
  } catch (err: any) {
    console.error('[billing] webhook handler error:', err.message);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}

async function handleStripeEvent(event: import('stripe').Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as import('stripe').Stripe.Checkout.Session;
      if (session.mode !== 'subscription') break;

      const brandId = session.metadata?.brandId;
      const tier = session.metadata?.tier as SubscriptionTier | undefined;
      const subscriptionId = session.subscription as string;

      if (!brandId || !tier) {
        console.error('[billing] checkout.session.completed missing metadata', session.id);
        break;
      }

      const limit = SUBSCRIPTION_TIERS[tier]?.partnershipLimit ?? 0;

      await db.update(brands).set({
        stripeSubscriptionId: subscriptionId,
        subscriptionTier: tier,
        subscriptionStatus: 'active',
        partnershipLimit: limit,
        updatedAt: new Date(),
      }).where(eq(brands.id, brandId));

      console.log(`[billing] brand ${brandId} subscribed to ${tier} (limit: ${limit})`);
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as import('stripe').Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;
      if (!subscriptionId) break;

      await db.update(brands).set({
        subscriptionStatus: 'active',
        updatedAt: new Date(),
      }).where(eq(brands.stripeSubscriptionId, subscriptionId));

      console.log(`[billing] invoice.paid for subscription ${subscriptionId}`);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as import('stripe').Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;
      if (!subscriptionId) break;

      await db.update(brands).set({
        subscriptionStatus: 'past_due',
        updatedAt: new Date(),
      }).where(eq(brands.stripeSubscriptionId, subscriptionId));

      console.log(`[billing] invoice.payment_failed for subscription ${subscriptionId}`);
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as import('stripe').Stripe.Subscription;
      const tier = subscription.metadata?.tier as SubscriptionTier | undefined;
      const limit = tier ? SUBSCRIPTION_TIERS[tier]?.partnershipLimit ?? 0 : undefined;

      const update: Record<string, any> = {
        subscriptionStatus: subscription.status,
        updatedAt: new Date(),
      };
      if (tier) { update.subscriptionTier = tier; update.partnershipLimit = limit; }

      await db.update(brands).set(update).where(eq(brands.stripeSubscriptionId, subscription.id));
      console.log(`[billing] subscription ${subscription.id} updated → ${subscription.status}`);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as import('stripe').Stripe.Subscription;
      await db.update(brands).set({
        subscriptionStatus: 'cancelled',
        partnershipLimit: 0,
        updatedAt: new Date(),
      }).where(eq(brands.stripeSubscriptionId, subscription.id));

      console.log(`[billing] subscription ${subscription.id} cancelled`);
      break;
    }

    default:
      // Ignore unhandled event types
      break;
  }
}

export default router;
