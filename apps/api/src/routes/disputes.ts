/**
 * Dispute resolution routes
 *
 * Either party (brand or community owner) can open a dispute on a deal.
 * Platform admins review and resolve disputes via the admin API.
 *
 * Routes (authenticated — brand or community_owner):
 *   POST   /api/disputes                    — open a dispute on a deal
 *   GET    /api/disputes/:id                — view a dispute
 *   POST   /api/disputes/:id/comments       — add a comment to a dispute
 *
 * Admin routes (admin key required — registered separately in admin.ts):
 *   GET    /api/admin/disputes              — list all open/under_review disputes
 *   GET    /api/admin/disputes/:id          — full dispute detail for review
 *   POST   /api/admin/disputes/:id/resolve  — resolve a dispute
 */

import { Router, Request, Response } from 'express';
import { eq, and, or, inArray, desc } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import {
  disputes,
  disputeComments,
  deals,
  campaigns,
  communities,
  brands,
  communityOwners,
} from '../db/schema';
import { requireAuth } from '../middleware/auth';
import { sendEmail } from '../services/email';

const router = Router();
router.use(requireAuth);

// ─── Open a dispute ───────────────────────────────────────────────────────────

const OpenDisputeSchema = z.object({
  dealId: z.string().uuid(),
  reason: z.string().min(10).max(2000),
});

router.post('/', async (req: Request, res: Response) => {
  const parsed = OpenDisputeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }
  const { dealId, reason } = parsed.data;

  // Load deal and verify caller is party to it
  const [deal] = await db.select().from(deals).where(eq(deals.id, dealId)).limit(1);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });

  const [campaign] = await db.select({ brandId: campaigns.brandId }).from(campaigns).where(eq(campaigns.id, deal.campaignId)).limit(1);
  const [community] = await db.select({ ownerId: communities.ownerId }).from(communities).where(eq(communities.id, deal.communityId)).limit(1);

  const isBrand = req.auth!.role === 'brand' && campaign?.brandId === req.auth!.sub;
  const isOwner = req.auth!.role === 'community_owner' && community?.ownerId === req.auth!.sub;

  if (!isBrand && !isOwner) return res.status(403).json({ error: 'Forbidden' });

  // Only allow dispute on active or completed deals
  if (!['active', 'completed', 'signed'].includes(deal.status)) {
    return res.status(409).json({ error: `Cannot open dispute on a deal with status '${deal.status}'` });
  }

  // Check no existing open dispute for this deal
  const [existing] = await db
    .select({ id: disputes.id })
    .from(disputes)
    .where(and(eq(disputes.dealId, dealId), inArray(disputes.status, ['open', 'under_review'])))
    .limit(1);

  if (existing) {
    return res.status(409).json({ error: 'An open dispute already exists for this deal', disputeId: existing.id });
  }

  const [dispute] = await db
    .insert(disputes)
    .values({
      dealId,
      openedBy: req.auth!.role === 'brand' ? 'brand' : 'community_owner',
      openedById: req.auth!.sub,
      reason,
    })
    .returning();

  // Log for admin awareness
  console.log('[dispute:opened]', { disputeId: dispute.id, dealId, openedBy: dispute.openedBy });

  return res.status(201).json(dispute);
});

// ─── Get a dispute ────────────────────────────────────────────────────────────

router.get('/:id', async (req: Request, res: Response) => {
  const [dispute] = await db.select().from(disputes).where(eq(disputes.id, req.params.id)).limit(1);
  if (!dispute) return res.status(404).json({ error: 'Dispute not found' });

  // Verify caller is party to the underlying deal
  const [deal] = await db.select().from(deals).where(eq(deals.id, dispute.dealId)).limit(1);
  const [campaign] = await db.select({ brandId: campaigns.brandId }).from(campaigns).where(eq(campaigns.id, deal!.campaignId)).limit(1);
  const [community] = await db.select({ ownerId: communities.ownerId }).from(communities).where(eq(communities.id, deal!.communityId)).limit(1);

  const isBrand = req.auth!.role === 'brand' && campaign?.brandId === req.auth!.sub;
  const isOwner = req.auth!.role === 'community_owner' && community?.ownerId === req.auth!.sub;

  if (!isBrand && !isOwner) return res.status(403).json({ error: 'Forbidden' });

  const comments = await db
    .select()
    .from(disputeComments)
    .where(eq(disputeComments.disputeId, dispute.id))
    .orderBy(disputeComments.createdAt);

  return res.json({ ...dispute, comments });
});

// ─── Add comment ──────────────────────────────────────────────────────────────

const AddCommentSchema = z.object({
  body: z.string().min(1).max(5000),
});

router.post('/:id/comments', async (req: Request, res: Response) => {
  const parsed = AddCommentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const [dispute] = await db.select().from(disputes).where(eq(disputes.id, req.params.id)).limit(1);
  if (!dispute) return res.status(404).json({ error: 'Dispute not found' });

  if (['resolved_for_brand', 'resolved_for_community', 'resolved_mutual'].includes(dispute.status)) {
    return res.status(409).json({ error: 'Dispute is already resolved' });
  }

  // Verify caller is party to this dispute's deal
  const [deal] = await db.select().from(deals).where(eq(deals.id, dispute.dealId)).limit(1);
  const [campaign] = await db.select({ brandId: campaigns.brandId }).from(campaigns).where(eq(campaigns.id, deal!.campaignId)).limit(1);
  const [community] = await db.select({ ownerId: communities.ownerId }).from(communities).where(eq(communities.id, deal!.communityId)).limit(1);

  const isBrand = req.auth!.role === 'brand' && campaign?.brandId === req.auth!.sub;
  const isOwner = req.auth!.role === 'community_owner' && community?.ownerId === req.auth!.sub;

  if (!isBrand && !isOwner) return res.status(403).json({ error: 'Forbidden' });

  const [comment] = await db
    .insert(disputeComments)
    .values({
      disputeId: dispute.id,
      authorType: req.auth!.role,
      authorId: req.auth!.sub,
      body: parsed.data.body,
    })
    .returning();

  // Bump dispute updatedAt
  await db.update(disputes).set({ updatedAt: new Date() }).where(eq(disputes.id, dispute.id));

  return res.status(201).json(comment);
});

export default router;

// ─── Admin handlers (exported for use in admin.ts) ───────────────────────────

/**
 * GET /api/admin/disputes — list open and under_review disputes with deal/party context
 */
export async function adminListDisputes(req: Request, res: Response) {
  const rows = await db
    .select({
      id: disputes.id,
      status: disputes.status,
      openedBy: disputes.openedBy,
      reason: disputes.reason,
      dealId: disputes.dealId,
      createdAt: disputes.createdAt,
      updatedAt: disputes.updatedAt,
    })
    .from(disputes)
    .where(inArray(disputes.status, ['open', 'under_review']))
    .orderBy(desc(disputes.createdAt));

  return res.json(rows);
}

/**
 * GET /api/admin/disputes/:id — full dispute detail for admin review
 */
export async function adminGetDispute(req: Request, res: Response) {
  const [dispute] = await db.select().from(disputes).where(eq(disputes.id, req.params.id)).limit(1);
  if (!dispute) return res.status(404).json({ error: 'Dispute not found' });

  const comments = await db
    .select()
    .from(disputeComments)
    .where(eq(disputeComments.disputeId, dispute.id))
    .orderBy(disputeComments.createdAt);

  // Load deal + party info
  const [deal] = await db.select().from(deals).where(eq(deals.id, dispute.dealId)).limit(1);
  const [campaign] = await db.select({ brandId: campaigns.brandId, title: campaigns.title }).from(campaigns).where(eq(campaigns.id, deal!.campaignId)).limit(1);
  const [community] = await db
    .select({ ownerId: communities.ownerId, name: communities.name })
    .from(communities)
    .where(eq(communities.id, deal!.communityId))
    .limit(1);

  const [brand] = campaign
    ? await db.select({ name: brands.name, email: brands.email }).from(brands).where(eq(brands.id, campaign.brandId)).limit(1)
    : [null];
  const [owner] = community
    ? await db.select({ name: communityOwners.name, email: communityOwners.email }).from(communityOwners).where(eq(communityOwners.id, community.ownerId)).limit(1)
    : [null];

  return res.json({
    ...dispute,
    comments,
    deal,
    campaign: campaign ? { ...campaign, brandName: brand?.name, brandEmail: brand?.email } : null,
    community: community ? { ...community, ownerName: owner?.name, ownerEmail: owner?.email } : null,
  });
}

const ResolveSchema = z.object({
  resolution: z.enum(['resolved_for_brand', 'resolved_for_community', 'resolved_mutual']),
  adminNote: z.string().max(2000).optional(),
});

const APP_BASE_URL = process.env.APP_BASE_URL ?? 'http://localhost:3000';

/**
 * POST /api/admin/disputes/:id/resolve
 */
export async function adminResolveDispute(req: Request, res: Response) {
  const parsed = ResolveSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }
  const { resolution, adminNote } = parsed.data;

  const [dispute] = await db.select().from(disputes).where(eq(disputes.id, req.params.id)).limit(1);
  if (!dispute) return res.status(404).json({ error: 'Dispute not found' });

  if (!['open', 'under_review'].includes(dispute.status)) {
    return res.status(409).json({ error: 'Dispute is already resolved' });
  }

  const [updated] = await db
    .update(disputes)
    .set({
      status: resolution,
      resolvedByAdminNote: adminNote,
      resolvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(disputes.id, dispute.id))
    .returning();

  // Notify both parties by email
  const [deal] = await db.select().from(deals).where(eq(deals.id, dispute.dealId)).limit(1);
  if (deal) {
    const [campaign] = await db.select({ brandId: campaigns.brandId, title: campaigns.title }).from(campaigns).where(eq(campaigns.id, deal.campaignId)).limit(1);
    const [community] = await db.select({ ownerId: communities.ownerId }).from(communities).where(eq(communities.id, deal.communityId)).limit(1);

    const resolutionLabel: Record<string, string> = {
      resolved_for_brand: 'resolved in the brand\'s favour',
      resolved_for_community: 'resolved in the community owner\'s favour',
      resolved_mutual: 'resolved by mutual agreement',
    };
    const label = resolutionLabel[resolution] ?? 'resolved';
    const subject = `Your Sphere dispute has been ${label}`;
    const html = `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
<h2>Dispute resolved</h2>
<p>Your dispute regarding deal <strong>${deal.id}</strong> has been <strong>${label}</strong>.</p>
${adminNote ? `<p>Admin note: ${adminNote}</p>` : ''}
<p><a href="${APP_BASE_URL}/deals/${deal.id}">View deal</a></p>
</div>`;

    if (campaign) {
      const [brand] = await db.select({ email: brands.email }).from(brands).where(eq(brands.id, campaign.brandId)).limit(1);
      if (brand?.email) sendEmail(brand.email, subject, html).catch(() => {});
    }
    if (community) {
      const [owner] = await db.select({ email: communityOwners.email }).from(communityOwners).where(eq(communityOwners.id, community.ownerId)).limit(1);
      if (owner?.email) sendEmail(owner.email, subject, html).catch(() => {});
    }
  }

  return res.json(updated);
}
