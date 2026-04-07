ALTER TABLE "communities" ADD COLUMN IF NOT EXISTS "admin_discord_user_id" text;
--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN IF NOT EXISTS "admin_phone" varchar(50);
--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN IF NOT EXISTS "admin_facebook_page_id" text;
--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN IF NOT EXISTS "vertical" varchar(50);
