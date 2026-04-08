import { pgTable, uuid, text, varchar, integer, timestamp, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core';

export const verificationStatusEnum = pgEnum('verification_status', ['unverified', 'pending', 'verified']);

export const scrapedCommunities = pgTable(
  'scraped_communities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Identity
    name: varchar('name', { length: 255 }).notNull(),
    platform: varchar('platform', { length: 50 }).notNull(), // discord, slack, telegram, etc.
    handle: varchar('handle', { length: 255 }), // subreddit name, @handle, server id, etc.
    url: text('url'),
    // Audience
    memberCount: integer('member_count'),
    estimatedEngagementRate: varchar('estimated_engagement_rate', { length: 20 }),
    // Metadata
    description: text('description'),
    primaryLanguage: varchar('primary_language', { length: 10 }),
    location: varchar('location', { length: 100 }),
    nicheTags: text('niche_tags').array().notNull().default([]),
    // Contact info (publicly available only)
    adminContactEmail: text('admin_contact_email'),
    adminContactName: varchar('admin_contact_name', { length: 255 }),
    // Social handle for contacting admin/moderator (e.g. @telegramhandle, u/redditor, discord#1234)
    adminContactHandle: varchar('admin_contact_handle', { length: 255 }),
    // Raw scraped payload for reference
    rawMetadata: text('raw_metadata'),
    // Verification lifecycle
    verificationStatus: verificationStatusEnum('verification_status').notNull().default('unverified'),
    // Timestamps
    scrapedAt: timestamp('scraped_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    // Prevent duplicate scrapes of the same community
    platformHandleUniq: uniqueIndex('scraped_communities_platform_handle_uniq').on(table.platform, table.handle),
  }),
);

export type ScrapedCommunity = typeof scrapedCommunities.$inferSelect;
export type NewScrapedCommunity = typeof scrapedCommunities.$inferInsert;
