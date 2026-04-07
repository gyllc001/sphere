import { Router, Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { communities, communityOwners, partnershipRequests, campaigns, brands, deals } from '../db/schema';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth, requireRole('community_owner'));

// ──────────────────────────────────────────────
// Community management
// ──────────────────────────────────────────────

const CommunitySchema = z.object({
  name: z.string().min(1).max(255),
  platform: z.enum(['discord', 'slack', 'telegram', 'whatsapp', 'facebook_group', 'reddit', 'circle', 'mighty_networks', 'other']),
  platformUrl: z.string().url().optional(),
  niche: z.string().max(100).optional(),
  description: z.string().optional(),
  memberCount: z.number().int().min(0).optional(),
  engagementRate: z.string().max(20).optional(),
  audienceDemographics: z.string().optional(),
  baseRate: z.number().int().positive().optional(),
});

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// POST /api/owner/communities — create a community listing
router.post('/communities', async (req: Request, res: Response) => {
  const parsed = CommunitySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }
  const data = parsed.data;
  const slug = `${toSlug(data.name)}-${Date.now()}`;

  const [community] = await db.insert(communities).values({
    ownerId: req.auth!.sub,
    name: data.name,
    slug,
    platform: data.platform,
    platformUrl: data.platformUrl,
    niche: data.niche,
    description: data.description,
    memberCount: data.memberCount ?? 0,
    engagementRate: data.engagementRate,
    audienceDemographics: data.audienceDemographics,
    baseRate: data.baseRate,
  }).returning();

  return res.status(201).json(community);
});

// GET /api/owner/communities — list communities owned by this user
router.get('/communities', async (req: Request, res: Response) => {
  const results = await db
    .select()
    .from(communities)
    .where(eq(communities.ownerId, req.auth!.sub));
  return res.json(results);
});

// PATCH /api/owner/communities/:id — update listing
router.patch('/communities/:id', async (req: Request, res: Response) => {
  const parsed = CommunitySchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const [existing] = await db
    .select({ id: communities.id })
    .from(communities)
    .where(and(eq(communities.id, req.params.id), eq(communities.ownerId, req.auth!.sub)))
    .limit(1);
  if (!existing) return res.status(404).json({ error: 'Community not found' });

  const [updated] = await db
    .update(communities)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(communities.id, req.params.id))
    .returning();

  return res.json(updated);
});

// ──────────────────────────────────────────────
// Inbound opportunities
// ──────────────────────────────────────────────

// GET /api/owner/opportunities — all inbound partnership requests across owner's communities
router.get('/opportunities', async (req: Request, res: Response) => {
  // Get owner's community ids
  const ownerCommunities = await db
    .select({ id: communities.id, name: communities.name })
    .from(communities)
    .where(eq(communities.ownerId, req.auth!.sub));

  if (ownerCommunities.length === 0) return res.json([]);

  const communityIds = ownerCommunities.map((c) => c.id);

  // Fetch partnership requests for those communities
  const results = await db
    .select({
      requestId: partnershipRequests.id,
      requestStatus: partnershipRequests.status,
      matchScore: partnershipRequests.matchScore,
      matchRationale: partnershipRequests.matchRationale,
      proposedRateCents: partnershipRequests.proposedRateCents,
      message: partnershipRequests.message,
      initiatedByAi: partnershipRequests.initiatedByAi,
      createdAt: partnershipRequests.createdAt,
      communityId: communities.id,
      communityName: communities.name,
      campaignId: campaigns.id,
      campaignTitle: campaigns.title,
      campaignBrief: campaigns.brief,
      campaignNiche: campaigns.niche,
      brandId: brands.id,
      brandName: brands.name,
    })
    .from(partnershipRequests)
    .innerJoin(communities, eq(partnershipRequests.communityId, communities.id))
    .innerJoin(campaigns, eq(partnershipRequests.campaignId, campaigns.id))
    .innerJoin(brands, eq(campaigns.brandId, brands.id))
    .where(eq(communities.ownerId, req.auth!.sub));

  return res.json(results);
});

// ──────────────────────────────────────────────
// Accept / decline / counter-offer
// ──────────────────────────────────────────────

const RespondSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('accept') }),
  z.object({ action: z.literal('decline'), reason: z.string().optional() }),
  z.object({ action: z.literal('counter'), counterRateCents: z.number().int().positive(), message: z.string().optional() }),
]);

// POST /api/owner/opportunities/:requestId/respond
router.post('/opportunities/:requestId/respond', async (req: Request, res: Response) => {
  const parsed = RespondSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  // Verify this request belongs to one of the owner's communities
  const [request] = await db
    .select()
    .from(partnershipRequests)
    .innerJoin(communities, eq(partnershipRequests.communityId, communities.id))
    .where(and(eq(partnershipRequests.id, req.params.requestId), eq(communities.ownerId, req.auth!.sub)))
    .limit(1);

  if (!request) return res.status(404).json({ error: 'Opportunity not found' });
  if (request.partnership_requests.status !== 'pending') {
    return res.status(409).json({ error: `Cannot respond to a request with status '${request.partnership_requests.status}'` });
  }

  const data = parsed.data;

  if (data.action === 'accept') {
    // Update request to accepted and create a deal
    await db
      .update(partnershipRequests)
      .set({ status: 'accepted', updatedAt: new Date() })
      .where(eq(partnershipRequests.id, req.params.requestId));

    const [deal] = await db.insert(deals).values({
      partnershipRequestId: req.params.requestId,
      campaignId: request.partnership_requests.campaignId,
      communityId: request.partnership_requests.communityId,
      agreedRateCents: request.partnership_requests.proposedRateCents ?? 0,
      status: 'agreed',
    }).returning();

    return res.json({ action: 'accept', deal });

  } else if (data.action === 'decline') {
    await db
      .update(partnershipRequests)
      .set({ status: 'rejected', message: data.reason ?? request.partnership_requests.message, updatedAt: new Date() })
      .where(eq(partnershipRequests.id, req.params.requestId));

    return res.json({ action: 'decline' });

  } else {
    // counter — update proposed rate, keep pending, append to negotiation log
    const existingLog = (() => {
      try { return JSON.parse('[]'); } catch { return []; }
    })();
    const log = [
      ...existingLog,
      { from: 'community_owner', counterRateCents: data.counterRateCents, message: data.message, at: new Date().toISOString() },
    ];

    await db
      .update(partnershipRequests)
      .set({
        proposedRateCents: data.counterRateCents,
        message: data.message,
        updatedAt: new Date(),
      })
      .where(eq(partnershipRequests.id, req.params.requestId));

    return res.json({ action: 'counter', newProposedRateCents: data.counterRateCents, log });
  }
});

export default router;
