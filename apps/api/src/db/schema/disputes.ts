import { pgTable, uuid, text, varchar, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';
import { deals } from './partnerships';

export const disputeStatusEnum = pgEnum('dispute_status', [
  'open',
  'under_review',
  'resolved_for_brand',
  'resolved_for_community',
  'resolved_mutual',
]);

export const disputeOpenedByEnum = pgEnum('dispute_opened_by', ['brand', 'community_owner']);

export const disputes = pgTable('disputes', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealId: uuid('deal_id').notNull().references(() => deals.id),
  openedBy: disputeOpenedByEnum('opened_by').notNull(),
  // ID of the brand or community_owner who opened it
  openedById: uuid('opened_by_id').notNull(),
  reason: text('reason').notNull(),
  status: disputeStatusEnum('status').notNull().default('open'),
  // Admin resolution fields
  resolvedByAdminNote: text('resolved_by_admin_note'),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  dealIdx: index('dispute_deal_idx').on(t.dealId),
  statusIdx: index('dispute_status_idx').on(t.status),
}));

export const disputeComments = pgTable('dispute_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  disputeId: uuid('dispute_id').notNull().references(() => disputes.id),
  authorType: varchar('author_type', { length: 30 }).notNull(), // 'brand' | 'community_owner' | 'admin'
  authorId: uuid('author_id'),
  body: text('body').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  disputeIdx: index('dcomment_dispute_idx').on(t.disputeId),
}));

export type Dispute = typeof disputes.$inferSelect;
export type NewDispute = typeof disputes.$inferInsert;
export type DisputeComment = typeof disputeComments.$inferSelect;
