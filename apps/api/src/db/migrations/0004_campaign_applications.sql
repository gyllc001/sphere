DO $$ BEGIN
 CREATE TYPE "public"."campaign_application_status" AS ENUM('pending', 'accepted', 'declined');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "campaign_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"community_id" uuid NOT NULL,
	"pitch" text NOT NULL,
	"proposed_rate_cents" integer,
	"status" "campaign_application_status" NOT NULL DEFAULT 'pending',
	"brand_note" text,
	"deal_id" uuid,
	"created_at" timestamp NOT NULL DEFAULT now(),
	"updated_at" timestamp NOT NULL DEFAULT now(),
	CONSTRAINT "campaign_applications_campaign_id_community_id_unique" UNIQUE("campaign_id", "community_id")
);
--> statement-breakpoint
ALTER TABLE "campaign_applications" ADD CONSTRAINT "campaign_applications_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "campaign_applications" ADD CONSTRAINT "campaign_applications_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;
