ALTER TABLE "brands" ADD COLUMN "tos_accepted_at" timestamp;
ALTER TABLE "brands" ADD COLUMN "tos_version" varchar(50);
ALTER TABLE "community_owners" ADD COLUMN "tos_accepted_at" timestamp;
ALTER TABLE "community_owners" ADD COLUMN "tos_version" varchar(50);
