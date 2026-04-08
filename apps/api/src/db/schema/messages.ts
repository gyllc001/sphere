import { pgTable, uuid, text, varchar, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';
import { deals } from './partnerships';
import { brands } from './brands';
import { communityOwners } from './communities';

export const conversationStatusEnum = pgEnum('conversation_status', ['open', 'closed', 'archived']);

/**
 * A conversation thread between a brand and a community owner.
 * Tied to a deal when one exists (can also exist before a deal is created, e.g. pre-negotiation).
 * Direct contact info (email, phone) is NEVER included in API responses for this resource.
 */
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Parties — stored by entity id, never raw contact details
  brandId: uuid('brand_id').notNull().references(() => brands.id),
  communityOwnerId: uuid('community_owner_id').notNull().references(() => communityOwners.id),
  // Optional link to a deal (populated when conversation is deal-specific)
  dealId: uuid('deal_id').references(() => deals.id),
  // Human-readable subject (e.g. campaign name)
  subject: varchar('subject', { length: 255 }),
  status: conversationStatusEnum('status').notNull().default('open'),
  // Tracks unread counts per party
  brandLastReadAt: timestamp('brand_last_read_at'),
  ownerLastReadAt: timestamp('owner_last_read_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  brandIdx: index('conv_brand_idx').on(t.brandId),
  ownerIdx: index('conv_owner_idx').on(t.communityOwnerId),
  dealIdx: index('conv_deal_idx').on(t.dealId),
}));

export const messageSenderTypeEnum = pgEnum('message_sender_type', ['brand', 'community_owner', 'system']);

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id),
  senderType: messageSenderTypeEnum('sender_type').notNull(),
  // senderId references the brand.id or communityOwner.id depending on senderType
  // 'system' messages have no senderId
  senderId: uuid('sender_id'),
  body: text('body').notNull(),
  // If this message was triggered by an inbound email, the originating address is stored
  // for admin audit only — it is NEVER returned in the public API response
  _inboundEmailAddress: text('inbound_email_address'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  convIdx: index('msg_conv_idx').on(t.conversationId),
}));

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
