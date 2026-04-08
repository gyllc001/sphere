import { Router, Request, Response } from 'express';
import { eq, and, count, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { campaigns, partnershipRequests, deals, communities, communityOwners, campaignApplications } from '../db/schema';
import { requireAuth, requireRole } from '../middleware/auth';
import { runMatching } from '../services/matching';

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

  // Check whether this brand already has campaigns (before insert)
  const [existingCount] = await db
    .select({ cnt: count() })
    .from(campaigns)
    .where(eq(campaigns.brandId, req.auth!.sub));
  const isFirstCampaign = Number(existingCount?.cnt ?? 0) === 0;

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

  // New-brand acquisition: trigger matching immediately for the first campaign.
  // notifyAll=true sends brand-acquisition emails to ALL matched community owners (not just first-timers).
  if (isFirstCampaign) {
    runMatching(campaign.id, 10, 40, { notifyAll: true })
      .catch((err) => console.error('[acquisition] first-campaign matching failed:', err));
  }

  return res.status(201).json(campaign);
});

// GET /api/campaigns — list all campaigns for the authenticated brand
router.get('/', async (req: Request, res: Response) => {
  const results = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.brandId, req.auth!.sub))
    .orderBy(campaigns.createdAt);

  if (results.length === 0) return res.json([]);

  const campaignIds = results.map((c) => c.id);

  // Aggregate notified (any partnership request) and interested (accepted) counts per campaign
  const notifRows = await db
    .select({
      campaignId: partnershipRequests.campaignId,
      notifiedCount: count(),
      interestedCount: sql<number>`count(*) filter (where ${partnershipRequests.status} = 'accepted')`,
    })
    .from(partnershipRequests)
    .where(sql`${partnershipRequests.campaignId} = ANY(${sql.raw(`ARRAY[${campaignIds.map((id) => `'${id}'`).join(',')}]::uuid[]`)})`)
    .groupBy(partnershipRequests.campaignId);

  const notifMap = new Map(notifRows.map((r) => [r.campaignId, r]));

  const enriched = results.map((c) => ({
    ...c,
    notifiedCount: Number(notifMap.get(c.id)?.notifiedCount ?? 0),
    interestedCount: Number(notifMap.get(c.id)?.interestedCount ?? 0),
  }));

  return res.json(enriched);
});

// GET /api/campaigns/:id — get a single campaign (must belong to brand)
router.get('/:id', async (req: Request, res: Response) => {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, req.params.id), eq(campaigns.brandId, req.auth!.sub)))
    .limit(1);

  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

  const [notifRow] = await db
    .select({
      notifiedCount: count(),
      interestedCount: sql<number>`count(*) filter (where ${partnershipRequests.status} = 'accepted')`,
    })
    .from(partnershipRequests)
    .where(eq(partnershipRequests.campaignId, campaign.id));

  return res.json({
    ...campaign,
    notifiedCount: Number(notifRow?.notifiedCount ?? 0),
    interestedCount: Number(notifRow?.interestedCount ?? 0),
  });
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

// GET /api/campaigns/:id/applications — view community-owner applications for a campaign
router.get('/:id/applications', async (req: Request, res: Response) => {
  const [campaign] = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(and(eq(campaigns.id, req.params.id), eq(campaigns.brandId, req.auth!.sub)))
    .limit(1);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

  const results = await db
    .select({
      applicationId: campaignApplications.id,
      status: campaignApplications.status,
      pitch: campaignApplications.pitch,
      proposedRateCents: campaignApplications.proposedRateCents,
      brandNote: campaignApplications.brandNote,
      dealId: campaignApplications.dealId,
      createdAt: campaignApplications.createdAt,
      communityId: communities.id,
      communityName: communities.name,
      communityPlatform: communities.platform,
      communityMemberCount: communities.memberCount,
      communityNiche: communities.niche,
      communityDescription: communities.description,
      ownerName: communityOwners.name,
    })
    .from(campaignApplications)
    .innerJoin(communities, eq(campaignApplications.communityId, communities.id))
    .innerJoin(communityOwners, eq(communities.ownerId, communityOwners.id))
    .where(eq(campaignApplications.campaignId, req.params.id))
    .orderBy(campaignApplications.createdAt);

  return res.json(results);
});

const ApplicationDecisionSchema = z.object({
  decision: z.enum(['accept', 'decline']),
  note: z.string().optional(),
  agreedRateCents: z.number().int().positive().optional(),
});

// PATCH /api/campaigns/:id/applications/:appId — accept or decline an application
router.patch('/:id/applications/:appId', async (req: Request, res: Response) => {
  const parsed = ApplicationDecisionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  // Verify campaign ownership
  const [campaign] = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(and(eq(campaigns.id, req.params.id), eq(campaigns.brandId, req.auth!.sub)))
    .limit(1);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

  const [application] = await db
    .select()
    .from(campaignApplications)
    .where(
      and(
        eq(campaignApplications.id, req.params.appId),
        eq(campaignApplications.campaignId, req.params.id)
      )
    )
    .limit(1);
  if (!application) return res.status(404).json({ error: 'Application not found' });
  if (application.status !== 'pending') {
    return res.status(409).json({ error: `Application is already ${application.status}` });
  }

  const { decision, note, agreedRateCents } = parsed.data;

  if (decision === 'decline') {
    const [updated] = await db
      .update(campaignApplications)
      .set({ status: 'declined', brandNote: note, updatedAt: new Date() })
      .where(eq(campaignApplications.id, req.params.appId))
      .returning();
    return res.json(updated);
  }

  // Accept: create a deal and link it
  const rateCents = agreedRateCents ?? application.proposedRateCents ?? 0;

  // Create a partnership request (so deal model links back correctly)
  const [partnershipReq] = await db
    .insert(partnershipRequests)
    .values({
      campaignId: req.params.id,
      communityId: application.communityId,
      proposedRateCents: rateCents,
      message: application.pitch,
      status: 'accepted',
      initiatedByAi: 0,
    })
    .returning();

  const [deal] = await db
    .insert(deals)
    .values({
      partnershipRequestId: partnershipReq.id,
      campaignId: req.params.id,
      communityId: application.communityId,
      agreedRateCents: rateCents,
      status: 'agreed',
    })
    .returning();

  const [updated] = await db
    .update(campaignApplications)
    .set({ status: 'accepted', brandNote: note, dealId: deal.id, updatedAt: new Date() })
    .where(eq(campaignApplications.id, req.params.appId))
    .returning();

  return res.json({ application: updated, deal });
});

// GET /api/campaigns/dashboard — aggregated dashboard view
router.get('/dashboard/summary', async (req: Request, res: Response) => {
  const allCampaigns = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.brandId, req.auth!.sub));

  let notifRows: { campaignId: string; notifiedCount: number; interestedCount: number }[] = [];
  if (allCampaigns.length > 0) {
    const campaignIds = allCampaigns.map((c) => c.id);
    notifRows = await db
      .select({
        campaignId: partnershipRequests.campaignId,
        notifiedCount: count(),
        interestedCount: sql<number>`count(*) filter (where ${partnershipRequests.status} = 'accepted')`,
      })
      .from(partnershipRequests)
      .where(sql`${partnershipRequests.campaignId} = ANY(${sql.raw(`ARRAY[${campaignIds.map((id) => `'${id}'`).join(',')}]::uuid[]`)})`)
      .groupBy(partnershipRequests.campaignId) as { campaignId: string; notifiedCount: number; interestedCount: number }[];
  }

  const notifMap = new Map(notifRows.map((r) => [r.campaignId, r]));

  const enrichedCampaigns = allCampaigns.map((c) => ({
    ...c,
    notifiedCount: Number(notifMap.get(c.id)?.notifiedCount ?? 0),
    interestedCount: Number(notifMap.get(c.id)?.interestedCount ?? 0),
  }));

  const summary = {
    total: allCampaigns.length,
    byStatus: allCampaigns.reduce<Record<string, number>>((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {}),
    totalNotified: notifRows.reduce((sum, r) => sum + Number(r.notifiedCount), 0),
    totalInterested: notifRows.reduce((sum, r) => sum + Number(r.interestedCount), 0),
    campaigns: enrichedCampaigns,
  };

  return res.json(summary);
});

// ── Campaign Report Export (SPHA-59) ─────────────────────────────────────────

/**
 * GET /api/campaigns/:id/report?format=json|csv
 *
 * Returns a post-campaign performance report.
 * Available for any campaign that has at least one deal (any status).
 * ?format=csv  → CSV download
 * ?format=json (default) → structured JSON
 */
router.get('/:id/report', async (req: Request, res: Response) => {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, req.params.id), eq(campaigns.brandId, req.auth!.sub)))
    .limit(1);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

  // Load all deals for this campaign with community info
  const dealRows = await db
    .select({
      dealId: deals.id,
      dealStatus: deals.status,
      agreedRateCents: deals.agreedRateCents,
      deliverables: deals.deliverables,
      paymentStatus: deals.paymentStatus,
      paidAt: deals.paidAt,
      payoutAt: deals.payoutAt,
      signatureStatus: deals.signatureStatus,
      signedContractUrl: deals.signedContractUrl,
      completedAt: deals.completedAt,
      createdAt: deals.createdAt,
      communityId: communities.id,
      communityName: communities.name,
      communityPlatform: communities.platform,
      communityMemberCount: communities.memberCount,
      communityNiche: communities.niche,
      ownerName: communityOwners.name,
    })
    .from(deals)
    .innerJoin(communities, eq(deals.communityId, communities.id))
    .innerJoin(communityOwners, eq(communities.ownerId, communityOwners.id))
    .where(eq(deals.campaignId, campaign.id))
    .orderBy(deals.createdAt);

  const totalSpentCents = dealRows
    .filter((d) => ['active', 'completed'].includes(d.dealStatus))
    .reduce((sum, d) => sum + d.agreedRateCents, 0);

  const totalContractedCents = dealRows.reduce((sum, d) => sum + d.agreedRateCents, 0);

  const estimatedReach = dealRows.reduce((sum, d) => sum + (d.communityMemberCount ?? 0), 0);

  const reportData = {
    generatedAt: new Date().toISOString(),
    campaign: {
      id: campaign.id,
      title: campaign.title,
      brief: campaign.brief,
      niche: campaign.niche,
      budgetCents: campaign.budgetCents,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      status: campaign.status,
      createdAt: campaign.createdAt,
    },
    summary: {
      totalDeals: dealRows.length,
      activeDeals: dealRows.filter((d) => d.dealStatus === 'active').length,
      completedDeals: dealRows.filter((d) => d.dealStatus === 'completed').length,
      totalContractedCents,
      totalSpentCents,
      estimatedTotalReach: estimatedReach,
    },
    deals: dealRows.map((d) => ({
      dealId: d.dealId,
      communityName: d.communityName,
      platform: d.communityPlatform,
      memberCount: d.communityMemberCount,
      niche: d.communityNiche,
      ownerName: d.ownerName,
      agreedRateCents: d.agreedRateCents,
      dealStatus: d.dealStatus,
      paymentStatus: d.paymentStatus,
      signatureStatus: d.signatureStatus,
      signedContractUrl: d.signedContractUrl,
      deliverables: d.deliverables,
      paidAt: d.paidAt,
      payoutAt: d.payoutAt,
      completedAt: d.completedAt,
      dealCreatedAt: d.createdAt,
    })),
  };

  const format = req.query.format ?? 'json';

  if (format === 'csv') {
    const headers = [
      'Community Name', 'Platform', 'Members', 'Niche', 'Owner', 'Agreed Rate ($)',
      'Deal Status', 'Payment Status', 'Signature Status', 'Deliverables',
      'Paid At', 'Completed At',
    ];
    const csvRows = [
      headers.join(','),
      ...reportData.deals.map((d) =>
        [
          `"${(d.communityName ?? '').replace(/"/g, '""')}"`,
          d.platform ?? '',
          d.memberCount ?? '',
          `"${(d.niche ?? '').replace(/"/g, '""')}"`,
          `"${(d.ownerName ?? '').replace(/"/g, '""')}"`,
          d.agreedRateCents != null ? (d.agreedRateCents / 100).toFixed(2) : '',
          d.dealStatus ?? '',
          d.paymentStatus ?? '',
          d.signatureStatus ?? '',
          `"${(d.deliverables ?? '').replace(/"/g, '""')}"`,
          d.paidAt ? new Date(d.paidAt).toISOString() : '',
          d.completedAt ? new Date(d.completedAt).toISOString() : '',
        ].join(','),
      ),
    ];
    const filename = `sphere-campaign-report-${campaign.id.slice(0, 8)}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csvRows.join('\n'));
  }

  return res.json(reportData);
});

export default router;
