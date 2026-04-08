import { pgTable, uuid, text, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const brandStatusEnum = pgEnum('brand_status', ['active', 'inactive', 'suspended']);

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
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;
