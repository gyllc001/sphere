/**
 * Seed scraped_communities from the two CSV attachments on SPHA-60/SPHA-65.
 *
 * Run:
 *   DATABASE_URL=postgresql://... PAPERCLIP_API_URL=... PAPERCLIP_API_KEY=... \
 *     npx ts-node --project apps/api/tsconfig.json apps/api/src/scripts/seed-communities.ts
 *
 * Sources:
 *   - Gaming Discord communities  (246 rows): attachment 33baf2b9-840b-4558-b975-1caf6dff86d5
 *   - Health & Wellness Facebook  ( 23 rows): attachment ddb2020e-9382-4c18-a8b1-28ac267aeca2
 */

import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql as drizzleSql } from 'drizzle-orm';
import { scrapedCommunities } from '../db/schema/scraped_communities';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Parse a member-count string like "32445 Members", "53.1K members", "2.3M members" → integer */
function parseMemberCount(raw: string): number | null {
  if (!raw) return null;
  const s = raw.replace(/,/g, '').trim();
  const m = s.match(/^([\d.]+)\s*([KkMm])?\s*(members?|subscribers?)?$/i);
  if (!m) return null;
  const num = parseFloat(m[1]);
  if (isNaN(num)) return null;
  const mult = m[2]?.toUpperCase() === 'K' ? 1000 : m[2]?.toUpperCase() === 'M' ? 1_000_000 : 1;
  return Math.round(num * mult);
}

/**
 * Minimal RFC-4180 CSV parser that handles:
 * - Quoted fields (with embedded commas/newlines)
 * - Double-quote escaping
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(field.trim());
        field = '';
      } else if (ch === '\n') {
        row.push(field.trim());
        if (row.some((f) => f !== '')) rows.push(row);
        row = [];
        field = '';
      } else if (ch === '\r') {
        // skip bare CR
      } else {
        field += ch;
      }
    }
  }
  // last field / row
  row.push(field.trim());
  if (row.some((f) => f !== '')) rows.push(row);
  return rows;
}

async function fetchAttachment(attachmentId: string): Promise<string> {
  const url = `${process.env.PAPERCLIP_API_URL}/api/attachments/${attachmentId}/content`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.PAPERCLIP_API_KEY}` },
  });
  if (!resp.ok) throw new Error(`Failed to fetch attachment ${attachmentId}: ${resp.status}`);
  return resp.text();
}

// ── Parsers ──────────────────────────────────────────────────────────────────

interface SeedRow {
  name: string;
  platform: string;
  handle: string | null;
  url: string | null;
  memberCount: number | null;
  nicheTags: string[];
  adminContactEmail: string | null;
  adminContactName: string | null;
}

function parseGamingCsv(text: string): SeedRow[] {
  const rows = parseCsv(text);
  // Header: Channel Name, Channel Category, Channel, Channel Link, Members, "Administator\nUsername", Contact Method
  // rows[0] is the header row
  const data = rows.slice(1);
  return data
    .filter((r) => r.length >= 6 && r[0])
    .map((r) => {
      const [name, category, , link, members, adminUsername, contactMethod] = r;
      const url = link?.trim() || null;
      // Extract Discord handle from invite URL: https://discord.com/invite/{handle}
      const handleMatch = url?.match(/discord\.com\/invite\/([^/?#]+)/i);
      const handle = handleMatch ? handleMatch[1] : null;
      // Contact Method may be an email or a username — only keep if looks like email
      const email = contactMethod?.includes('@') ? contactMethod.trim() : null;
      return {
        name: name.trim(),
        platform: 'discord',
        handle,
        url,
        memberCount: parseMemberCount(members ?? ''),
        nicheTags: category ? [category.trim()] : [],
        adminContactEmail: email,
        adminContactName: adminUsername?.trim() || null,
      };
    });
}

function parseHealthCsv(text: string): SeedRow[] {
  const rows = parseCsv(text);
  // Header: Community Name, Category, Link, Members, Email, Country?
  const data = rows.slice(1);
  return data
    .filter((r) => r.length >= 4 && r[0])
    .map((r) => {
      const [name, category, link, members, email] = r;
      const url = link?.trim() || null;
      // Facebook groups don't have a clean short handle — use URL path as handle
      const handle = url?.replace(/https?:\/\/[^/]+/, '').replace(/\/$/, '') || null;
      return {
        name: name.trim(),
        platform: 'facebook',
        handle,
        url,
        memberCount: parseMemberCount(members ?? ''),
        nicheTags: category ? [category.trim()] : [],
        adminContactEmail: email?.trim() || null,
        adminContactName: null,
      };
    });
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is required');
  if (!process.env.PAPERCLIP_API_URL) throw new Error('PAPERCLIP_API_URL is required');
  if (!process.env.PAPERCLIP_API_KEY) throw new Error('PAPERCLIP_API_KEY is required');

  const pool = new Pool({ connectionString: dbUrl });
  const db = drizzle(pool);

  console.log('Fetching Gaming Communities CSV...');
  const gamingCsv = await fetchAttachment('33baf2b9-840b-4558-b975-1caf6dff86d5');
  const gamingRows = parseGamingCsv(gamingCsv);
  console.log(`  Parsed ${gamingRows.length} gaming rows`);

  console.log('Fetching Health & Wellness Communities CSV...');
  const healthCsv = await fetchAttachment('ddb2020e-9382-4c18-a8b1-28ac267aeca2');
  const healthRows = parseHealthCsv(healthCsv);
  console.log(`  Parsed ${healthRows.length} health rows`);

  const allRows = [...gamingRows, ...healthRows];

  // Deduplicate on URL (keep first occurrence per URL)
  const seenUrls = new Set<string>();
  const deduped = allRows.filter((r) => {
    const key = r.url?.toLowerCase() ?? `nourl-${r.name}`;
    if (seenUrls.has(key)) return false;
    seenUrls.add(key);
    return true;
  });
  console.log(`Total after dedup: ${deduped.length} rows (removed ${allRows.length - deduped.length} duplicates)`);

  // Upsert: on conflict (platform, handle) do nothing to avoid clobbering existing data
  let inserted = 0;
  let skipped = 0;
  for (const row of deduped) {
    try {
      await db
        .insert(scrapedCommunities)
        .values({
          name: row.name,
          platform: row.platform,
          handle: row.handle ?? undefined,
          url: row.url ?? undefined,
          memberCount: row.memberCount ?? undefined,
          nicheTags: row.nicheTags,
          adminContactEmail: row.adminContactEmail ?? undefined,
          adminContactName: row.adminContactName ?? undefined,
          verificationStatus: 'unverified',
        })
        .onConflictDoNothing();
      inserted++;
    } catch (err) {
      console.warn(`  Skipped "${row.name}" (${row.url}): ${(err as Error).message}`);
      skipped++;
    }
  }

  // Final count
  const [{ count }] = await db
    .select({ count: drizzleSql<number>`COUNT(*)::int` })
    .from(scrapedCommunities);
  console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}`);
  console.log(`Total scraped_communities in DB: ${count}`);

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
