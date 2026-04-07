DO $$ BEGIN
 CREATE TYPE "public"."signature_status" AS ENUM('unsigned', 'brand_signed', 'community_signed', 'fully_executed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "signature_status" "signature_status" NOT NULL DEFAULT 'unsigned';
--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "envelope_id" text;
--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "signed_contract_url" text;
--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "brand_signed_at" timestamp;
--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "community_signed_at" timestamp;
