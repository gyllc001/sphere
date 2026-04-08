import { Router, Request, Response } from 'express';
import { eq, and, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { communities, communityOwners, partnershipRequests, campaigns, brands, deals, campaignApplications, COMMUNITY_TOPIC_CATEGORIES } from '../db/schema';
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
  adminDiscordUserId: z.string().max(50).optional(),
  adminPhone: z.string().max(50).optional(),
  adminFacebookPageId: z.string().max(100).optional(),
  vertical: z.enum(['Tech', 'Gaming', 'Fashion', 'Mom', 'Finance', 'Health', 'Food', 'Travel', 'Other']).optional(),
  // Collab preferences (stored as JSON arrays)
  contentTypesAccepted: z.array(z.string()).optional(),
  topicsExcluded: z.array(z.string()).optional(),
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
    adminDiscordUserId: data.adminDiscordUserId,
    adminPhone: data.adminPhone,
    adminFacebookPageId: data.adminFacebookPageId,
    vertical: data.vertical,
    contentTypesAccepted: data.contentTypesAccepted ? JSON.stringify(data.contentTypesAccepted) : undefined,
    topicsExcluded: data.topicsExcluded ? JSON.stringify(data.topicsExcluded) : undefined,
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

  const { contentTypesAccepted, topicsExcluded, ...rest } = parsed.data;
  const [updated] = await db
    .update(communities)
    .set({
      ...rest,
      ...(contentTypesAccepted !== undefined ? { contentTypesAccepted: JSON.stringify(contentTypesAccepted) } : {}),
      ...(topicsExcluded !== undefined ? { topicsExcluded: JSON.stringify(topicsExcluded) } : {}),
      updatedAt: new Date(),
    })
    .where(eq(communities.id, req.params.id))
    .returning();

  return res.json(updated);
});

// ──────────────────────────────────────────────
// Community content topics (brand safety)
// ──────────────────────────────────────────────

const TopicsSchema = z.object({
  topics: z.array(z.enum(COMMUNITY_TOPIC_CATEGORIES as unknown as [string, ...string[]])).max(20),
});

// GET /api/owner/communities/:id/topics
router.get('/communities/:id/topics', async (req: Request, res: Response) => {
  const [community] = await db
    .select({ id: communities.id, contentTopics: communities.contentTopics })
    .from(communities)
    .where(and(eq(communities.id, req.params.id), eq(communities.ownerId, req.auth!.sub)))
    .limit(1);

  if (!community) return res.status(404).json({ error: 'Community not found' });
  return res.json({ topics: community.contentTopics ?? [], availableTopics: COMMUNITY_TOPIC_CATEGORIES });
});

// PUT /api/owner/communities/:id/topics
router.put('/communities/:id/topics', async (req: Request, res: Response) => {
  const parsed = TopicsSchema.safeParse(req.body);
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
    .set({ contentTopics: [...new Set(parsed.data.topics)], updatedAt: new Date() })
    .where(eq(communities.id, req.params.id))
    .returning({ id: communities.id, contentTopics: communities.contentTopics });

  return res.json({ topics: updated.contentTopics ?? [], availableTopics: COMMUNITY_TOPIC_CATEGORIES });
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
    // Check brand's partnership tier limit before creating a deal
    const campaign = await db
      .select({ brandId: campaigns.brandId })
      .from(campaigns)
      .where(eq(campaigns.id, request.partnership_requests.campaignId))
      .limit(1);
    const brandId = campaign[0]?.brandId;

    if (brandId) {
      const [brandRow] = await db
        .select({ partnershipLimit: brands.partnershipLimit })
        .from(brands)
        .where(eq(brands.id, brandId))
        .limit(1);

      const limit = brandRow?.partnershipLimit ?? 0;
      if (limit > 0) {
        const brandCampaigns = await db
          .select({ id: campaigns.id })
          .from(campaigns)
          .where(eq(campaigns.brandId, brandId));
        const brandCampaignIds = brandCampaigns.map((c) => c.id);

        if (brandCampaignIds.length > 0) {
          const { count } = await import('drizzle-orm');
          const [activeCount] = await db
            .select({ cnt: count() })
            .from(deals)
            .where(
              and(
                inArray(deals.campaignId, brandCampaignIds),
                inArray(deals.status, ['negotiating', 'agreed', 'contract_sent', 'signed', 'active'])
              )
            );
          if (Number(activeCount?.cnt ?? 0) >= limit) {
            return res.status(403).json({
              error: `The brand's partnership limit has been reached for their subscription tier (${limit} active partnerships).`,
              partnershipLimit: limit,
            });
          }
        }
      }
    }

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

// ──────────────────────────────────────────────
// Marketplace: browse open campaigns & apply
// ──────────────────────────────────────────────

// GET /api/owner/browse-campaigns — list active campaigns visible to community owners
// Optional query: niche, maxBudget, minBudget
router.get('/browse-campaigns', async (req: Request, res: Response) => {
  const { niche, minBudget, maxBudget } = req.query as Record<string, string | undefined>;

  let query = db
    .select({
      id: campaigns.id,
      title: campaigns.title,
      brief: campaigns.brief,
      objectives: campaigns.objectives,
      targetAudience: campaigns.targetAudience,
      niche: campaigns.niche,
      minCommunitySize: campaigns.minCommunitySize,
      budgetCents: campaigns.budgetCents,
      status: campaigns.status,
      startDate: campaigns.startDate,
      endDate: campaigns.endDate,
      createdAt: campaigns.createdAt,
      brandName: brands.name,
      brandId: brands.id,
    })
    .from(campaigns)
    .innerJoin(brands, eq(campaigns.brandId, brands.id))
    .where(eq(campaigns.status, 'active'))
    .$dynamic();

  const results = await query.orderBy(campaigns.createdAt);

  // Filter in JS for simplicity (avoids complex dynamic SQL)
  let filtered = results;
  if (niche) {
    filtered = filtered.filter((c) => c.niche?.toLowerCase().includes(niche.toLowerCase()));
  }
  if (minBudget) {
    const min = parseInt(minBudget) * 100;
    filtered = filtered.filter((c) => c.budgetCents != null && c.budgetCents >= min);
  }
  if (maxBudget) {
    const max = parseInt(maxBudget) * 100;
    filtered = filtered.filter((c) => c.budgetCents == null || c.budgetCents <= max);
  }

  // Attach owner's existing application status for each campaign
  const ownerCommunities = await db
    .select({ id: communities.id })
    .from(communities)
    .where(eq(communities.ownerId, req.auth!.sub));

  const communityIds = ownerCommunities.map((c) => c.id);
  let applicationMap: Record<string, { status: string; applicationId: string }> = {};

  if (communityIds.length > 0) {
    const apps = await db
      .select({
        campaignId: campaignApplications.campaignId,
        applicationId: campaignApplications.id,
        status: campaignApplications.status,
      })
      .from(campaignApplications)
      .where(inArray(campaignApplications.communityId, communityIds));

    for (const a of apps) {
      applicationMap[a.campaignId] = { status: a.status, applicationId: a.applicationId };
    }
  }

  const enriched = filtered.map((c) => ({
    ...c,
    myApplication: applicationMap[c.id] ?? null,
  }));

  return res.json(enriched);
});

const ApplySchema = z.object({
  communityId: z.string().uuid(),
  pitch: z.string().min(1).max(2000),
  proposedRateCents: z.number().int().positive().optional(),
});

// POST /api/owner/campaigns/:campaignId/apply
router.post('/campaigns/:campaignId/apply', async (req: Request, res: Response) => {
  const parsed = ApplySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }
  const { communityId, pitch, proposedRateCents } = parsed.data;

  // Verify community belongs to this owner
  const [community] = await db
    .select({ id: communities.id })
    .from(communities)
    .where(and(eq(communities.id, communityId), eq(communities.ownerId, req.auth!.sub)))
    .limit(1);
  if (!community) return res.status(403).json({ error: 'Community not found or not owned by you' });

  // Verify campaign is active
  const [campaign] = await db
    .select({ id: campaigns.id, status: campaigns.status })
    .from(campaigns)
    .where(eq(campaigns.id, req.params.campaignId))
    .limit(1);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  if (campaign.status !== 'active') {
    return res.status(409).json({ error: 'Campaign is not accepting applications' });
  }

  // Check for duplicate application
  const [existing] = await db
    .select({ id: campaignApplications.id })
    .from(campaignApplications)
    .where(
      and(
        eq(campaignApplications.campaignId, req.params.campaignId),
        eq(campaignApplications.communityId, communityId)
      )
    )
    .limit(1);
  if (existing) {
    return res.status(409).json({ error: 'You have already applied to this campaign with this community' });
  }

  const [application] = await db
    .insert(campaignApplications)
    .values({
      campaignId: req.params.campaignId,
      communityId,
      pitch,
      proposedRateCents,
    })
    .returning();

  return res.status(201).json(application);
});

// GET /api/owner/my-applications — list all applications from owner's communities
router.get('/my-applications', async (req: Request, res: Response) => {
  const ownerCommunities = await db
    .select({ id: communities.id, name: communities.name })
    .from(communities)
    .where(eq(communities.ownerId, req.auth!.sub));

  if (ownerCommunities.length === 0) return res.json([]);

  const communityIds = ownerCommunities.map((c) => c.id);

  const results = await db
    .select({
      applicationId: campaignApplications.id,
      status: campaignApplications.status,
      pitch: campaignApplications.pitch,
      proposedRateCents: campaignApplications.proposedRateCents,
      brandNote: campaignApplications.brandNote,
      dealId: campaignApplications.dealId,
      createdAt: campaignApplications.createdAt,
      updatedAt: campaignApplications.updatedAt,
      communityId: communities.id,
      communityName: communities.name,
      campaignId: campaigns.id,
      campaignTitle: campaigns.title,
      campaignNiche: campaigns.niche,
      campaignBudgetCents: campaigns.budgetCents,
      campaignStatus: campaigns.status,
      brandId: brands.id,
      brandName: brands.name,
    })
    .from(campaignApplications)
    .innerJoin(communities, eq(campaignApplications.communityId, communities.id))
    .innerJoin(campaigns, eq(campaignApplications.campaignId, campaigns.id))
    .innerJoin(brands, eq(campaigns.brandId, brands.id))
    .where(inArray(campaignApplications.communityId, communityIds))
    .orderBy(campaignApplications.createdAt);

  return res.json(results);
});

export default router;
