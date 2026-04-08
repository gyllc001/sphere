DO $$ BEGIN
  CREATE TYPE "content_submission_status" AS ENUM ('draft', 'pending_review', 'changes_requested', 'approved', 'posted', 'confirmed', 'disputed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "content_submissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "deal_id" uuid NOT NULL REFERENCES "deals"("id"),
  "brief" text NOT NULL,
  "asset_urls" text NOT NULL DEFAULT '[]',
  "status" "content_submission_status" NOT NULL DEFAULT 'pending_review',
  "brand_approved" integer NOT NULL DEFAULT 0,
  "community_approved" integer NOT NULL DEFAULT 0,
  "changes_requested_note" text,
  "post_url" text,
  "posted_at" timestamp,
  "confirmed_at" timestamp,
  "payout_queued_at" timestamp,
  "disputed_at" timestamp,
  "dispute_note" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
