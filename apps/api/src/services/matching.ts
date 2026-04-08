/**
 * AI Matching Engine
 *
 * Scores communities against a campaign brief using Claude.
 * Falls back to rule-based scoring when the API key is unavailable (dev/test).
 */
import Anthropic from '@anthropic-ai/sdk';
import { db } from '../db';
import { campaigns, communities, communityOwners, partnershipRequests, brands } from '../db/schema';
import { eq, and, notInArray, inArray, count } from 'drizzle-orm';
import {
  sendBrandFirstMatchEmail,
  sendCommunityOwnerFirstOpportunityEmail,
  sendBrandAcquisitionNotificationEmail,
} from './email';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface MatchResult {
  communityId: string;
  communityName: string;
  score: number;      // 0-100
  rationale: string;
  proposedRateCents: number;
  safetyFlagged?: boolean;           // true if community matched an excluded topic/keyword
  safetyFlagReasons?: string[];      // which categories/keywords triggered the flag
}

/**
 * Check whether a community should be excluded or flagged based on brand safety settings.
 * Returns { excluded: true } if the community should be hard-excluded,
 * or { excluded: false, flagged: true, reasons } if it should appear with a warning.
 */
function checkBrandSafety(
  community: { contentTopics: string[] | null; niche: string | null; description: string | null },
  excludedCategories: string[],
  excludedKeywords: string[],
): { excluded: boolean; flagged: boolean; reasons: string[] } {
  if (excludedCategories.length === 0 && excludedKeywords.length === 0) {
    return { excluded: false, flagged: false, reasons: [] };
  }

  const reasons: string[] = [];
  const topics = community.contentTopics ?? [];
  const searchText = [community.niche ?? '', community.description ?? ''].join(' ').toLowerCase();

  // Category check: community self-declared topics
  for (const cat of excludedCategories) {
    if (topics.includes(cat)) {
      reasons.push(`topic:${cat}`);
    }
  }

  // Keyword check: against niche + description
  for (const kw of excludedKeywords) {
    if (searchText.includes(kw.toLowerCase())) {
      reasons.push(`keyword:${kw}`);
    }
  }

  return { excluded: reasons.length > 0, flagged: reasons.length > 0, reasons };
}

/**
 * Rule-based fallback scorer (no API key required).
 * Scores based on:
 * - Niche alignment
 * - Member count vs minCommunitySize
 * - Base rate vs campaign budget
 */
function ruleBasedScore(
  campaign: { niche: string | null; minCommunitySize: number | null; budgetCents: number | null },
  community: { niche: string | null; memberCount: number; baseRate: number | null },
): { score: number; rationale: string } {
  let score = 50;
  const reasons: string[] = [];

  if (campaign.niche && community.niche) {
    const nicheMatch = community.niche.toLowerCase().includes(campaign.niche.toLowerCase()) ||
      campaign.niche.toLowerCase().includes(community.niche.toLowerCase());
    if (nicheMatch) { score += 25; reasons.push('niche alignment'); }
    else { score -= 10; reasons.push('niche mismatch'); }
  }

  if (campaign.minCommunitySize) {
    if (community.memberCount >= campaign.minCommunitySize) { score += 15; reasons.push('meets size requirement'); }
    else { score -= 20; reasons.push('below minimum size'); }
  }

  if (campaign.budgetCents && community.baseRate) {
    if (community.baseRate <= campaign.budgetCents) { score += 10; reasons.push('within budget'); }
    else { score -= 5; reasons.push('above budget'); }
  }

  score = Math.max(0, Math.min(100, score));
  return {
    score,
    rationale: reasons.length > 0 ? `Rule-based: ${reasons.join(', ')}.` : 'Rule-based default score.',
  };
}

/**
 * Score a single community against a campaign using Claude.
 */
async function scoreWithClaude(
  campaign: { title: string; brief: string; objectives: string | null; targetAudience: string | null; niche: string | null; minCommunitySize: number | null; budgetCents: number | null },
  community: { name: string; platform: string; niche: string | null; memberCount: number; engagementRate: string | null; description: string | null; baseRate: number | null },
): Promise<{ score: number; rationale: string }> {
  const prompt = `You are a brand-community partnership analyst. Score this community's fit for the campaign brief.

CAMPAIGN:
Title: ${campaign.title}
Brief: ${campaign.brief}
Objectives: ${campaign.objectives ?? 'Not specified'}
Target Audience: ${campaign.targetAudience ?? 'Not specified'}
Niche: ${campaign.niche ?? 'Not specified'}
Min Community Size: ${campaign.minCommunitySize ?? 'Any'}
Budget: ${campaign.budgetCents ? `$${(campaign.budgetCents / 100).toFixed(2)}` : 'Flexible'}

COMMUNITY:
Name: ${community.name}
Platform: ${community.platform}
Niche: ${community.niche ?? 'Not specified'}
Members: ${community.memberCount.toLocaleString()}
Engagement Rate: ${community.engagementRate ?? 'Unknown'}
Description: ${community.description ?? 'None'}
Base Rate: ${community.baseRate ? `$${(community.baseRate / 100).toFixed(2)}` : 'Not set'}

Respond with JSON only (no markdown):
{
  "score": <integer 0-100>,
  "rationale": "<2-3 sentence explanation>"
}`;

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const parsed = JSON.parse(text.trim());
  return { score: Number(parsed.score), rationale: String(parsed.rationale) };
}

/**
 * Send outreach to scraped (unregistered) community owners for a new brand's campaign.
 * Full message copy is pending board approval (SPHA-50). Currently stubs to a log.
 */
async function notifyScrapedCommunities(
  campaignId: string,
  brandName: string,
  niche: string | null,
  matchedScrapedIds: string[],
): Promise<void> {
  if (matchedScrapedIds.length === 0) return;
  // TODO (SPHA-50): board must approve final message copy before live outreach is enabled.
  // Once approved, send a personalised DM/email via the contact info on scrapedCommunities.
  console.log(
    `[acquisition] ${matchedScrapedIds.length} scraped communities matched for brand "${brandName}" ` +
    `(campaign ${campaignId}). Outreach pending SPHA-50 board approval.`,
  );
}

/**
 * Run matching for a campaign: score all eligible communities, create partnership_requests
 * for the top N matches above threshold.
 *
 * @param notifyAll  When true (first-campaign mode), sends brand-acquisition notification
 *                   emails to ALL matched registered community owners, not just first-timers.
 *                   Also fires scraped-community outreach stub.
 */
export async function runMatching(
  campaignId: string,
  topN = 10,
  threshold = 40,
  opts: { notifyAll?: boolean } = {},
): Promise<MatchResult[]> {
  const { notifyAll = false } = opts;
  // Load campaign
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
  if (!campaign) throw new Error(`Campaign ${campaignId} not found`);

  // Load brand details (safety settings + contact info for email notifications)
  const [brand] = await db
    .select({
      brandSafetyCategories: brands.brandSafetyCategories,
      brandSafetyKeywords: brands.brandSafetyKeywords,
      brandEmail: brands.email,
      brandName: brands.name,
    })
    .from(brands)
    .where(eq(brands.id, campaign.brandId))
    .limit(1);
  const excludedCategories: string[] = brand?.brandSafetyCategories ?? [];
  const excludedKeywords: string[] = brand?.brandSafetyKeywords ?? [];

  // Find communities already sent a request for this campaign
  const existingRequests = await db
    .select({ communityId: partnershipRequests.communityId })
    .from(partnershipRequests)
    .where(eq(partnershipRequests.campaignId, campaignId));
  const alreadyRequestedIds = existingRequests.map((r) => r.communityId);

  // Load active communities not already requested
  const query = db
    .select()
    .from(communities)
    .where(
      alreadyRequestedIds.length > 0
        ? and(eq(communities.status, 'active'), notInArray(communities.id, alreadyRequestedIds))
        : eq(communities.status, 'active'),
    );
  const eligible = await query;

  if (eligible.length === 0) return [];

  const useAi = Boolean(process.env.ANTHROPIC_API_KEY);

  // Score each community
  const scored: MatchResult[] = [];
  for (const community of eligible) {
    // Apply brand safety filter: skip hard-excluded communities
    const safety = checkBrandSafety(community, excludedCategories, excludedKeywords);
    if (safety.excluded) continue;

    let score: number;
    let rationale: string;

    if (useAi) {
      try {
        ({ score, rationale } = await scoreWithClaude(campaign, community));
      } catch {
        ({ score, rationale } = ruleBasedScore(campaign, community));
      }
    } else {
      ({ score, rationale } = ruleBasedScore(campaign, community));
    }

    if (score >= threshold) {
      scored.push({
        communityId: community.id,
        communityName: community.name,
        score,
        rationale,
        proposedRateCents: community.baseRate ?? Math.round((campaign.budgetCents ?? 50000) / 5),
        ...(safety.flagged ? { safetyFlagged: true, safetyFlagReasons: safety.reasons } : {}),
      });
    }
  }

  // Sort descending, take top N
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, topN);

  // Create partnership_requests for top matches
  if (top.length > 0) {
    await db.insert(partnershipRequests).values(
      top.map((m) => ({
        campaignId,
        communityId: m.communityId,
        matchScore: m.score,
        matchRationale: m.rationale,
        proposedRateCents: m.proposedRateCents,
        initiatedByAi: 1,
      })),
    );

    // Advance campaign to 'matching' status if still 'active'
    if (campaign.status === 'active') {
      await db.update(campaigns).set({ status: 'matching', updatedAt: new Date() }).where(eq(campaigns.id, campaignId));
    }

    // ── Notifications ────────────────────────────────────────────────────────

    // Brand: notify if this is the first batch of matches for this campaign
    if (existingRequests.length === 0 && brand?.brandEmail) {
      sendBrandFirstMatchEmail({
        brandEmail: brand.brandEmail,
        brandName: brand.brandName,
        campaignTitle: campaign.title,
        campaignId,
        matchCount: top.length,
      }).catch((err) => console.error('[email] brand first-match notification failed:', err));
    }

    const matchedCommunityIds = top.map((m) => m.communityId);

    if (notifyAll) {
      // ── Brand-acquisition mode: new brand's first campaign ────────────────
      // Notify ALL matched registered community owners with the acquisition template.
      const allMatchedOwners = await db
        .select({
          communityId: communities.id,
          communityName: communities.name,
          ownerEmail: communityOwners.email,
          ownerName: communityOwners.name,
        })
        .from(communities)
        .innerJoin(communityOwners, eq(communities.ownerId, communityOwners.id))
        .where(inArray(communities.id, matchedCommunityIds));

      for (const c of allMatchedOwners) {
        sendBrandAcquisitionNotificationEmail({
          ownerEmail: c.ownerEmail,
          ownerName: c.ownerName,
          communityName: c.communityName,
          brandName: brand?.brandName ?? 'A brand',
          niche: campaign.niche ?? null,
          campaignId,
        }).catch((err) => console.error('[email] brand-acquisition community notification failed:', err));
      }

      // Stub: outreach to scraped (unregistered) communities pending SPHA-50 board approval
      notifyScrapedCommunities(campaignId, brand?.brandName ?? 'A brand', campaign.niche ?? null, [])
        .catch((err) => console.error('[acquisition] scraped community notify failed:', err));
    } else {
      // ── Standard matching: only notify first-time community owners ─────────
      const priorCountRows = await db
        .select({ communityId: partnershipRequests.communityId, cnt: count() })
        .from(partnershipRequests)
        .where(inArray(partnershipRequests.communityId, matchedCommunityIds))
        .groupBy(partnershipRequests.communityId);

      const priorCountMap = new Map(priorCountRows.map((r) => [r.communityId, Number(r.cnt)]));

      // count === 1 means this is their very first opportunity (just inserted)
      const firstTimeCommunityIds = matchedCommunityIds.filter((id) => (priorCountMap.get(id) ?? 0) === 1);

      if (firstTimeCommunityIds.length > 0) {
        const firstTimeCommunities = await db
          .select({
            communityId: communities.id,
            communityName: communities.name,
            ownerEmail: communityOwners.email,
            ownerName: communityOwners.name,
          })
          .from(communities)
          .innerJoin(communityOwners, eq(communities.ownerId, communityOwners.id))
          .where(inArray(communities.id, firstTimeCommunityIds));

        for (const c of firstTimeCommunities) {
          sendCommunityOwnerFirstOpportunityEmail({
            ownerEmail: c.ownerEmail,
            ownerName: c.ownerName,
            communityName: c.communityName,
            campaignTitle: campaign.title,
            brandName: brand?.brandName ?? 'A brand',
            requestId: c.communityId,
          }).catch((err) => console.error('[email] community owner first-opportunity notification failed:', err));
        }
      }
    }
  }

  return top;
}
