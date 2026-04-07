import { pgTable, uuid, text, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { campaigns } from './campaigns';
import { communities } from './communities';

export const partnershipRequestStatusEnum = pgEnum('partnership_request_status', [
  'pending',
  'accepted',
  'rejected',
  'withdrawn',
]);

export const dealStatusEnum = pgEnum('deal_status', [
  'negotiating',
  'agreed',
  'contract_sent',
  'signed',
  'active',
  'completed',
  'cancelled',
]);

export const partnershipRequests = pgTable('partnership_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id),
  communityId: uuid('community_id').notNull().references(() => communities.id),
  // AI match score 0-100
  matchScore: integer('match_score'),
  matchRationale: text('match_rationale'),
  // Proposed terms
  proposedRateCents: integer('proposed_rate_cents'),
  message: text('message'),
  status: partnershipRequestStatusEnum('status').notNull().default('pending'),
  initiatedByAi: integer('initiated_by_ai').notNull().default(0), // 0=brand, 1=AI
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const deals = pgTable('deals', {
  id: uuid('id').primaryKey().defaultRandom(),
  partnershipRequestId: uuid('partnership_request_id').notNull().references(() => partnershipRequests.id),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id),
  communityId: uuid('community_id').notNull().references(() => communities.id),
  agreedRateCents: integer('agreed_rate_cents').notNull(),
  deliverables: text('deliverables'),
  contractUrl: text('contract_url'),
  status: dealStatusEnum('status').notNull().default('negotiating'),
  // Negotiation log stored as JSON string
  negotiationLog: text('negotiation_log'),
  signedAt: timestamp('signed_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type PartnershipRequest = typeof partnershipRequests.$inferSelect;
export type NewPartnershipRequest = typeof partnershipRequests.$inferInsert;
export type Deal = typeof deals.$inferSelect;
export type NewDeal = typeof deals.$inferInsert;
