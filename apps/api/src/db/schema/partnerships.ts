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

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'escrowed',
  'released',
  'refunded',
]);

export const signatureStatusEnum = pgEnum('signature_status', [
  'unsigned',
  'brand_signed',
  'community_signed',
  'fully_executed',
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
  // Payment tracking
  paymentStatus: paymentStatusEnum('payment_status').default('pending'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  stripeTransferId: text('stripe_transfer_id'),
  paidAt: timestamp('paid_at'),
  payoutAt: timestamp('payout_at'),
  signatureStatus: signatureStatusEnum('signature_status').notNull().default('unsigned'),
  envelopeId: text('envelope_id'),
  signedContractUrl: text('signed_contract_url'),
  brandSignedAt: timestamp('brand_signed_at'),
  communitySignedAt: timestamp('community_signed_at'),
  signedAt: timestamp('signed_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type PartnershipRequest = typeof partnershipRequests.$inferSelect;
export type NewPartnershipRequest = typeof partnershipRequests.$inferInsert;
export type Deal = typeof deals.$inferSelect;
export type NewDeal = typeof deals.$inferInsert;
