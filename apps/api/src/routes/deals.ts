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
 * POST /api/deals/:id/payment
 * STUB: Initiate escrow payment for a signed deal.
 * Brand provides a paymentIntentId (from Stripe); we record it and set paymentStatus=escrowed.
 * In production this will verify the PaymentIntent via Stripe API before escrowing.
 */
router.post('/:id/payment', async (req: Request, res: Response) => {
  if (req.auth!.role !== 'brand') return res.status(403).json({ error: 'Only brands can initiate payments' });

  const [deal] = await db.select().from(deals).where(eq(deals.id, req.params.id)).limit(1);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });
  if (deal.status !== 'signed') return res.status(409).json({ error: `Deal must be signed before payment (current: ${deal.status})` });

  const [campaign] = await db.select({ brandId: campaigns.brandId }).from(campaigns).where(eq(campaigns.id, deal.campaignId)).limit(1);
  if (campaign?.brandId !== req.auth!.sub) return res.status(403).json({ error: 'Forbidden' });

  // STUB: In production, verify paymentIntentId with Stripe and confirm funds held
  const stubPaymentIntentId = `pi_stub_${Date.now()}`;

  const [updated] = await db.update(deals).set({
    paymentStatus: 'escrowed',
    stripePaymentIntentId: stubPaymentIntentId,
    paidAt: new Date(),
    status: 'active',
    updatedAt: new Date(),
  }).where(eq(deals.id, req.params.id)).returning();

  return res.json({
    deal: updated,
    payment: {
      paymentIntentId: stubPaymentIntentId,
      amount: deal.agreedRateCents,
      currency: 'usd',
      status: 'escrowed',
      // STUB: real Stripe response fields would appear here
      _stub: true,
      _message: 'Payment escrowed. In production, funds are held in Stripe until deal completion.',
    },
  });
});

/**
 * POST /api/deals/:id/payout
 * STUB: Release escrowed funds to the community owner on deal completion.
 * In production this triggers a Stripe Connect transfer to the community owner's connected account.
 */
router.post('/:id/payout', async (req: Request, res: Response) => {
  if (req.auth!.role !== 'brand') return res.status(403).json({ error: 'Only brands can trigger payouts' });

  const [deal] = await db.select().from(deals).where(eq(deals.id, req.params.id)).limit(1);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });
  if (deal.paymentStatus !== 'escrowed') return res.status(409).json({ error: `Deal payment must be escrowed before payout (current: ${deal.paymentStatus})` });

  const [campaign] = await db.select({ brandId: campaigns.brandId }).from(campaigns).where(eq(campaigns.id, deal.campaignId)).limit(1);
  if (campaign?.brandId !== req.auth!.sub) return res.status(403).json({ error: 'Forbidden' });

  // Apply creator processing fee (10%) before payout
  const CREATOR_PROCESSING_FEE_RATE = 0.10;
  const platformFeeCents = Math.round(deal.agreedRateCents * CREATOR_PROCESSING_FEE_RATE);
  const creatorPayoutCents = deal.agreedRateCents - platformFeeCents;

  // STUB: In production, execute Stripe Connect transfer to community owner's account
  const stubTransferId = `tr_stub_${Date.now()}`;

  const [updated] = await db.update(deals).set({
    paymentStatus: 'released',
    stripeTransferId: stubTransferId,
    payoutAt: new Date(),
    status: 'completed',
    completedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(deals.id, req.params.id)).returning();

  return res.json({
    deal: updated,
    payout: {
      transferId: stubTransferId,
      grossAmountCents: deal.agreedRateCents,
      platformFeeCents,
      platformFeeRate: CREATOR_PROCESSING_FEE_RATE,
      creatorPayoutCents,
      currency: 'usd',
      status: 'released',
      // STUB: real Stripe Connect transfer fields would appear here
      _stub: true,
      _message: `Payout released. Creator receives $${(creatorPayoutCents / 100).toFixed(2)} after 10% platform fee. In production, funds transferred via Stripe Connect.`,
    },
  });
});

/**
 * POST /api/deals/:id/sign
 * STUB: Record a signature from either party (brand or community owner).
 * Accepts signer_type: 'brand' | 'community'
 * Returns a mock envelope_id and signed_at timestamp.
 * Once both parties have signed (fully_executed), deal status advances to 'active'.
 *
 * In production this will create a DocuSign/HelloSign envelope and route it to signers.
 */
router.post('/:id/sign', async (req: Request, res: Response) => {
  const signerTypeSchema = z.object({ signer_type: z.enum(['brand', 'community']) });
  const parsed = signerTypeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'signer_type must be "brand" or "community"' });

  const { signer_type } = parsed.data;

  // Enforce caller matches signer_type
  if (signer_type === 'brand' && req.auth!.role !== 'brand') {
    return res.status(403).json({ error: 'Only brands can sign as brand' });
  }
  if (signer_type === 'community' && req.auth!.role !== 'community_owner') {
    return res.status(403).json({ error: 'Only community owners can sign as community' });
  }

  const [deal] = await db.select().from(deals).where(eq(deals.id, req.params.id)).limit(1);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });
  if (deal.status !== 'contract_sent') {
    return res.status(409).json({ error: `Deal must be in 'contract_sent' status to sign (current: ${deal.status})` });
  }

  // Verify caller is party to this deal
  if (signer_type === 'brand') {
    const [campaign] = await db.select({ brandId: campaigns.brandId }).from(campaigns).where(eq(campaigns.id, deal.campaignId)).limit(1);
    if (campaign?.brandId !== req.auth!.sub) return res.status(403).json({ error: 'Forbidden' });
  } else {
    const [community] = await db.select({ ownerId: communities.ownerId }).from(communities).where(eq(communities.id, deal.communityId)).limit(1);
    if (community?.ownerId !== req.auth!.sub) return res.status(403).json({ error: 'Forbidden' });
  }

  const now = new Date();
  // STUB: generate mock envelope_id and signed contract PDF URL
  const envelopeId = deal.envelopeId ?? `env_stub_${deal.id.slice(0, 8)}_${Date.now()}`;
  const signedContractUrl = deal.signedContractUrl ?? `https://stub-storage.sphere.app/contracts/${deal.id}/signed.pdf`;

  // Determine new signature_status
  const currentSigStatus = deal.signatureStatus ?? 'unsigned';
  let newSigStatus: 'unsigned' | 'brand_signed' | 'community_signed' | 'fully_executed' = currentSigStatus as any;

  if (signer_type === 'brand') {
    if (currentSigStatus === 'community_signed') {
      newSigStatus = 'fully_executed';
    } else if (currentSigStatus === 'unsigned') {
      newSigStatus = 'brand_signed';
    }
  } else {
    if (currentSigStatus === 'brand_signed') {
      newSigStatus = 'fully_executed';
    } else if (currentSigStatus === 'unsigned') {
      newSigStatus = 'community_signed';
    }
  }

  const fullyExecuted = newSigStatus === 'fully_executed';

  const updatePayload: Record<string, any> = {
    signatureStatus: newSigStatus,
    envelopeId,
    signedContractUrl,
    updatedAt: now,
    ...(signer_type === 'brand' ? { brandSignedAt: now } : { communitySignedAt: now }),
    ...(fullyExecuted ? { status: 'active', signedAt: now } : {}),
  };

  const [updated] = await db.update(deals).set(updatePayload).where(eq(deals.id, req.params.id)).returning();

  return res.json({
    deal: updated,
    signature: {
      envelope_id: envelopeId,
      signer_type,
      signed_at: now.toISOString(),
      signed_contract_url: signedContractUrl,
      signature_status: newSigStatus,
      fully_executed: fullyExecuted,
      // STUB flags
      _stub: true,
      _message: fullyExecuted
        ? 'Both parties have signed. Deal is now active. In production, DocuSign/HelloSign would deliver the executed PDF.'
        : `Signature recorded for ${signer_type}. Awaiting the other party's signature.`,
    },
  });
});

export default router;
