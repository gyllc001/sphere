/**
 * Community Owner Portal — integration tests
 *
 * Covers:
 *   POST   /api/owner/communities           — create community listing
 *   GET    /api/owner/communities           — list owner's communities
 *   GET    /api/owner/opportunities         — inbound partnership opportunities
 *   POST   /api/owner/opportunities/:id/accept   — accept opportunity
 *   POST   /api/owner/opportunities/:id/decline  — decline opportunity
 *   POST   /api/owner/opportunities/:id/counter  — counter-offer
 *
 * Run: npm test --workspace=apps/api -- --testPathPattern=community-portal
 */

import supertest from 'supertest';
import app from '../index';
import { createCommunityOwner, createCommunity } from './helpers/factory';

const request = supertest(app);

describe('Community Portal — create listing', () => {
  it('creates a community listing with required fields (name, platform, vertical)');
  it('creates a listing with optional fields (followerCount, engagementRate, description)');
  it('returns 400 for missing required fields');
  it('returns 401 for unauthenticated requests');
  it('returns 403 for brand tokens');
  it('persists the community and returns it in subsequent list calls');
});

describe('Community Portal — list communities', () => {
  it('returns only communities belonging to the authenticated owner');
  it('returns an empty array for a new owner with no communities');
});

describe('Community Portal — opportunities (inbound)', () => {
  it('returns partnership requests addressed to the authenticated owner');
  it('returns an empty array when no matches have been run for owner's communities');
  it('includes campaign brief details in the opportunity payload');
  it('does NOT include brand contact details (PII guard)');
});

describe('Community Portal — accept opportunity', () => {
  it('transitions partnership request from pending → accepted');
  it('returns 404 for an opportunity not addressed to this owner');
  it('returns 409 when trying to accept an already-accepted or declined opportunity');
});

describe('Community Portal — decline opportunity', () => {
  it('transitions partnership request from pending → declined');
  it('returns 404 for an opportunity not addressed to this owner');
});

describe('Community Portal — counter-offer', () => {
  it('submits a counter-offer amount and transitions request to counter_pending');
  it('returns 400 for a missing or negative counter amount');
  it('returns 404 for an opportunity not addressed to this owner');
});

describe('Community Portal — ToS acceptance', () => {
  it('records ToS acceptance during onboarding');
  it('requires ToS acceptance before community listing creation (if enforced)');
});
