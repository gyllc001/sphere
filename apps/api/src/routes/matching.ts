import { Router, Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { campaigns } from '../db/schema';
import { requireAuth, requireRole } from '../middleware/auth';
import { runMatching } from '../services/matching';

const router = Router();

const TriggerMatchSchema = z.object({
  topN: z.number().int().min(1).max(50).optional().default(10),
  threshold: z.number().int().min(0).max(100).optional().default(40),
});

// POST /api/campaigns/:id/match — trigger AI matching for a campaign
// Brand must own the campaign and it must be in 'active' status
router.post('/:id/match', requireAuth, requireRole('brand'), async (req: Request, res: Response) => {
  const parsed = TriggerMatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, req.params.id), eq(campaigns.brandId, req.auth!.sub)))
    .limit(1);

  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  if (!['active', 'matching'].includes(campaign.status)) {
    return res.status(409).json({ error: `Campaign must be 'active' to run matching (current: '${campaign.status}')` });
  }

  const matches = await runMatching(req.params.id, parsed.data.topN, parsed.data.threshold);

  return res.json({
    campaignId: req.params.id,
    matchesFound: matches.length,
    matches,
  });
});

// GET /api/campaigns/:id/matches — get existing match results (partnership requests) for a campaign
router.get('/:id/matches', requireAuth, requireRole('brand'), async (req: Request, res: Response) => {
  const [campaign] = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(and(eq(campaigns.id, req.params.id), eq(campaigns.brandId, req.auth!.sub)))
    .limit(1);

  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

  // Reuse the partnerships endpoint logic — redirect internally isn't great, so inline it
  const { partnershipRequests, communities } = await import('../db/schema');
  const results = await db
    .select({
      requestId: partnershipRequests.id,
      status: partnershipRequests.status,
      matchScore: partnershipRequests.matchScore,
      matchRationale: partnershipRequests.matchRationale,
      proposedRateCents: partnershipRequests.proposedRateCents,
      communityId: communities.id,
      communityName: communities.name,
      communityPlatform: communities.platform,
      memberCount: communities.memberCount,
      niche: communities.niche,
    })
    .from(partnershipRequests)
    .innerJoin(communities, eq(partnershipRequests.communityId, communities.id))
    .where(eq(partnershipRequests.campaignId, req.params.id))
    .orderBy(partnershipRequests.matchScore);

  return res.json(results);
});

export default router;
