import { Router, Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { campaigns, partnershipRequests, deals, communities, communityOwners } from '../db/schema';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// All campaign routes require brand auth
router.use(requireAuth, requireRole('brand'));

const CreateCampaignSchema = z.object({
  title: z.string().min(1).max(255),
  brief: z.string().min(1),
  objectives: z.string().optional(),
  targetAudience: z.string().optional(),
  niche: z.string().max(100).optional(),
  minCommunitySize: z.number().int().positive().optional(),
  budgetCents: z.number().int().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const UpdateCampaignSchema = CreateCampaignSchema.partial().extend({
  status: z.enum(['draft', 'active', 'matching', 'in_progress', 'completed', 'cancelled']).optional(),
});

// POST /api/campaigns — create a campaign brief
router.post('/', async (req: Request, res: Response) => {
  const parsed = CreateCampaignSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }
  const data = parsed.data;
  const [campaign] = await db.insert(campaigns).values({
    brandId: req.auth!.sub,
    title: data.title,
    brief: data.brief,
    objectives: data.objectives,
    targetAudience: data.targetAudience,
    niche: data.niche,
    minCommunitySize: data.minCommunitySize,
    budgetCents: data.budgetCents,
    startDate: data.startDate ? new Date(data.startDate) : undefined,
    endDate: data.endDate ? new Date(data.endDate) : undefined,
  }).returning();

  return res.status(201).json(campaign);
});

// GET /api/campaigns — list all campaigns for the authenticated brand
router.get('/', async (req: Request, res: Response) => {
  const results = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.brandId, req.auth!.sub))
    .orderBy(campaigns.createdAt);

  return res.json(results);
});

// GET /api/campaigns/:id — get a single campaign (must belong to brand)
router.get('/:id', async (req: Request, res: Response) => {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, req.params.id), eq(campaigns.brandId, req.auth!.sub)))
    .limit(1);

  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  return res.json(campaign);
});

// PATCH /api/campaigns/:id — update campaign
router.patch('/:id', async (req: Request, res: Response) => {
  const parsed = UpdateCampaignSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const [existing] = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(and(eq(campaigns.id, req.params.id), eq(campaigns.brandId, req.auth!.sub)))
    .limit(1);
  if (!existing) return res.status(404).json({ error: 'Campaign not found' });

  const data = parsed.data;
  const [updated] = await db
    .update(campaigns)
    .set({
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(campaigns.id, req.params.id))
    .returning();

  return res.json(updated);
});

// GET /api/campaigns/:id/partnerships — view partnership requests and deal status for a campaign
router.get('/:id/partnerships', async (req: Request, res: Response) => {
  const [campaign] = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(and(eq(campaigns.id, req.params.id), eq(campaigns.brandId, req.auth!.sub)))
    .limit(1);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

  const requests = await db
    .select({
      requestId: partnershipRequests.id,
      status: partnershipRequests.status,
      matchScore: partnershipRequests.matchScore,
      matchRationale: partnershipRequests.matchRationale,
      proposedRateCents: partnershipRequests.proposedRateCents,
      message: partnershipRequests.message,
      communityId: communities.id,
      communityName: communities.name,
      communityPlatform: communities.platform,
      communityMemberCount: communities.memberCount,
      communityAdminDiscordUserId: communities.adminDiscordUserId,
      communityAdminPhone: communities.adminPhone,
      communityAdminFacebookPageId: communities.adminFacebookPageId,
      ownerName: communityOwners.name,
    })
    .from(partnershipRequests)
    .innerJoin(communities, eq(partnershipRequests.communityId, communities.id))
    .innerJoin(communityOwners, eq(communities.ownerId, communityOwners.id))
    .where(eq(partnershipRequests.campaignId, req.params.id));

  // Attach deal info where available
  const requestIds = requests.map((r) => r.requestId);
  let dealsMap: Record<string, typeof deals.$inferSelect> = {};
  if (requestIds.length > 0) {
    const dealRows = await db.select().from(deals).where(eq(deals.campaignId, req.params.id));
    dealsMap = Object.fromEntries(dealRows.map((d) => [d.partnershipRequestId, d]));
  }

  const enriched = requests.map((r) => ({
    ...r,
    deal: dealsMap[r.requestId] ?? null,
  }));

  return res.json(enriched);
});

// GET /api/campaigns/dashboard — aggregated dashboard view
router.get('/dashboard/summary', async (req: Request, res: Response) => {
  const allCampaigns = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.brandId, req.auth!.sub));

  const summary = {
    total: allCampaigns.length,
    byStatus: allCampaigns.reduce<Record<string, number>>((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {}),
    campaigns: allCampaigns,
  };

  return res.json(summary);
});

export default router;
