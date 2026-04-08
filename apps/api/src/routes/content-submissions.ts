import { Router, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { deals, campaigns, communities, contentSubmissions } from '../db/schema';
import { requireAuth } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.use(requireAuth);

async function verifyDealAccess(
  dealId: string,
  auth: Request['auth'],
): Promise<{ deal: typeof deals.$inferSelect; isBrand: boolean; isCommunity: boolean } | null> {
  const [deal] = await db.select().from(deals).where(eq(deals.id, dealId)).limit(1);
  if (!deal) return null;

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

  const isBrand = auth!.role === 'brand' && campaign?.brandId === auth!.sub;
  const isCommunity = auth!.role === 'community_owner' && community?.ownerId === auth!.sub;

  if (!isBrand && !isCommunity) return null;
  return { deal, isBrand, isCommunity };
}

/**
 * GET /api/deals/:dealId/content
 * Get the current content submission for a deal.
 */
router.get('/', async (req: Request, res: Response) => {
  const access = await verifyDealAccess(req.params.dealId, req.auth);
  if (!access) return res.status(403).json({ error: 'Forbidden' });

  const rows = await db
    .select()
    .from(contentSubmissions)
    .where(eq(contentSubmissions.dealId, req.params.dealId));

  return res.json(rows);
});

/**
 * POST /api/deals/:dealId/content
 * Brand submits content for the deal. Deal must be active/signed.
 */
router.post('/', async (req: Request, res: Response) => {
  const access = await verifyDealAccess(req.params.dealId, req.auth);
  if (!access) return res.status(403).json({ error: 'Forbidden' });
  if (!access.isBrand) return res.status(403).json({ error: 'Only brands can submit content' });

  const { deal } = access;
  if (!['active', 'signed', 'completed'].includes(deal.status)) {
    return res.status(409).json({ error: `Deal must be active before submitting content (current: ${deal.status})` });
  }

  const schema = z.object({
    brief: z.string().min(1),
    assetUrls: z.array(z.string().url()).optional().default([]),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const [submission] = await db
    .insert(contentSubmissions)
    .values({
      dealId: deal.id,
      brief: parsed.data.brief,
      assetUrls: JSON.stringify(parsed.data.assetUrls),
      status: 'pending_review',
      brandApproved: 0,
      communityApproved: 0,
    })
    .returning();

  return res.status(201).json(submission);
});

/**
 * POST /api/deals/:dealId/content/:submissionId/approve
 * Brand or community owner marks the content as approved.
 * When both approve, status advances to 'approved'.
 */
router.post('/:submissionId/approve', async (req: Request, res: Response) => {
  const access = await verifyDealAccess(req.params.dealId, req.auth);
  if (!access) return res.status(403).json({ error: 'Forbidden' });

  const [sub] = await db
    .select()
    .from(contentSubmissions)
    .where(eq(contentSubmissions.id, req.params.submissionId))
    .limit(1);
  if (!sub || sub.dealId !== req.params.dealId) return res.status(404).json({ error: 'Submission not found' });

  if (!['pending_review', 'changes_requested'].includes(sub.status)) {
    return res.status(409).json({ error: `Cannot approve content in status: ${sub.status}` });
  }

  const newBrandApproved = access.isBrand ? 1 : sub.brandApproved;
  const newCommunityApproved = access.isCommunity ? 1 : sub.communityApproved;
  const bothApproved = newBrandApproved === 1 && newCommunityApproved === 1;

  const [updated] = await db
    .update(contentSubmissions)
    .set({
      brandApproved: newBrandApproved,
      communityApproved: newCommunityApproved,
      status: bothApproved ? 'approved' : 'pending_review',
      changesRequestedNote: null,
      updatedAt: new Date(),
    })
    .where(eq(contentSubmissions.id, sub.id))
    .returning();

  return res.json(updated);
});

/**
 * POST /api/deals/:dealId/content/:submissionId/request-changes
 * Community owner requests changes on a submission.
 */
router.post('/:submissionId/request-changes', async (req: Request, res: Response) => {
  const access = await verifyDealAccess(req.params.dealId, req.auth);
  if (!access) return res.status(403).json({ error: 'Forbidden' });
  if (!access.isCommunity) return res.status(403).json({ error: 'Only community owners can request changes' });

  const schema = z.object({ note: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'note is required' });

  const [sub] = await db
    .select()
    .from(contentSubmissions)
    .where(eq(contentSubmissions.id, req.params.submissionId))
    .limit(1);
  if (!sub || sub.dealId !== req.params.dealId) return res.status(404).json({ error: 'Submission not found' });

  if (!['pending_review', 'approved'].includes(sub.status)) {
    return res.status(409).json({ error: `Cannot request changes in status: ${sub.status}` });
  }

  const [updated] = await db
    .update(contentSubmissions)
    .set({
      status: 'changes_requested',
      changesRequestedNote: parsed.data.note,
      brandApproved: 0,
      communityApproved: 0,
      updatedAt: new Date(),
    })
    .where(eq(contentSubmissions.id, sub.id))
    .returning();

  return res.json(updated);
});

/**
 * POST /api/deals/:dealId/content/:submissionId/posted
 * Community owner marks the content as posted (published to their channel).
 */
router.post('/:submissionId/posted', async (req: Request, res: Response) => {
  const access = await verifyDealAccess(req.params.dealId, req.auth);
  if (!access) return res.status(403).json({ error: 'Forbidden' });
  if (!access.isCommunity) return res.status(403).json({ error: 'Only community owners can mark as posted' });

  const schema = z.object({ postUrl: z.string().url().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const [sub] = await db
    .select()
    .from(contentSubmissions)
    .where(eq(contentSubmissions.id, req.params.submissionId))
    .limit(1);
  if (!sub || sub.dealId !== req.params.dealId) return res.status(404).json({ error: 'Submission not found' });

  if (sub.status !== 'approved') {
    return res.status(409).json({ error: `Content must be approved before marking as posted (current: ${sub.status})` });
  }

  const now = new Date();
  const [updated] = await db
    .update(contentSubmissions)
    .set({
      status: 'posted',
      postUrl: parsed.data.postUrl ?? null,
      postedAt: now,
      updatedAt: now,
    })
    .where(eq(contentSubmissions.id, sub.id))
    .returning();

  return res.json(updated);
});

/**
 * POST /api/deals/:dealId/content/:submissionId/confirm
 * Brand confirms the post is live and correct — triggers payout queue.
 */
router.post('/:submissionId/confirm', async (req: Request, res: Response) => {
  const access = await verifyDealAccess(req.params.dealId, req.auth);
  if (!access) return res.status(403).json({ error: 'Forbidden' });
  if (!access.isBrand) return res.status(403).json({ error: 'Only brands can confirm content' });

  const [sub] = await db
    .select()
    .from(contentSubmissions)
    .where(eq(contentSubmissions.id, req.params.submissionId))
    .limit(1);
  if (!sub || sub.dealId !== req.params.dealId) return res.status(404).json({ error: 'Submission not found' });

  if (sub.status !== 'posted') {
    return res.status(409).json({ error: `Content must be posted before brand confirms (current: ${sub.status})` });
  }

  const now = new Date();
  const [updated] = await db
    .update(contentSubmissions)
    .set({
      status: 'confirmed',
      confirmedAt: now,
      payoutQueuedAt: now,
      updatedAt: now,
    })
    .where(eq(contentSubmissions.id, sub.id))
    .returning();

  // Advance deal to completed
  await db
    .update(deals)
    .set({ status: 'completed', completedAt: now, updatedAt: now })
    .where(eq(deals.id, req.params.dealId));

  return res.json({
    submission: updated,
    payoutQueued: true,
    message: 'Content confirmed. Payout has been queued for the community owner.',
  });
});

/**
 * POST /api/deals/:dealId/content/:submissionId/dispute
 * Either party can dispute — triggers manual admin review.
 */
router.post('/:submissionId/dispute', async (req: Request, res: Response) => {
  const access = await verifyDealAccess(req.params.dealId, req.auth);
  if (!access) return res.status(403).json({ error: 'Forbidden' });

  const schema = z.object({ note: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'note is required' });

  const [sub] = await db
    .select()
    .from(contentSubmissions)
    .where(eq(contentSubmissions.id, req.params.submissionId))
    .limit(1);
  if (!sub || sub.dealId !== req.params.dealId) return res.status(404).json({ error: 'Submission not found' });

  if (['confirmed', 'disputed'].includes(sub.status)) {
    return res.status(409).json({ error: `Cannot dispute content in status: ${sub.status}` });
  }

  const now = new Date();
  const [updated] = await db
    .update(contentSubmissions)
    .set({
      status: 'disputed',
      disputedAt: now,
      disputeNote: parsed.data.note,
      updatedAt: now,
    })
    .where(eq(contentSubmissions.id, sub.id))
    .returning();

  return res.json({
    submission: updated,
    message: 'Dispute filed. Admin review has been triggered.',
  });
});

export default router;
