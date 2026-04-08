import { pgTable, uuid, text, integer, timestamp, pgEnum, varchar } from 'drizzle-orm/pg-core';
import { campaigns } from './campaigns';
import { communities } from './communities';

export const applicationStatusEnum = pgEnum('campaign_application_status', [
  'pending',
  'accepted',
  'declined',
]);

export const campaignApplications = pgTable('campaign_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id),
  communityId: uuid('community_id').notNull().references(() => communities.id),
  pitch: text('pitch').notNull(),
  proposedRateCents: integer('proposed_rate_cents'),
  status: applicationStatusEnum('status').notNull().default('pending'),
  brandNote: text('brand_note'),
  dealId: uuid('deal_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type CampaignApplication = typeof campaignApplications.$inferSelect;
export type NewCampaignApplication = typeof campaignApplications.$inferInsert;
