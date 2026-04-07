DO $$ BEGIN
 CREATE TYPE "public"."payment_status" AS ENUM('pending', 'escrowed', 'released', 'refunded');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "payment_status" "payment_status" DEFAULT 'pending';
--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "stripe_payment_intent_id" text;
--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "stripe_transfer_id" text;
--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "paid_at" timestamp;
--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "payout_at" timestamp;
