DO $$ BEGIN
  CREATE TYPE "public"."repeat_intent" AS ENUM('yes', 'no', 'maybe');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "deal_feedback" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "deal_id" uuid NOT NULL REFERENCES "deals"("id"),
  "user_id" uuid NOT NULL,
  "user_role" text NOT NULL,
  "deal_quality" integer NOT NULL,
  "ease_of_use" integer NOT NULL,
  "repeat_intent" "repeat_intent" NOT NULL,
  "open_text" text,
  "submitted_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint

ALTER TABLE "deal_feedback"
  ADD CONSTRAINT "deal_feedback_user_deal_uniq" UNIQUE ("deal_id", "user_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "deal_feedback_deal_id_idx"
  ON "deal_feedback" ("deal_id");
