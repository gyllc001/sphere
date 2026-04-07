import { pgTable, uuid, text, varchar, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { brands } from './brands';

export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft',
  'active',
  'matching',
  'in_progress',
  'completed',
  'cancelled',
]);

export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  brandId: uuid('brand_id').notNull().references(() => brands.id),
  title: varchar('title', { length: 255 }).notNull(),
  brief: text('brief').notNull(),
  objectives: text('objectives'),
  targetAudience: text('target_audience'),
  niche: varchar('niche', { length: 100 }),
  minCommunitySize: integer('min_community_size'),
  budgetCents: integer('budget_cents'),
  status: campaignStatusEnum('status').notNull().default('draft'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
