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
