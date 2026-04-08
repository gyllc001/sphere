-- Dispute resolution tables

DO $$ BEGIN
  CREATE TYPE "dispute_status" AS ENUM (
    'open', 'under_review', 'resolved_for_brand', 'resolved_for_community', 'resolved_mutual'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "dispute_opened_by" AS ENUM ('brand', 'community_owner');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "disputes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "deal_id" uuid NOT NULL REFERENCES "deals"("id"),
  "opened_by" "dispute_opened_by" NOT NULL,
  "opened_by_id" uuid NOT NULL,
  "reason" text NOT NULL,
  "status" "dispute_status" NOT NULL DEFAULT 'open',
  "resolved_by_admin_note" text,
  "resolved_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "dispute_deal_idx" ON "disputes" ("deal_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dispute_status_idx" ON "disputes" ("status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "dispute_comments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "dispute_id" uuid NOT NULL REFERENCES "disputes"("id"),
  "author_type" varchar(30) NOT NULL,
  "author_id" uuid,
  "body" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "dcomment_dispute_idx" ON "dispute_comments" ("dispute_id");
