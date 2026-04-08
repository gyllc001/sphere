import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { communities, communityOwners, scrapedCommunities } from '../db/schema';
import { eq, and, ilike, gte, lte, sql as drizzleSql } from 'drizzle-orm';
import { adminListDisputes, adminGetDispute, adminResolveDispute } from './disputes';
import { runScraper, getScraperStats } from '../services/scraper';

const router = Router();

// Simple API-key guard for admin routes
function requireAdminKey(req: Request, res: Response, next: Function) {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    return res.status(503).json({ error: 'Admin API not configured' });
  }
  const auth = req.headers['authorization'];
  const provided = auth?.startsWith('Bearer ') ? auth.slice(7) : req.headers['x-admin-key'];
  if (provided !== adminKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.use(requireAdminKey);

// ──────────────────────────────────────────────
// Bulk import schema
// ──────────────────────────────────────────────

const ImportRowSchema = z.object({
  communityName: z.string().min(1).max(255),
  adminName: z.string().min(1).max(255),
  adminEmail: z.string().email(),
  adminPhone: z.string().max(50).optional(),
  platform: z.enum(['discord', 'slack', 'telegram', 'whatsapp', 'facebook_group', 'reddit', 'circle', 'mighty_networks', 'other']),
  vertical: z.enum(['Tech', 'Gaming', 'Fashion', 'Mom', 'Finance', 'Health', 'Food', 'Travel', 'Other']).optional(),
  size: z.number().int().min(0).optional(),
  rateCents: z.number().int().min(0).optional(),
  adminDiscordUserId: z.string().max(50).optional(),
  adminFacebookPageId: z.string().max(100).optional(),
  status: z.enum(['active', 'inactive', 'pending_review']).optional().default('pending_review'),
});

type ImportRow = z.infer<typeof ImportRowSchema>;

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
  });
}

function normalizeRow(raw: Record<string, unknown>): Record<string, unknown> {
  // Map snake_case / varied keys to camelCase schema
  return {
    communityName: raw['communityName'] ?? raw['community_name'] ?? raw['name'],
    adminName: raw['adminName'] ?? raw['admin_name'],
    adminEmail: raw['adminEmail'] ?? raw['admin_email'] ?? raw['email'],
    adminPhone: raw['adminPhone'] ?? raw['admin_phone'] ?? raw['phone'] ?? undefined,
    platform: raw['platform'],
    vertical: raw['vertical'] ?? undefined,
    size: raw['size'] ? Number(raw['size']) : undefined,
    rateCents: raw['rateCents'] ?? raw['rate_cents']
      ? Number(raw['rateCents'] ?? raw['rate_cents'])
      : raw['rate']
        ? Math.round(Number(raw['rate']) * 100)
        : undefined,
    adminDiscordUserId: raw['adminDiscordUserId'] ?? raw['admin_discord_user_id'] ?? raw['discordUserId'] ?? undefined,
    adminFacebookPageId: raw['adminFacebookPageId'] ?? raw['admin_facebook_page_id'] ?? raw['facebookPageId'] ?? undefined,
    status: raw['status'] ?? 'pending_review',
  };
}

// POST /api/admin/communities/bulk-import
// Body: JSON array OR CSV text (Content-Type: text/csv)
router.post('/communities/bulk-import', async (req: Request, res: Response) => {
  let rows: Record<string, unknown>[];

  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('text/csv') || contentType.includes('text/plain')) {
    const text = typeof req.body === 'string' ? req.body : req.body?.toString?.() ?? '';
    const parsed = parseCsv(text);
    rows = parsed.map(normalizeRow);
  } else {
    const body = req.body;
    if (!Array.isArray(body)) {
      return res.status(400).json({ error: 'Body must be a JSON array of community records, or CSV text with Content-Type: text/csv' });
    }
    rows = (body as Record<string, unknown>[]).map(normalizeRow);
  }

  if (rows.length === 0) {
    return res.status(400).json({ error: 'No rows found in import body' });
  }
  if (rows.length > 1000) {
    return res.status(400).json({ error: 'Maximum 1000 rows per import' });
  }

  const results: { success: boolean; row: number; communityId?: string; ownerId?: string; error?: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const parsed = ImportRowSchema.safeParse(rows[i]);
    if (!parsed.success) {
      results.push({ success: false, row: i + 1, error: JSON.stringify(parsed.error.flatten().fieldErrors) });
      continue;
    }
    const data: ImportRow = parsed.data;

    try {
      // Upsert community owner by email
      let ownerId: string;
      const [existing] = await db
        .select({ id: communityOwners.id })
        .from(communityOwners)
        .where(eq(communityOwners.email, data.adminEmail))
        .limit(1);

      if (existing) {
        ownerId = existing.id;
      } else {
        const [newOwner] = await db
          .insert(communityOwners)
          .values({
            name: data.adminName,
            email: data.adminEmail,
            passwordHash: '', // placeholder — owner must set password via normal auth flow
          })
          .returning({ id: communityOwners.id });
        ownerId = newOwner.id;
      }

      // Create community
      const slug = `${toSlug(data.communityName)}-${Date.now()}-${i}`;
      const [community] = await db
        .insert(communities)
        .values({
          ownerId,
          name: data.communityName,
          slug,
          platform: data.platform,
          memberCount: data.size ?? 0,
          baseRate: data.rateCents,
          adminPhone: data.adminPhone,
          adminDiscordUserId: data.adminDiscordUserId,
          adminFacebookPageId: data.adminFacebookPageId,
          vertical: data.vertical,
          status: data.status ?? 'pending_review',
        })
        .returning({ id: communities.id });

      results.push({ success: true, row: i + 1, communityId: community.id, ownerId });
    } catch (err: any) {
      results.push({ success: false, row: i + 1, error: err.message });
    }
  }

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return res.status(200).json({
    total: rows.length,
    succeeded,
    failed,
    results,
  });
});

// ── Dispute review queue ───────────────────────────────────────────────────────

router.get('/disputes', adminListDisputes);
router.get('/disputes/:id', adminGetDispute);
router.post('/disputes/:id/resolve', adminResolveDispute);

// ── Scraped community database ─────────────────────────────────────────────────

/**
 * GET /api/admin/scraped-communities
 * Browse the scraped community database with optional filters.
 * Query params: platform, verificationStatus, niche, minMembers, maxMembers, q, limit, offset
 */
router.get('/scraped-communities', async (req: Request, res: Response) => {
  const schema = z.object({
    platform: z.string().optional(),
    verificationStatus: z.enum(['unverified', 'pending', 'verified']).optional(),
    niche: z.string().optional(),
    minMembers: z.coerce.number().int().min(0).optional(),
    maxMembers: z.coerce.number().int().min(0).optional(),
    q: z.string().max(200).optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    offset: z.coerce.number().int().min(0).default(0),
  });

  const parsed = schema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }

  const { platform, verificationStatus, niche, minMembers, maxMembers, q, limit, offset } = parsed.data;

  const conditions = [];
  if (platform) conditions.push(eq(scrapedCommunities.platform, platform));
  if (verificationStatus) conditions.push(eq(scrapedCommunities.verificationStatus, verificationStatus));
  if (minMembers != null) conditions.push(gte(scrapedCommunities.memberCount, minMembers));
  if (maxMembers != null) conditions.push(lte(scrapedCommunities.memberCount, maxMembers));
  if (q) conditions.push(ilike(scrapedCommunities.name, `%${q}%`));
  if (niche) {
    conditions.push(drizzleSql`${scrapedCommunities.nicheTags} @> ARRAY[${niche}]::text[]`);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ count }]] = await Promise.all([
    db
      .select()
      .from(scrapedCommunities)
      .where(where)
      .orderBy(drizzleSql`${scrapedCommunities.memberCount} DESC NULLS LAST`)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: drizzleSql<number>`COUNT(*)::int` })
      .from(scrapedCommunities)
      .where(where),
  ]);

  return res.json({ total: count, limit, offset, communities: rows });
});

/**
 * GET /api/admin/scraped-communities/stats
 * Summary stats: total count, breakdown by platform and verification status.
 */
router.get('/scraped-communities/stats', async (_req: Request, res: Response) => {
  const stats = await getScraperStats();
  return res.json(stats);
});

/**
 * PATCH /api/admin/scraped-communities/:id
 * Update verificationStatus (e.g. unverified -> pending -> verified).
 */
router.patch('/scraped-communities/:id', async (req: Request, res: Response) => {
  const schema = z.object({
    verificationStatus: z.enum(['unverified', 'pending', 'verified']).optional(),
    adminContactEmail: z.string().email().optional().nullable(),
    adminContactName: z.string().max(255).optional().nullable(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }

  const updates: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  // Remove undefined values
  for (const k of Object.keys(updates)) {
    if (updates[k] === undefined) delete updates[k];
  }

  const [updated] = await db
    .update(scrapedCommunities)
    .set(updates)
    .where(eq(scrapedCommunities.id, req.params.id))
    .returning();

  if (!updated) return res.status(404).json({ error: 'Not found' });
  return res.json(updated);
});

/**
 * POST /api/admin/scraper/run
 * Trigger a scraper run. Returns summary of results.
 * This is an async operation; for large runs, consider a background job.
 */
router.post('/scraper/run', async (_req: Request, res: Response) => {
  try {
    const results = await runScraper();
    const total = results.reduce((sum, r) => sum + r.inserted, 0);
    return res.json({ message: `Scraper completed. ${total} new communities inserted.`, results });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
