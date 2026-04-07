import { Router, Request, Response } from 'express';
import { sql, eq } from 'drizzle-orm';
import { db } from '../db';
import {
  brands,
  communityOwners,
  campaigns,
  communities,
  partnershipRequests,
  deals,
} from '../db/schema';

const router = Router();

// GET /api/metrics/beta — internal growth dashboard metrics (no auth required)
router.get('/beta', async (_req: Request, res: Response) => {
  const [
    [brandSignups],
    [communitySignups],
    [campaignsCreated],
    [communitiesListed],
    [matchesGenerated],
    [opportunitiesSent],
    [opportunitiesAccepted],
    [negotiationsStarted],
    [dealsSigned],
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(brands),
    db.select({ count: sql<number>`count(*)::int` }).from(communityOwners),
    db.select({ count: sql<number>`count(*)::int` }).from(campaigns),
    db.select({ count: sql<number>`count(*)::int` }).from(communities),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(partnershipRequests)
      .where(eq(partnershipRequests.initiatedByAi, 1)),
    db.select({ count: sql<number>`count(*)::int` }).from(partnershipRequests),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(partnershipRequests)
      .where(eq(partnershipRequests.status, 'accepted')),
    db.select({ count: sql<number>`count(*)::int` }).from(deals),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(deals)
      .where(eq(deals.signatureStatus, 'fully_executed')),
  ]);

  return res.json({
    brand_signups: brandSignups.count,
    community_signups: communitySignups.count,
    campaigns_created: campaignsCreated.count,
    communities_listed: communitiesListed.count,
    matches_generated: matchesGenerated.count,
    opportunities_sent: opportunitiesSent.count,
    opportunities_accepted: opportunitiesAccepted.count,
    negotiations_started: negotiationsStarted.count,
    deals_signed: dealsSigned.count,
  });
});

export default router;
