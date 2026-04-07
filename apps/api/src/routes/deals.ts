import { Router, Request, Response } from 'express';
import { eq, and, or } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { deals, campaigns, communities } from '../db/schema';
import { requireAuth } from '../middleware/auth';
import { advanceNegotiation, generateContract } from '../services/negotiation';

const router = Router();

// All deal routes require auth (brand or community_owner)
router.use(requireAuth);

/**
 * GET /api/deals/:id
 * Both brands and community owners can view deals they're party to.
 */
router.get('/:id', async (req: Request, res: Response) => {
  const [deal] = await db.select().from(deals).where(eq(deals.id, req.params.id)).limit(1);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });

  // Verify caller is party to this deal
  const [campaign] = await db.select({ brandId: campaigns.brandId }).from(campaigns).where(eq(campaigns.id, deal.campaignId)).limit(1);
  const [community] = await db.select({ ownerId: communities.ownerId }).from(communities).where(eq(communities.id, deal.communityId)).limit(1);

  const isBrand = req.auth!.role === 'brand' && campaign?.brandId === req.auth!.sub;
  const isOwner = req.auth!.role === 'community_owner' && community?.ownerId === req.auth!.sub;

  if (!isBrand && !isOwner) return res.status(403).json({ error: 'Forbidden' });
  return res.json(deal);
});

/**
 * POST /api/deals/:id/negotiate
 * Triggers the brand-side AI negotiation step.
 * Only the brand party can trigger this.
 */
router.post('/:id/negotiate', async (req: Request, res: Response) => {
  if (req.auth!.role !== 'brand') return res.status(403).json({ error: 'Only brands can trigger AI negotiation' });

  const [deal] = await db.select().from(deals).where(eq(deals.id, req.params.id)).limit(1);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });

  const [campaign] = await db.select({ brandId: campaigns.brandId }).from(campaigns).where(eq(campaigns.id, deal.campaignId)).limit(1);
  if (campaign?.brandId !== req.auth!.sub) return res.status(403).json({ error: 'Forbidden' });

  try {
    const decision = await advanceNegotiation(req.params.id);
    return res.json(decision);
  } catch (err: any) {
    return res.status(409).json({ error: err.message });
  }
});

/**
 * POST /api/deals/:id/contract
 * Generate and "send" the contract. Requires deal status = 'agreed'.
 */
router.post('/:id/contract', async (req: Request, res: Response) => {
  if (req.auth!.role !== 'brand') return res.status(403).json({ error: 'Only brands can generate contracts' });

  const [deal] = await db.select().from(deals).where(eq(deals.id, req.params.id)).limit(1);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });

  const [campaign] = await db.select({ brandId: campaigns.brandId }).from(campaigns).where(eq(campaigns.id, deal.campaignId)).limit(1);
  if (campaign?.brandId !== req.auth!.sub) return res.status(403).json({ error: 'Forbidden' });

  try {
    const contractText = await generateContract(req.params.id);
    return res.json({ contractText, status: 'contract_sent' });
  } catch (err: any) {
    return res.status(409).json({ error: err.message });
  }
});

/**
 * POST /api/deals/:id/payment
 * STUB: Initiate escrow payment for a signed deal.
 * Brand provides a paymentIntentId (from Stripe); we record it and set paymentStatus=escrowed.
 * In production this will verify the PaymentIntent via Stripe API before escrowing.
 */
router.post('/:id/payment', async (req: Request, res: Response) => {
  if (req.auth!.role !== 'brand') return res.status(403).json({ error: 'Only brands can initiate payments' });

  const [deal] = await db.select().from(deals).where(eq(deals.id, req.params.id)).limit(1);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });
  if (deal.status !== 'signed') return res.status(409).json({ error: `Deal must be signed before payment (current: ${deal.status})` });

  const [campaign] = await db.select({ brandId: campaigns.brandId }).from(campaigns).where(eq(campaigns.id, deal.campaignId)).limit(1);
  if (campaign?.brandId !== req.auth!.sub) return res.status(403).json({ error: 'Forbidden' });

  // STUB: In production, verify paymentIntentId with Stripe and confirm funds held
  const stubPaymentIntentId = `pi_stub_${Date.now()}`;

  const [updated] = await db.update(deals).set({
    paymentStatus: 'escrowed',
    stripePaymentIntentId: stubPaymentIntentId,
    paidAt: new Date(),
    status: 'active',
    updatedAt: new Date(),
  }).where(eq(deals.id, req.params.id)).returning();

  return res.json({
    deal: updated,
    payment: {
      paymentIntentId: stubPaymentIntentId,
      amount: deal.agreedRateCents,
      currency: 'usd',
      status: 'escrowed',
      // STUB: real Stripe response fields would appear here
      _stub: true,
      _message: 'Payment escrowed. In production, funds are held in Stripe until deal completion.',
    },
  });
});

/**
 * POST /api/deals/:id/payout
 * STUB: Release escrowed funds to the community owner on deal completion.
 * In production this triggers a Stripe Connect transfer to the community owner's connected account.
 */
router.post('/:id/payout', async (req: Request, res: Response) => {
  if (req.auth!.role !== 'brand') return res.status(403).json({ error: 'Only brands can trigger payouts' });

  const [deal] = await db.select().from(deals).where(eq(deals.id, req.params.id)).limit(1);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });
  if (deal.paymentStatus !== 'escrowed') return res.status(409).json({ error: `Deal payment must be escrowed before payout (current: ${deal.paymentStatus})` });

  const [campaign] = await db.select({ brandId: campaigns.brandId }).from(campaigns).where(eq(campaigns.id, deal.campaignId)).limit(1);
  if (campaign?.brandId !== req.auth!.sub) return res.status(403).json({ error: 'Forbidden' });

  // STUB: In production, execute Stripe Connect transfer to community owner's account
  const stubTransferId = `tr_stub_${Date.now()}`;

  const [updated] = await db.update(deals).set({
    paymentStatus: 'released',
    stripeTransferId: stubTransferId,
    payoutAt: new Date(),
    status: 'completed',
    completedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(deals.id, req.params.id)).returning();

  return res.json({
    deal: updated,
    payout: {
      transferId: stubTransferId,
      amount: deal.agreedRateCents,
      currency: 'usd',
      status: 'released',
      // STUB: real Stripe Connect transfer fields would appear here
      _stub: true,
      _message: 'Payout released. In production, funds transferred via Stripe Connect to community owner.',
    },
  });
});

/**
 * PATCH /api/deals/:id/sign
 * Mark a deal as signed by the community owner.
 */
router.patch('/:id/sign', async (req: Request, res: Response) => {
  if (req.auth!.role !== 'community_owner') return res.status(403).json({ error: 'Only community owners can sign deals' });

  const [deal] = await db.select().from(deals).where(eq(deals.id, req.params.id)).limit(1);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });
  if (deal.status !== 'contract_sent') return res.status(409).json({ error: `Deal must be in 'contract_sent' status to sign (current: ${deal.status})` });

  const [community] = await db.select({ ownerId: communities.ownerId }).from(communities).where(eq(communities.id, deal.communityId)).limit(1);
  if (community?.ownerId !== req.auth!.sub) return res.status(403).json({ error: 'Forbidden' });

  const [updated] = await db.update(deals).set({
    status: 'signed',
    signedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(deals.id, req.params.id)).returning();

  return res.json(updated);
});

export default router;
