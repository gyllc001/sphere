/**
 * AI Negotiation Agent
 *
 * Uses Claude to generate counter-offer reasoning and decide when to accept/counter/walk away.
 * Contract generation produces a structured text summary ready for e-signature (stub).
 */
import Anthropic from '@anthropic-ai/sdk';
import { db } from '../db';
import { deals, campaigns, communities, brands, communityOwners, partnershipRequests } from '../db/schema';
import { eq } from 'drizzle-orm';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type NegotiationAction =
  | { action: 'accept'; finalRateCents: number }
  | { action: 'counter'; counterRateCents: number; message: string }
  | { action: 'walkaway'; reason: string };

interface NegotiationContext {
  brandName: string;
  campaignTitle: string;
  budgetCents: number | null;
  communityName: string;
  memberCount: number;
  originalMatchScore: number | null;
  currentProposedRateCents: number;
  roundNumber: number;
  previousLog: Array<{ from: string; rateCents: number; message?: string; at: string }>;
}

/**
 * Ask Claude what the brand's AI agent should do next in negotiation.
 */
async function getAiNegotiationDecision(ctx: NegotiationContext): Promise<NegotiationAction> {
  const budgetStr = ctx.budgetCents ? `$${(ctx.budgetCents / 100).toFixed(2)}` : 'flexible';
  const currentStr = `$${(ctx.currentProposedRateCents / 100).toFixed(2)}`;

  const prompt = `You are an AI negotiation agent acting on behalf of a brand in a partnership deal.

CONTEXT:
- Brand: ${ctx.brandName}
- Campaign: ${ctx.campaignTitle}
- Brand's total campaign budget: ${budgetStr}
- Community: ${ctx.communityName} (${ctx.memberCount.toLocaleString()} members)
- Match score: ${ctx.originalMatchScore ?? 'N/A'}/100
- Current proposed rate from community: ${currentStr}
- Negotiation round: ${ctx.roundNumber}

NEGOTIATION HISTORY:
${ctx.previousLog.map((e) => `  [${e.from}] $${(e.rateCents / 100).toFixed(2)}${e.message ? ': ' + e.message : ''}`).join('\n') || '  (none yet)'}

RULES:
- Never exceed the campaign budget
- Maximum 3 counter-offer rounds before walking away
- Accept if the rate is reasonable relative to community size and match quality
- Counter with a specific rate and short message if room to negotiate
- Walk away if the community is consistently over budget or match quality is poor

Respond with JSON only (no markdown):
{
  "action": "accept" | "counter" | "walkaway",
  "finalRateCents": <number, only if accept>,
  "counterRateCents": <number, only if counter>,
  "message": "<string, only if counter>",
  "reason": "<string, only if walkaway>"
}`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const parsed = JSON.parse(text.trim());

  if (parsed.action === 'accept') {
    return { action: 'accept', finalRateCents: Number(parsed.finalRateCents ?? ctx.currentProposedRateCents) };
  } else if (parsed.action === 'counter') {
    return { action: 'counter', counterRateCents: Number(parsed.counterRateCents), message: String(parsed.message) };
  } else {
    return { action: 'walkaway', reason: String(parsed.reason) };
  }
}

/**
 * Rule-based fallback when no API key is set.
 */
function ruleBasedDecision(ctx: NegotiationContext): NegotiationAction {
  const budget = ctx.budgetCents ?? Infinity;
  const current = ctx.currentProposedRateCents;

  if (ctx.roundNumber > 3) return { action: 'walkaway', reason: 'Max negotiation rounds reached.' };
  if (current > budget) {
    const counter = Math.round(budget * 0.85);
    return { action: 'counter', counterRateCents: counter, message: `Our budget cap is $${(budget / 100).toFixed(2)}. Can we meet at $${(counter / 100).toFixed(2)}?` };
  }
  return { action: 'accept', finalRateCents: current };
}

/**
 * Advance the AI-side negotiation for a deal.
 * Called by the brand (or automated scheduler) after the community owner responds.
 */
export async function advanceNegotiation(dealId: string): Promise<NegotiationAction> {
  const [deal] = await db
    .select()
    .from(deals)
    .where(eq(deals.id, dealId))
    .limit(1);
  if (!deal) throw new Error(`Deal ${dealId} not found`);
  if (!['negotiating', 'agreed'].includes(deal.status)) {
    throw new Error(`Deal is not in a negotiable state (status: ${deal.status})`);
  }

  const [request] = await db.select().from(partnershipRequests).where(eq(partnershipRequests.id, deal.partnershipRequestId)).limit(1);
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, deal.campaignId)).limit(1);
  const [community] = await db.select().from(communities).where(eq(communities.id, deal.communityId)).limit(1);
  const [brand] = await db.select().from(brands).where(eq(brands.id, campaign.brandId)).limit(1);

  const previousLog: NegotiationContext['previousLog'] = (() => {
    try { return JSON.parse(deal.negotiationLog ?? '[]'); } catch { return []; }
  })();

  const ctx: NegotiationContext = {
    brandName: brand.name,
    campaignTitle: campaign.title,
    budgetCents: campaign.budgetCents,
    communityName: community.name,
    memberCount: community.memberCount,
    originalMatchScore: request?.matchScore ?? null,
    currentProposedRateCents: deal.agreedRateCents,
    roundNumber: previousLog.length + 1,
    previousLog,
  };

  const useAi = Boolean(process.env.ANTHROPIC_API_KEY);
  const decision = useAi ? await getAiNegotiationDecision(ctx) : ruleBasedDecision(ctx);

  // Append to negotiation log
  const newLog = [
    ...previousLog,
    {
      from: 'brand_ai',
      rateCents: decision.action === 'accept' ? decision.finalRateCents
        : decision.action === 'counter' ? decision.counterRateCents
        : deal.agreedRateCents,
      message: decision.action === 'counter' ? decision.message
        : decision.action === 'walkaway' ? decision.reason
        : 'Accepted',
      at: new Date().toISOString(),
    },
  ];

  if (decision.action === 'accept') {
    await db.update(deals).set({
      status: 'agreed',
      agreedRateCents: decision.finalRateCents,
      negotiationLog: JSON.stringify(newLog),
      updatedAt: new Date(),
    }).where(eq(deals.id, dealId));
  } else if (decision.action === 'counter') {
    await db.update(deals).set({
      status: 'negotiating',
      agreedRateCents: decision.counterRateCents,
      negotiationLog: JSON.stringify(newLog),
      updatedAt: new Date(),
    }).where(eq(deals.id, dealId));
  } else {
    await db.update(deals).set({
      status: 'cancelled',
      negotiationLog: JSON.stringify(newLog),
      updatedAt: new Date(),
    }).where(eq(deals.id, dealId));
  }

  return decision;
}

/**
 * Generate a plain-text contract for a finalized deal.
 */
export async function generateContract(dealId: string): Promise<string> {
  const [deal] = await db.select().from(deals).where(eq(deals.id, dealId)).limit(1);
  if (!deal) throw new Error(`Deal ${dealId} not found`);
  if (deal.status !== 'agreed') throw new Error(`Deal must be in 'agreed' status to generate contract`);

  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, deal.campaignId)).limit(1);
  const [community] = await db.select().from(communities).where(eq(communities.id, deal.communityId)).limit(1);
  const [communityOwner] = await db.select().from(communityOwners).where(eq(communityOwners.id, community.ownerId)).limit(1);
  const [brand] = await db.select().from(brands).where(eq(brands.id, campaign.brandId)).limit(1);

  const contract = `SPHERE PARTNERSHIP AGREEMENT
============================
Generated: ${new Date().toISOString()}
Deal ID: ${deal.id}

PARTIES
-------
Brand:            ${brand.name} (${brand.email})
Community Owner:  ${communityOwner.name} (${communityOwner.email})
Community:        ${community.name} (${community.platform}, ${community.memberCount.toLocaleString()} members)

CAMPAIGN DETAILS
----------------
Campaign:         ${campaign.title}
Brief:            ${campaign.brief}
Objectives:       ${campaign.objectives ?? 'As discussed'}
Target Audience:  ${campaign.targetAudience ?? 'As discussed'}
Campaign Dates:   ${campaign.startDate ? campaign.startDate.toDateString() : 'TBD'} – ${campaign.endDate ? campaign.endDate.toDateString() : 'TBD'}

DEAL TERMS
----------
Agreed Rate:      $${(deal.agreedRateCents / 100).toFixed(2)} USD
Deliverables:     ${deal.deliverables ?? 'To be defined in campaign brief'}

SIGNATURES
----------
By signing below, both parties agree to the terms above.

Brand Representative: _________________________  Date: __________

Community Owner:      _________________________  Date: __________

---
This agreement was facilitated by Sphere. Questions: support@sphere.io
`;

  // Store contract text as URL placeholder (in production, upload to S3/similar)
  const contractRef = `contract:deal:${deal.id}`;
  await db.update(deals).set({
    contractUrl: contractRef,
    status: 'contract_sent',
    updatedAt: new Date(),
  }).where(eq(deals.id, dealId));

  return contract;
}
