import { pgTable, uuid, text, varchar, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const brandStatusEnum = pgEnum('brand_status', ['active', 'inactive', 'suspended']);

export const subscriptionTierEnum = pgEnum('subscription_tier', ['starter', 'growth', 'scale']);

export const SUBSCRIPTION_TIERS = {
  starter: { name: 'Starter', priceMonthCents: 25000, partnershipLimit: 10 },
  growth: { name: 'Growth', priceMonthCents: 45000, partnershipLimit: 20 },
  scale: { name: 'Scale', priceMonthCents: 100000, partnershipLimit: 50, extraPartnershipCents: 7500 },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

// Predefined topic categories brands can exclude from matching
export const BRAND_SAFETY_CATEGORIES = [
  'alcohol',
  'tobacco',
  'gambling',
  'nsfw',
  'politics',
  'religion',
  'violence',
  'competitor_brands',
  'cannabis',
  'firearms',
] as const;

export type BrandSafetyCategory = typeof BRAND_SAFETY_CATEGORIES[number];

export const brands = pgTable('brands', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  website: text('website'),
  logo: text('logo'),
  description: text('description'),
  industry: varchar('industry', { length: 100 }),
  status: brandStatusEnum('status').notNull().default('active'),
  // Auth
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  // Brand safety filters
  brandSafetyCategories: text('brand_safety_categories').array().notNull().default([]),
  brandSafetyKeywords: text('brand_safety_keywords').array().notNull().default([]),
  // Stripe subscription billing
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  subscriptionTier: subscriptionTierEnum('subscription_tier'),
  subscriptionStatus: varchar('subscription_status', { length: 50 }),
  partnershipLimit: integer('partnership_limit').notNull().default(0),
  // Email verification
  emailVerifiedAt: timestamp('email_verified_at'),
  emailVerificationToken: text('email_verification_token'),
  emailVerificationTokenExpiresAt: timestamp('email_verification_token_expires_at'),
  // Password reset
  passwordResetToken: text('password_reset_token'),
  passwordResetTokenExpiresAt: timestamp('password_reset_token_expires_at'),
  // ToS acceptance
  tosAcceptedAt: timestamp('tos_accepted_at'),
  tosVersion: varchar('tos_version', { length: 50 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;
