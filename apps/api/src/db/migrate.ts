import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'path';

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 15_000,
  });
  const db = drizzle(pool);

  console.log('Running database migrations...');
  try {
    await migrate(db, { migrationsFolder: path.join(__dirname, '../../migrations') });
    console.log('Migrations complete.');
  } catch (err) {
    console.error('[migrate] MIGRATION FAILED — schema may be out of sync:', err);
  }

  // Always apply missing columns idempotently — fixes journal/DB drift.
  // Each ALTER TABLE uses IF NOT EXISTS so safe to run on every deploy.
  console.log('[migrate] Applying idempotent schema corrections...');
  try {
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."subscription_tier" AS ENUM('starter', 'growth', 'scale');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    const brandCols = [
      `ALTER TABLE brands ADD COLUMN IF NOT EXISTS stripe_customer_id text`,
      `ALTER TABLE brands ADD COLUMN IF NOT EXISTS stripe_subscription_id text`,
      `ALTER TABLE brands ADD COLUMN IF NOT EXISTS subscription_tier "subscription_tier"`,
      `ALTER TABLE brands ADD COLUMN IF NOT EXISTS subscription_status varchar(50)`,
      `ALTER TABLE brands ADD COLUMN IF NOT EXISTS partnership_limit integer NOT NULL DEFAULT 0`,
      `ALTER TABLE brands ADD COLUMN IF NOT EXISTS wallet_balance_cents integer NOT NULL DEFAULT 0`,
      `ALTER TABLE brands ADD COLUMN IF NOT EXISTS email_verification_token text`,
      `ALTER TABLE brands ADD COLUMN IF NOT EXISTS email_verification_token_expires_at timestamp`,
      `ALTER TABLE brands ADD COLUMN IF NOT EXISTS email_verified_at timestamp`,
      `ALTER TABLE brands ADD COLUMN IF NOT EXISTS password_reset_token text`,
      `ALTER TABLE brands ADD COLUMN IF NOT EXISTS password_reset_token_expires_at timestamp`,
      `ALTER TABLE brands ADD COLUMN IF NOT EXISTS tos_accepted_at timestamp`,
      `ALTER TABLE brands ADD COLUMN IF NOT EXISTS tos_version varchar(50)`,
      `ALTER TABLE brands ADD COLUMN IF NOT EXISTS brand_safety_categories text[] NOT NULL DEFAULT '{}'`,
      `ALTER TABLE brands ADD COLUMN IF NOT EXISTS brand_safety_keywords text[] NOT NULL DEFAULT '{}'`,
      `ALTER TABLE community_owners ADD COLUMN IF NOT EXISTS email_verification_token text`,
      `ALTER TABLE community_owners ADD COLUMN IF NOT EXISTS email_verification_token_expires_at timestamp`,
      `ALTER TABLE community_owners ADD COLUMN IF NOT EXISTS email_verified_at timestamp`,
      `ALTER TABLE community_owners ADD COLUMN IF NOT EXISTS password_reset_token text`,
      `ALTER TABLE community_owners ADD COLUMN IF NOT EXISTS password_reset_token_expires_at timestamp`,
      `ALTER TABLE community_owners ADD COLUMN IF NOT EXISTS tos_accepted_at timestamp`,
      `ALTER TABLE community_owners ADD COLUMN IF NOT EXISTS tos_version varchar(50)`,
    ];
    for (const stmt of brandCols) {
      await pool.query(stmt);
    }
    console.log('[migrate] Schema corrections applied.');
  } catch (corrErr) {
    console.error('[migrate] Schema corrections failed:', corrErr);
  }

  // Seed test accounts if they don't exist.
  try {
    const brandCheck = await pool.query('SELECT id FROM brands WHERE email = $1 LIMIT 1', ['brand@test.sphere.com']);
    if (brandCheck.rows.length === 0) {
      const hash = await bcrypt.hash('TestBrand123!', 8);
      await pool.query(
        `INSERT INTO brands (name, slug, email, password_hash, status, brand_safety_categories, brand_safety_keywords, partnership_limit)
         VALUES ($1, $2, $3, $4, 'active', '{}', '{}', 0)`,
        ['Test Brand', 'test-brand', 'brand@test.sphere.com', hash],
      );
      console.log('[migrate] Test brand account created.');
    }
    const ownerCheck = await pool.query('SELECT id FROM community_owners WHERE email = $1 LIMIT 1', ['owner@test.sphere.com']);
    if (ownerCheck.rows.length === 0) {
      const hash = await bcrypt.hash('TestOwner123!', 8);
      await pool.query(
        `INSERT INTO community_owners (name, email, password_hash, status)
         VALUES ($1, $2, $3, 'active')`,
        ['Test Owner', 'owner@test.sphere.com', hash],
      );
      console.log('[migrate] Test community owner account created.');
    }
  } catch (seedErr) {
    console.error('[migrate] Test seed failed (non-fatal):', seedErr);
  }

  // Always close the pool so this process exits and the API server can start.
  try { await pool.end(); } catch (_) { /* ignore */ }
  // Force exit so any stale pg connections don't keep the process alive.
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error('Unexpected error in runMigrations:', err);
  process.exit(0);
});
