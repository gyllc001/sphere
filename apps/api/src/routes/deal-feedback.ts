import { Router, Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { deals, campaigns, communities } from '../db/schema';
import { dealFeedback } from '../db/schema/deal-feedback';
import { requireAuth } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.use(requireAuth);

const feedbackSchema = z.object({
  dealQuality: z.number().int().min(1).max(5),
  easeOfUse: z.number().int().min(1).max(5),
  repeatIntent: z.enum(['yes', 'no', 'maybe']),
  openText: z.string().max(2000).optional(),
});

/**
 * GET /api/deals/:dealId/feedback/me
 * Returns the caller's existing feedback for this deal, or null if not yet submitted.
 */
router.get('/me', async (req: Request, res: Response) => {
  const { dealId } = req.params;
  const userId = req.auth!.sub;

  const [existing] = await db
    .select()
    .from(dealFeedback)
    .where(and(eq(dealFeedback.dealId, dealId), eq(dealFeedback.userId, userId)))
    .limit(1);

  return res.json(existing ?? null);
});

/**
 * POST /api/deals/:dealId/feedback
 * Submit post-deal feedback. Deal must be completed. One submission per user per deal.
 */
router.post('/', async (req: Request, res: Response) => {
  const { dealId } = req.params;
  const userId = req.auth!.sub;
  const userRole = req.auth!.role; // 'brand' | 'community_owner'

  // Validate body
  const parsed = feedbackSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid feedback data', details: parsed.error.flatten() });
  }

  // Fetch the deal
  const [deal] = await db.select().from(deals).where(eq(deals.id, dealId)).limit(1);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });
  if (deal.status !== 'completed') {
    return res.status(409).json({ error: 'Feedback can only be submitted for completed deals' });
  }

  // Verify caller is a party to this deal
  const [campaign] = await db
    .select({ brandId: campaigns.brandId })
    .from(campaigns)
    .where(eq(campaigns.id, deal.campaignId))
    .limit(1);
  const [community] = await db
    .select({ ownerId: communities.ownerId })
    .from(communities)
    .where(eq(communities.id, deal.communityId))
    .limit(1);

  const isBrand = userRole === 'brand' && campaign?.brandId === userId;
  const isOwner = userRole === 'community_owner' && community?.ownerId === userId;

  if (!isBrand && !isOwner) return res.status(403).json({ error: 'Forbidden' });

  // Check for existing submission (unique constraint guard)
  const [existing] = await db
    .select({ id: dealFeedback.id })
    .from(dealFeedback)
    .where(and(eq(dealFeedback.dealId, dealId), eq(dealFeedback.userId, userId)))
    .limit(1);

  if (existing) {
    return res.status(409).json({ error: 'You have already submitted feedback for this deal' });
  }

  const [created] = await db
    .insert(dealFeedback)
    .values({
      dealId,
      userId,
      userRole,
      dealQuality: parsed.data.dealQuality,
      easeOfUse: parsed.data.easeOfUse,
      repeatIntent: parsed.data.repeatIntent,
      openText: parsed.data.openText ?? null,
    })
    .returning();

  return res.status(201).json(created);
});

export default router;
