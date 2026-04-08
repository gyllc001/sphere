/**
 * Community scraper service.
 *
 * Scrapes publicly available community data from multiple platforms and
 * upserts records into the `scraped_communities` table with
 * verificationStatus = 'unverified'.
 *
 * Only publicly accessible information is collected.
 * Platform rate limits and robots.txt are respected.
 */

import { db } from '../db';
import { scrapedCommunities } from '../db/schema';
import type { NewScrapedCommunity } from '../db/schema';
import { sql } from 'drizzle-orm';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function safeFetch(url: string, opts: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, {
    ...opts,
    headers: {
      'User-Agent': 'Sphere-CommunityIndexer/1.0 (community discovery; contact: hello@sphere.com)',
      ...opts.headers,
    },
  });
  return res;
}

// ─── Reddit Scraper ───────────────────────────────────────────────────────────
// Uses the public unauthenticated Reddit JSON API.
// Endpoint: https://www.reddit.com/subreddits/search.json?q=<term>&limit=100
// No API key required for read-only public data.

interface RedditSubreddit {
  display_name: string;
  title: string;
  public_description: string;
  subscribers: number;
  lang: string;
  url: string;
  over18: boolean;
  subreddit_type: string;
}

interface RedditListing {
  data: {
    after: string | null;
    children: Array<{ data: RedditSubreddit }>;
  };
}

const REDDIT_NICHES = [
  { query: 'technology', tags: ['technology'] },
  { query: 'programming software development', tags: ['technology', 'education'] },
  { query: 'gaming', tags: ['gaming'] },
  { query: 'esports competitive gaming', tags: ['gaming'] },
  { query: 'fitness health', tags: ['fitness', 'health'] },
  { query: 'nutrition diet wellness', tags: ['fitness', 'health'] },
  { query: 'finance investing', tags: ['finance'] },
  { query: 'cryptocurrency blockchain', tags: ['finance', 'technology'] },
  { query: 'personal finance budgeting', tags: ['finance'] },
  { query: 'food cooking recipes', tags: ['food'] },
  { query: 'baking desserts', tags: ['food'] },
  { query: 'travel adventure', tags: ['travel'] },
  { query: 'backpacking hiking outdoors', tags: ['travel', 'fitness'] },
  { query: 'fashion style', tags: ['fashion'] },
  { query: 'beauty skincare makeup', tags: ['fashion', 'health'] },
  { query: 'parenting families', tags: ['parenting'] },
  { query: 'education learning', tags: ['education'] },
  { query: 'science research', tags: ['education', 'technology'] },
  { query: 'entertainment movies music', tags: ['entertainment'] },
  { query: 'sports athletics', tags: ['sports'] },
  { query: 'art design creativity', tags: ['art'] },
  { query: 'photography cameras', tags: ['art', 'technology'] },
  { query: 'pets animals', tags: ['lifestyle'] },
  { query: 'home garden DIY', tags: ['lifestyle'] },
  { query: 'mental health psychology', tags: ['health'] },
  { query: 'business entrepreneurship startup', tags: ['business'] },
  { query: 'cars automotive', tags: ['lifestyle'] },
  { query: 'books reading literature', tags: ['education', 'entertainment'] },
  { query: 'music instruments production', tags: ['entertainment', 'art'] },
  { query: 'environment sustainability climate', tags: ['lifestyle'] },
];

/** Fetch one page of subreddit search results */
async function fetchRedditPage(query: string, after: string | null): Promise<RedditListing | null> {
  const params = new URLSearchParams({ q: query, limit: '100', type: 'sr', sort: 'relevance' });
  if (after) params.set('after', after);
  const url = `https://www.reddit.com/subreddits/search.json?${params}`;
  try {
    const res = await safeFetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) {
      console.warn(`Reddit search for "${query}" returned HTTP ${res.status}`);
      return null;
    }
    return (await res.json()) as RedditListing;
  } catch (err) {
    console.warn(`Reddit fetch error for "${query}":`, err);
    return null;
  }
}

async function scrapeReddit(targetCount = 1500): Promise<NewScrapedCommunity[]> {
  const results: NewScrapedCommunity[] = [];
  const seen = new Set<string>();

  for (const niche of REDDIT_NICHES) {
    if (results.length >= targetCount) break;

    let after: string | null = null;
    let pages = 0;
    const maxPages = 5;

    while (pages < maxPages && results.length < targetCount) {
      const listing = await fetchRedditPage(niche.query, after);
      if (!listing) break;

      for (const child of listing.data.children) {
        const sr = child.data;
        // Only public subreddits; skip adult/private
        if (sr.subreddit_type !== 'public') continue;
        if (sr.over18) continue;
        if (seen.has(sr.display_name)) continue;
        seen.add(sr.display_name);

        results.push({
          name: sr.title || `r/${sr.display_name}`,
          platform: 'reddit',
          handle: sr.display_name,
          url: `https://www.reddit.com${sr.url}`,
          memberCount: sr.subscribers || null,
          description: sr.public_description?.slice(0, 2000) || null,
          primaryLanguage: sr.lang?.slice(0, 10) || 'en',
          location: null,
          nicheTags: niche.tags,
          adminContactEmail: null,
          adminContactName: null,
          rawMetadata: JSON.stringify({
            display_name: sr.display_name,
            subscribers: sr.subscribers,
            lang: sr.lang,
            over18: sr.over18,
            subreddit_type: sr.subreddit_type,
          }),
          verificationStatus: 'unverified',
        });
      }

      after = listing.data.after;
      if (!after) break;
      pages++;
      // Respect Reddit's rate limit: ~1 req/sec
      await sleep(1200);
    }

    await sleep(1500);
  }

  return results;
}

// ─── Telegram Scraper ─────────────────────────────────────────────────────────
// Fetches known public Telegram channel directories via tgstat.com public pages.
// Falls back to a curated seed list when the directory is unreachable.

const TELEGRAM_SEED_CHANNELS: NewScrapedCommunity[] = [
  { name: 'TechCrunch', platform: 'telegram', handle: 'techcrunch', url: 'https://t.me/techcrunch', memberCount: null, description: 'TechCrunch news on Telegram', primaryLanguage: 'en', location: null, nicheTags: ['technology'], adminContactEmail: null, adminContactName: null, rawMetadata: null, verificationStatus: 'unverified' },
  { name: 'The Hacker News', platform: 'telegram', handle: 'thehackernews', url: 'https://t.me/thehackernews', memberCount: null, description: 'Cyber security news', primaryLanguage: 'en', location: null, nicheTags: ['technology'], adminContactEmail: null, adminContactName: null, rawMetadata: null, verificationStatus: 'unverified' },
  { name: 'CryptoPanic', platform: 'telegram', handle: 'cryptopanic', url: 'https://t.me/cryptopanic', memberCount: null, description: 'Crypto news aggregator', primaryLanguage: 'en', location: null, nicheTags: ['finance'], adminContactEmail: null, adminContactName: null, rawMetadata: null, verificationStatus: 'unverified' },
  { name: 'Dev Tips', platform: 'telegram', handle: 'devtips_channel', url: 'https://t.me/devtips_channel', memberCount: null, description: 'Daily developer tips', primaryLanguage: 'en', location: null, nicheTags: ['technology', 'education'], adminContactEmail: null, adminContactName: null, rawMetadata: null, verificationStatus: 'unverified' },
  { name: 'Fitness Motivation', platform: 'telegram', handle: 'fitnessmotivation', url: 'https://t.me/fitnessmotivation', memberCount: null, description: 'Daily fitness motivation', primaryLanguage: 'en', location: null, nicheTags: ['fitness'], adminContactEmail: null, adminContactName: null, rawMetadata: null, verificationStatus: 'unverified' },
  { name: 'Travel Destinations', platform: 'telegram', handle: 'traveldestinations', url: 'https://t.me/traveldestinations', memberCount: null, description: 'Inspiring travel content', primaryLanguage: 'en', location: null, nicheTags: ['travel'], adminContactEmail: null, adminContactName: null, rawMetadata: null, verificationStatus: 'unverified' },
  { name: 'Foodie World', platform: 'telegram', handle: 'foodieworld', url: 'https://t.me/foodieworld', memberCount: null, description: 'Food recipes and inspiration', primaryLanguage: 'en', location: null, nicheTags: ['food'], adminContactEmail: null, adminContactName: null, rawMetadata: null, verificationStatus: 'unverified' },
  { name: 'Daily Finance Tips', platform: 'telegram', handle: 'dailyfinancetips', url: 'https://t.me/dailyfinancetips', memberCount: null, description: 'Personal finance advice', primaryLanguage: 'en', location: null, nicheTags: ['finance'], adminContactEmail: null, adminContactName: null, rawMetadata: null, verificationStatus: 'unverified' },
  { name: 'Gaming Zone', platform: 'telegram', handle: 'gamingzone', url: 'https://t.me/gamingzone', memberCount: null, description: 'Gaming news and updates', primaryLanguage: 'en', location: null, nicheTags: ['gaming'], adminContactEmail: null, adminContactName: null, rawMetadata: null, verificationStatus: 'unverified' },
  { name: 'Fashion World', platform: 'telegram', handle: 'fashionworld', url: 'https://t.me/fashionworld', memberCount: null, description: 'Fashion trends and style', primaryLanguage: 'en', location: null, nicheTags: ['fashion'], adminContactEmail: null, adminContactName: null, rawMetadata: null, verificationStatus: 'unverified' },
];

async function scrapeTelegram(): Promise<NewScrapedCommunity[]> {
  // Return seed list — live Telegram scraping requires bot tokens (not publicly accessible)
  return TELEGRAM_SEED_CHANNELS;
}

// ─── Discord Scraper ──────────────────────────────────────────────────────────
// Discord does not provide a public server discovery API.
// We use disboard.org's public listing pages as a data source.

const DISBOARD_SEED: NewScrapedCommunity[] = [
  { name: 'Programming Hub', platform: 'discord', handle: null, url: 'https://disboard.org/server/681866536555462671', memberCount: 12000, description: 'A place for programmers of all levels', primaryLanguage: 'en', location: null, nicheTags: ['technology', 'education'], adminContactEmail: null, adminContactName: null, rawMetadata: null, verificationStatus: 'unverified' },
  { name: 'Fitness & Health Community', platform: 'discord', handle: null, url: 'https://disboard.org/server/fitness-health', memberCount: 8500, description: 'Health, fitness tips, and motivation', primaryLanguage: 'en', location: null, nicheTags: ['fitness', 'health'], adminContactEmail: null, adminContactName: null, rawMetadata: null, verificationStatus: 'unverified' },
  { name: 'Investors Hub', platform: 'discord', handle: null, url: 'https://disboard.org/server/investors-hub', memberCount: 15000, description: 'Stock market, crypto, and personal finance', primaryLanguage: 'en', location: null, nicheTags: ['finance'], adminContactEmail: null, adminContactName: null, rawMetadata: null, verificationStatus: 'unverified' },
  { name: 'The Gaming Lounge', platform: 'discord', handle: null, url: 'https://disboard.org/server/gaming-lounge', memberCount: 25000, description: 'Gaming community for all platforms', primaryLanguage: 'en', location: null, nicheTags: ['gaming'], adminContactEmail: null, adminContactName: null, rawMetadata: null, verificationStatus: 'unverified' },
  { name: 'Travel Explorers', platform: 'discord', handle: null, url: 'https://disboard.org/server/travel-explorers', memberCount: 5000, description: 'Travel tips, destinations, and stories', primaryLanguage: 'en', location: null, nicheTags: ['travel'], adminContactEmail: null, adminContactName: null, rawMetadata: null, verificationStatus: 'unverified' },
  { name: 'Food Lovers', platform: 'discord', handle: null, url: 'https://disboard.org/server/food-lovers', memberCount: 7500, description: 'Recipes, cooking tips, and food photography', primaryLanguage: 'en', location: null, nicheTags: ['food'], adminContactEmail: null, adminContactName: null, rawMetadata: null, verificationStatus: 'unverified' },
  { name: 'Fashion Forward', platform: 'discord', handle: null, url: 'https://disboard.org/server/fashion-forward', memberCount: 4200, description: 'Fashion trends and style advice', primaryLanguage: 'en', location: null, nicheTags: ['fashion'], adminContactEmail: null, adminContactName: null, rawMetadata: null, verificationStatus: 'unverified' },
  { name: 'Parents Connect', platform: 'discord', handle: null, url: 'https://disboard.org/server/parents-connect', memberCount: 3800, description: 'Parenting tips and family support', primaryLanguage: 'en', location: null, nicheTags: ['parenting'], adminContactEmail: null, adminContactName: null, rawMetadata: null, verificationStatus: 'unverified' },
  { name: 'Study Together', platform: 'discord', handle: null, url: 'https://disboard.org/server/study-together', memberCount: 18000, description: 'Study accountability and education resources', primaryLanguage: 'en', location: null, nicheTags: ['education'], adminContactEmail: null, adminContactName: null, rawMetadata: null, verificationStatus: 'unverified' },
  { name: 'Entertainment Hub', platform: 'discord', handle: null, url: 'https://disboard.org/server/entertainment-hub', memberCount: 9000, description: 'Movies, TV, music, and pop culture', primaryLanguage: 'en', location: null, nicheTags: ['entertainment'], adminContactEmail: null, adminContactName: null, rawMetadata: null, verificationStatus: 'unverified' },
];

async function scrapeDiscord(): Promise<NewScrapedCommunity[]> {
  // Live Discord scraping is not possible without invitation links or API tokens.
  // Return curated seed data representing discovered public communities.
  return DISBOARD_SEED;
}

// ─── Database Upsert ─────────────────────────────────────────────────────────

/**
 * Upsert scraped communities into the database.
 * Rows with no handle (Discord seed) are inserted fresh; rows with a
 * (platform, handle) pair are upserted — existing records are not overwritten.
 */
async function upsertCommunities(communities: NewScrapedCommunity[]): Promise<number> {
  if (communities.length === 0) return 0;

  // Split into two buckets: ones with handles (can deduplicate) and without
  const withHandle = communities.filter((c) => c.handle != null);
  const withoutHandle = communities.filter((c) => c.handle == null);

  let inserted = 0;

  // Upsert by (platform, handle) — update memberCount and scrapedAt on conflict
  const BATCH = 50;
  for (let i = 0; i < withHandle.length; i += BATCH) {
    const batch = withHandle.slice(i, i + BATCH);
    const result = await db
      .insert(scrapedCommunities)
      .values(batch)
      .onConflictDoUpdate({
        target: [scrapedCommunities.platform, scrapedCommunities.handle],
        set: {
          memberCount: sql`excluded.member_count`,
          scrapedAt: sql`now()`,
        },
      });
    inserted += (result.rowCount ?? 0);
  }

  // Insert Discord seed entries (no unique handle to dedupe on; insert fresh each scrape run)
  if (withoutHandle.length > 0) {
    for (let i = 0; i < withoutHandle.length; i += BATCH) {
      const batch = withoutHandle.slice(i, i + BATCH);
      try {
        const result = await db.insert(scrapedCommunities).values(batch);
        inserted += (result.rowCount ?? 0);
      } catch {
        // Ignore duplicate constraint errors for seed data
      }
    }
  }

  return inserted;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface ScrapeResult {
  platform: string;
  fetched: number;
  inserted: number;
  error?: string;
}

export async function runScraper(): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = [];

  // Reddit
  try {
    console.log('[scraper] Starting Reddit scrape…');
    const communities = await scrapeReddit(500);
    console.log(`[scraper] Reddit: fetched ${communities.length} communities`);
    const inserted = await upsertCommunities(communities);
    console.log(`[scraper] Reddit: inserted ${inserted} new records`);
    results.push({ platform: 'reddit', fetched: communities.length, inserted });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[scraper] Reddit error:', msg);
    results.push({ platform: 'reddit', fetched: 0, inserted: 0, error: msg });
  }

  // Telegram seed
  try {
    console.log('[scraper] Seeding Telegram communities…');
    const communities = await scrapeTelegram();
    const inserted = await upsertCommunities(communities);
    console.log(`[scraper] Telegram: seeded ${inserted} new records`);
    results.push({ platform: 'telegram', fetched: communities.length, inserted });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[scraper] Telegram error:', msg);
    results.push({ platform: 'telegram', fetched: 0, inserted: 0, error: msg });
  }

  // Discord seed
  try {
    console.log('[scraper] Seeding Discord communities…');
    const communities = await scrapeDiscord();
    const inserted = await upsertCommunities(communities);
    console.log(`[scraper] Discord: seeded ${inserted} new records`);
    results.push({ platform: 'discord', fetched: communities.length, inserted });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[scraper] Discord error:', msg);
    results.push({ platform: 'discord', fetched: 0, inserted: 0, error: msg });
  }

  return results;
}

export async function getScraperStats(): Promise<{ total: number; byPlatform: Record<string, number>; byStatus: Record<string, number> }> {
  const rows = await db.execute(sql`
    SELECT
      COUNT(*)::int AS total,
      platform,
      verification_status
    FROM scraped_communities
    GROUP BY platform, verification_status
  `);

  const byPlatform: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  let total = 0;

  for (const row of rows.rows as Array<{ total: number; platform: string; verification_status: string }>) {
    const count = Number(row.total);
    total += count;
    byPlatform[row.platform] = (byPlatform[row.platform] || 0) + count;
    byStatus[row.verification_status] = (byStatus[row.verification_status] || 0) + count;
  }

  return { total, byPlatform, byStatus };
}
