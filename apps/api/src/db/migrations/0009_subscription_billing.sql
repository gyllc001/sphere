DO $$ BEGIN
 CREATE TYPE "public"."subscription_tier" AS ENUM('starter', 'growth', 'scale');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "stripe_customer_id" text;
--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "stripe_subscription_id" text;
--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "subscription_tier" "subscription_tier";
--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "subscription_status" varchar(50);
--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "partnership_limit" integer NOT NULL DEFAULT 0;
