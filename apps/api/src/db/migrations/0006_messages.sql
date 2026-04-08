-- Platform-first messaging: conversations and messages tables
-- All inter-party contact is routed through these tables.
-- Raw contact info (email, phone) is NEVER exposed via the public API.

DO $$ BEGIN
  CREATE TYPE "conversation_status" AS ENUM ('open', 'closed', 'archived');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "message_sender_type" AS ENUM ('brand', 'community_owner', 'system');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "conversations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "brand_id" uuid NOT NULL REFERENCES "brands"("id"),
  "community_owner_id" uuid NOT NULL REFERENCES "community_owners"("id"),
  "deal_id" uuid REFERENCES "deals"("id"),
  "subject" varchar(255),
  "status" "conversation_status" NOT NULL DEFAULT 'open',
  "brand_last_read_at" timestamp,
  "owner_last_read_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "conv_brand_idx" ON "conversations" ("brand_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conv_owner_idx" ON "conversations" ("community_owner_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conv_deal_idx" ON "conversations" ("deal_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "conversation_id" uuid NOT NULL REFERENCES "conversations"("id"),
  "sender_type" "message_sender_type" NOT NULL,
  "sender_id" uuid,
  "body" text NOT NULL,
  -- internal audit only, never returned by public API
  "inbound_email_address" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "msg_conv_idx" ON "messages" ("conversation_id");
