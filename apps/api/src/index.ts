import 'dotenv/config';
import { initSentry, Sentry } from './lib/sentry';
initSentry(); // must be called before any other imports that might throw
import express from 'express';
import { runScraper, getScraperStats } from './services/scraper';
import cors from 'cors';
import helmet from 'helmet';
import { pool as dbPool } from './db';
import brandAuthRoutes from './routes/brands.auth';
import communityAuthRoutes from './routes/communities.auth';
import campaignRoutes from './routes/campaigns';
import communityPortalRoutes from './routes/community-portal';
import matchingRoutes from './routes/matching';
import dealRoutes from './routes/deals';
import contentSubmissionRoutes from './routes/content-submissions';
import metricsRoutes from './routes/metrics';
import adminRoutes from './routes/admin';
import messageRoutes from './routes/messages';
import disputeRoutes from './routes/disputes';
import billingRoutes, { stripeWebhookHandler } from './routes/billing';
import dealFeedbackRoutes from './routes/deal-feedback';

const app = express();
const PORT = process.env.PORT || 4000;
console.log(`[startup] PORT=${PORT} NODE_ENV=${process.env.NODE_ENV} DATABASE_URL=${process.env.DATABASE_URL ? 'set' : 'MISSING'}`);

app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

// Stripe webhook must receive raw body — mount before express.json()
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

app.use(express.json());

app.get('/health', async (_req, res) => {
  let dbOk = false;
  try {
    await dbPool.query('SELECT 1');
    dbOk = true;
  } catch {
    // db unreachable
  }
  const status = dbOk ? 'ok' : 'degraded';
  res.status(dbOk ? 200 : 503).json({
    status,
    version: process.env.npm_package_version,
    db: dbOk ? 'connected' : 'unreachable',
    ts: new Date().toISOString(),
  });
});

// Diagnostic: test raw pool query against actual tables
app.get('/health/db-tables', async (_req, res) => {
  const results: Record<string, unknown> = {};
  try {
    const tableResult = await dbPool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name",
    );
    results.tables = tableResult.rows.map((r: { table_name: string }) => r.table_name);
  } catch (err) {
    results.tables_error = String(err);
  }

  // Test raw query on brands table directly (detect table locks)
  try {
    const brandsResult = await dbPool.query('SELECT COUNT(*) FROM brands');
    results.brands_count = brandsResult.rows[0].count;
  } catch (err) {
    results.brands_error = String(err);
  }

  // Test raw parameterized WHERE query on brands
  try {
    const paramResult = await dbPool.query('SELECT id FROM brands WHERE email = $1 LIMIT 1', ['nobody@nowhere.invalid']);
    results.brands_where_raw_rows = paramResult.rows.length;
  } catch (err) {
    results.brands_where_raw_error = String(err);
  }

  // Test Drizzle ORM query on brands table (no WHERE)
  try {
    const { db: drizzleDb } = await import('./db');
    const { brands: brandsTable } = await import('./db/schema');
    const { eq: eqFn } = await import('drizzle-orm');
    const rows = await drizzleDb.select({ id: brandsTable.id }).from(brandsTable).limit(1);
    results.drizzle_brands_nowhere_ok = true;
    results.drizzle_brands_nowhere_sample = rows.length;

    // Test Drizzle ORM query with WHERE clause (id only)
    const whereRows = await drizzleDb.select({ id: brandsTable.id }).from(brandsTable).where(eqFn(brandsTable.email, 'nobody@nowhere.invalid')).limit(1);
    results.drizzle_brands_where_ok = true;
    results.drizzle_brands_where_rows = whereRows.length;

    // Test Drizzle SELECT * (all columns) with WHERE — mirrors the login query exactly
    const fullRows = await drizzleDb.select().from(brandsTable).where(eqFn(brandsTable.email, 'nobody@nowhere.invalid')).limit(1);
    results.drizzle_brands_full_select_ok = true;
    results.drizzle_brands_full_select_rows = fullRows.length;
  } catch (err) {
    results.drizzle_brands_error = String(err);
  }

  res.json(results);
});

app.use('/api/brands/auth', brandAuthRoutes);
app.use('/api/communities/auth', communityAuthRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/owner', communityPortalRoutes);
app.use('/api/campaigns', matchingRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/deals/:dealId/content', contentSubmissionRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/admin', express.text({ type: ['text/csv', 'text/plain'] }), adminRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/deals/:dealId/feedback', dealFeedbackRoutes);

// Sentry error handler — must be before the generic error handler
app.use(Sentry.expressErrorHandler());

// Global error handler — prevent unhandled async route errors from crashing the process
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled route error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
  Sentry.captureException(reason);
});

// ─── Scraper Scheduler ────────────────────────────────────────────────────────

const SCRAPER_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
const SCRAPER_STARTUP_THRESHOLD = 100; // trigger immediate scrape if fewer records
let scraperRunning = false;

async function runScheduledScrape(reason = 'interval'): Promise<void> {
  if (scraperRunning) {
    console.log('[scraper] run skipped — already running');
    return;
  }
  scraperRunning = true;
  console.log(`[scraper] run started (${reason})`);
  try {
    const results = await runScraper();
    const newTotal = results.reduce((sum, r) => sum + r.inserted, 0);
    const fetched = results.reduce((sum, r) => sum + r.fetched, 0);
    const stats = await getScraperStats();
    console.log(`[scraper] run complete: ${newTotal} new, ${stats.total} total (fetched ${fetched})`);
  } catch (err) {
    console.error('[scraper] run error:', err);
    Sentry.captureException(err);
  } finally {
    scraperRunning = false;
  }
}

// Idempotent schema corrections — runs at startup and via POST /health/apply-corrections
async function applySchemaCorrections(): Promise<{ applied: string[]; errors: string[] }> {
  const applied: string[] = [];
  const errors: string[] = [];

  const stmts: Array<{ label: string; sql: string; params?: unknown[] }> = [
    {
      label: 'create subscription_tier enum',
      sql: `DO $$ BEGIN CREATE TYPE "public"."subscription_tier" AS ENUM('starter','growth','scale'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    },
    { label: 'brands.stripe_customer_id', sql: `ALTER TABLE brands ADD COLUMN IF NOT EXISTS stripe_customer_id text` },
    { label: 'brands.stripe_subscription_id', sql: `ALTER TABLE brands ADD COLUMN IF NOT EXISTS stripe_subscription_id text` },
    { label: 'brands.subscription_tier', sql: `ALTER TABLE brands ADD COLUMN IF NOT EXISTS subscription_tier "subscription_tier"` },
    { label: 'brands.subscription_status', sql: `ALTER TABLE brands ADD COLUMN IF NOT EXISTS subscription_status varchar(50)` },
    { label: 'brands.partnership_limit', sql: `ALTER TABLE brands ADD COLUMN IF NOT EXISTS partnership_limit integer NOT NULL DEFAULT 0` },
    { label: 'brands.email_verification_token', sql: `ALTER TABLE brands ADD COLUMN IF NOT EXISTS email_verification_token text` },
    { label: 'brands.email_verification_token_expires_at', sql: `ALTER TABLE brands ADD COLUMN IF NOT EXISTS email_verification_token_expires_at timestamp` },
    { label: 'brands.email_verified_at', sql: `ALTER TABLE brands ADD COLUMN IF NOT EXISTS email_verified_at timestamp` },
    { label: 'brands.password_reset_token', sql: `ALTER TABLE brands ADD COLUMN IF NOT EXISTS password_reset_token text` },
    { label: 'brands.password_reset_token_expires_at', sql: `ALTER TABLE brands ADD COLUMN IF NOT EXISTS password_reset_token_expires_at timestamp` },
    { label: 'brands.tos_accepted_at', sql: `ALTER TABLE brands ADD COLUMN IF NOT EXISTS tos_accepted_at timestamp` },
    { label: 'brands.tos_version', sql: `ALTER TABLE brands ADD COLUMN IF NOT EXISTS tos_version varchar(50)` },
    { label: 'brands.brand_safety_categories', sql: `ALTER TABLE brands ADD COLUMN IF NOT EXISTS brand_safety_categories text[] NOT NULL DEFAULT '{}'` },
    { label: 'brands.brand_safety_keywords', sql: `ALTER TABLE brands ADD COLUMN IF NOT EXISTS brand_safety_keywords text[] NOT NULL DEFAULT '{}'` },
    { label: 'community_owners.email_verification_token', sql: `ALTER TABLE community_owners ADD COLUMN IF NOT EXISTS email_verification_token text` },
    { label: 'community_owners.email_verification_token_expires_at', sql: `ALTER TABLE community_owners ADD COLUMN IF NOT EXISTS email_verification_token_expires_at timestamp` },
    { label: 'community_owners.email_verified_at', sql: `ALTER TABLE community_owners ADD COLUMN IF NOT EXISTS email_verified_at timestamp` },
    { label: 'community_owners.password_reset_token', sql: `ALTER TABLE community_owners ADD COLUMN IF NOT EXISTS password_reset_token text` },
    { label: 'community_owners.password_reset_token_expires_at', sql: `ALTER TABLE community_owners ADD COLUMN IF NOT EXISTS password_reset_token_expires_at timestamp` },
    { label: 'community_owners.tos_accepted_at', sql: `ALTER TABLE community_owners ADD COLUMN IF NOT EXISTS tos_accepted_at timestamp` },
    { label: 'community_owners.tos_version', sql: `ALTER TABLE community_owners ADD COLUMN IF NOT EXISTS tos_version varchar(50)` },
    { label: 'community_owners.wallet_balance_cents', sql: `ALTER TABLE community_owners ADD COLUMN IF NOT EXISTS wallet_balance_cents integer NOT NULL DEFAULT 0` },
  ];

  for (const stmt of stmts) {
    try {
      await dbPool.query(stmt.sql);
      applied.push(stmt.label);
    } catch (err) {
      errors.push(`${stmt.label}: ${String(err)}`);
    }
  }
  return { applied, errors };
}

// Admin-protected endpoint to manually trigger schema corrections without a redeploy
app.post('/health/apply-corrections', async (req, res) => {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey || req.headers['x-admin-key'] !== adminKey) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const result = await applySchemaCorrections();
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

app.listen(PORT, async () => {
  console.log(`Sphere API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);

  // Apply idempotent schema corrections at startup to fix any journal/DB drift
  console.log('[startup] Applying schema corrections...');
  const corrections = await applySchemaCorrections();
  const failedCount = corrections.errors.length;
  if (failedCount > 0) {
    console.error('[startup] Schema corrections had errors:', corrections.errors);
  } else {
    console.log(`[startup] Schema corrections complete (${corrections.applied.length} statements).`);
  }

  // Trigger an immediate scrape on startup if the database is sparse
  try {
    const stats = await getScraperStats();
    if (stats.total < SCRAPER_STARTUP_THRESHOLD) {
      console.log(`[scraper] startup: only ${stats.total} records found (threshold ${SCRAPER_STARTUP_THRESHOLD}) — triggering initial scrape`);
      runScheduledScrape('startup').catch(() => {/* already logged inside */});
    } else {
      console.log(`[scraper] startup: ${stats.total} records in database — no immediate scrape needed`);
    }
  } catch (err) {
    console.error('[scraper] startup stats check error:', err);
  }

  // Schedule scraper to run every 6 hours
  setInterval(() => {
    runScheduledScrape('interval').catch(() => {/* already logged inside */});
  }, SCRAPER_INTERVAL_MS);
  console.log(`[scraper] scheduled — runs every ${SCRAPER_INTERVAL_MS / 3600000}h`);
});

export default app;
