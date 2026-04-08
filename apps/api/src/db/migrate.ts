import 'dotenv/config';
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
  let migrationOk = false;
  try {
    await migrate(db, { migrationsFolder: path.join(__dirname, '../../migrations') });
    console.log('Migrations complete.');
    migrationOk = true;
  } catch (err) {
    // Log clearly — a failed migration means schema drift which breaks the app.
    console.error('[migrate] MIGRATION FAILED — schema may be out of sync:', err);
  }

  {
    // Always apply known columns with IF NOT EXISTS to fix journal/DB drift.
    // Safe to run on every deploy — all statements are idempotent.
    console.log('[migrate] Applying idempotent schema corrections...');
    try {
      await pool.query(`
        DO $$ BEGIN
          CREATE TYPE "public"."subscription_tier" AS ENUM('starter', 'growth', 'scale');
        EXCEPTION WHEN duplicate_object THEN NULL; END $$;
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS stripe_customer_id text;
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS subscription_tier "subscription_tier";
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS subscription_status varchar(50);
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS partnership_limit integer NOT NULL DEFAULT 0;
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS email_verification_token text;
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS email_verification_token_expires_at timestamp;
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS email_verified_at timestamp;
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS password_reset_token text;
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS password_reset_token_expires_at timestamp;
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS tos_accepted_at timestamp;
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS tos_version varchar(50);
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS brand_safety_categories text[] NOT NULL DEFAULT '{}';
        ALTER TABLE brands ADD COLUMN IF NOT EXISTS brand_safety_keywords text[] NOT NULL DEFAULT '{}';
        ALTER TABLE community_owners ADD COLUMN IF NOT EXISTS email_verification_token text;
        ALTER TABLE community_owners ADD COLUMN IF NOT EXISTS email_verification_token_expires_at timestamp;
        ALTER TABLE community_owners ADD COLUMN IF NOT EXISTS email_verified_at timestamp;
        ALTER TABLE community_owners ADD COLUMN IF NOT EXISTS password_reset_token text;
        ALTER TABLE community_owners ADD COLUMN IF NOT EXISTS password_reset_token_expires_at timestamp;
        ALTER TABLE community_owners ADD COLUMN IF NOT EXISTS tos_accepted_at timestamp;
        ALTER TABLE community_owners ADD COLUMN IF NOT EXISTS tos_version varchar(50);
      `);
      console.log('[migrate] Fallback schema corrections applied.');
    } catch (fallbackErr) {
      console.error('[migrate] Fallback corrections also failed:', fallbackErr);
    }
  }

  // Always close the pool so this process exits and the API server can start.
  try { await pool.end(); } catch (_) { /* ignore */ }
  // Force exit so any stale pg connections don't keep the process alive.
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error('Unexpected error in runMigrations:', err);
  process.exit(0); // Non-fatal; let the API server start anyway
});
