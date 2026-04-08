import { pgTable, uuid, text, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { deals } from './partnerships';

export const contentSubmissionStatusEnum = pgEnum('content_submission_status', [
  'draft',
  'pending_review',
  'changes_requested',
  'approved',
  'posted',
  'confirmed',
  'disputed',
]);

export const contentSubmissions = pgTable('content_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealId: uuid('deal_id').notNull().references(() => deals.id),
  // Brief and asset URLs (JSON array string)
  brief: text('brief').notNull(),
  assetUrls: text('asset_urls').notNull().default('[]'),
  status: contentSubmissionStatusEnum('status').notNull().default('pending_review'),
  // Co-approval tracking
  brandApproved: integer('brand_approved').notNull().default(0),
  communityApproved: integer('community_approved').notNull().default(0),
  // Community owner feedback
  changesRequestedNote: text('changes_requested_note'),
  // Post confirmation URL (community owner provides after posting)
  postUrl: text('post_url'),
  // Timestamps for key transitions
  postedAt: timestamp('posted_at'),
  confirmedAt: timestamp('confirmed_at'),
  payoutQueuedAt: timestamp('payout_queued_at'),
  disputedAt: timestamp('disputed_at'),
  disputeNote: text('dispute_note'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type ContentSubmission = typeof contentSubmissions.$inferSelect;
export type NewContentSubmission = typeof contentSubmissions.$inferInsert;
