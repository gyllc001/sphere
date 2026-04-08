import { pgTable, uuid, text, varchar, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Self-declared topic categories a community can tag itself with
export const COMMUNITY_TOPIC_CATEGORIES = [
  'alcohol',
  'tobacco',
  'gambling',
  'nsfw',
  'politics',
  'religion',
  'violence',
  'cannabis',
  'firearms',
  'fitness',
  'finance',
  'technology',
  'gaming',
  'travel',
  'food',
  'fashion',
  'parenting',
  'education',
  'entertainment',
] as const;

export type CommunityTopicCategory = typeof COMMUNITY_TOPIC_CATEGORIES[number];

export const communityOwnerStatusEnum = pgEnum('community_owner_status', ['active', 'inactive', 'suspended']);
export const communityPlatformEnum = pgEnum('community_platform', [
  'discord',
  'slack',
  'telegram',
  'whatsapp',
  'facebook_group',
  'reddit',
  'circle',
  'mighty_networks',
  'other',
]);
export const communityStatusEnum = pgEnum('community_status', ['active', 'inactive', 'pending_review']);

export const communityOwners = pgTable('community_owners', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  status: communityOwnerStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const communities = pgTable('communities', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull().references(() => communityOwners.id),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  platform: communityPlatformEnum('platform').notNull(),
  platformUrl: text('platform_url'),
  niche: varchar('niche', { length: 100 }),
  memberCount: integer('member_count').notNull().default(0),
  engagementRate: varchar('engagement_rate', { length: 20 }),
  audienceDemographics: text('audience_demographics'),
  // Pricing
  baseRate: integer('base_rate'),
  // Contact integrations
  adminDiscordUserId: text('admin_discord_user_id'),
  adminPhone: varchar('admin_phone', { length: 50 }),
  adminFacebookPageId: text('admin_facebook_page_id'),
  vertical: varchar('vertical', { length: 50 }),
  // Brand safety: self-declared content topic tags
  contentTopics: text('content_topics').array().notNull().default([]),
  status: communityStatusEnum('status').notNull().default('pending_review'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type CommunityOwner = typeof communityOwners.$inferSelect;
export type NewCommunityOwner = typeof communityOwners.$inferInsert;
export type Community = typeof communities.$inferSelect;
export type NewCommunity = typeof communities.$inferInsert;
