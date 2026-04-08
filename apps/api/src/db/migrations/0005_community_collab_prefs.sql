ALTER TABLE "communities" ADD COLUMN IF NOT EXISTS "content_types_accepted" text;
--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN IF NOT EXISTS "topics_excluded" text;
--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN IF NOT EXISTS "verification_status" varchar(20) NOT NULL DEFAULT 'unverified';
