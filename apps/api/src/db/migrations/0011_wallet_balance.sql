ALTER TABLE "community_owners" ADD COLUMN IF NOT EXISTS "wallet_balance_cents" integer NOT NULL DEFAULT 0;
