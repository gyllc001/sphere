DO $$ BEGIN
  CREATE TYPE "public"."verification_status" AS ENUM('unverified', 'pending', 'verified');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "scraped_communities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(255) NOT NULL,
  "platform" varchar(50) NOT NULL,
  "handle" varchar(255),
  "url" text,
  "member_count" integer,
  "estimated_engagement_rate" varchar(20),
  "description" text,
  "primary_language" varchar(10),
  "location" varchar(100),
  "niche_tags" text[] NOT NULL DEFAULT '{}',
  "admin_contact_email" text,
  "admin_contact_name" varchar(255),
  "raw_metadata" text,
  "verification_status" "verification_status" NOT NULL DEFAULT 'unverified',
  "scraped_at" timestamp NOT NULL DEFAULT now(),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "scraped_communities_platform_handle_uniq"
  ON "scraped_communities" ("platform", "handle");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "scraped_communities_platform_idx"
  ON "scraped_communities" ("platform");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "scraped_communities_verification_idx"
  ON "scraped_communities" ("verification_status");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "scraped_communities_member_count_idx"
  ON "scraped_communities" ("member_count" DESC NULLS LAST);
