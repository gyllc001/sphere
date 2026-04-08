import { pgTable, uuid, text, integer, timestamp, pgEnum, unique } from 'drizzle-orm/pg-core';
import { deals } from './partnerships';

export const repeatIntentEnum = pgEnum('repeat_intent', ['yes', 'no', 'maybe']);

export const dealFeedback = pgTable(
  'deal_feedback',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    dealId: uuid('deal_id').notNull().references(() => deals.id),
    userId: uuid('user_id').notNull(),
    userRole: text('user_role').notNull(), // 'brand' | 'community_owner'
    dealQuality: integer('deal_quality').notNull(), // 1-5
    easeOfUse: integer('ease_of_use').notNull(), // 1-5
    repeatIntent: repeatIntentEnum('repeat_intent').notNull(),
    openText: text('open_text'),
    submittedAt: timestamp('submitted_at').notNull().defaultNow(),
  },
  (table) => ({
    // One response per user per deal
    uniqUserDeal: unique('deal_feedback_user_deal_uniq').on(table.dealId, table.userId),
  })
);

export type DealFeedback = typeof dealFeedback.$inferSelect;
export type NewDealFeedback = typeof dealFeedback.$inferInsert;
