/**
 * Brand Portal — Campaign Brief CRUD integration tests
 *
 * Covers:
 *   POST   /api/campaigns          — create campaign brief
 *   GET    /api/campaigns          — list brand's campaigns
 *   GET    /api/campaigns/:id      — get single campaign
 *   PATCH  /api/campaigns/:id      — update campaign
 *   DELETE /api/campaigns/:id      — cancel/delete campaign (if implemented)
 *
 * Run: npm test --workspace=apps/api -- --testPathPattern=campaigns
 */

import supertest from 'supertest';
import app from '../index';
import { createBrand, createCampaign } from './helpers/factory';

const request = supertest(app);

describe('Campaigns — create', () => {
  it('creates a campaign brief with all required fields');
  it('creates a campaign brief with optional fields (budget, dates, niche, targetAudience)');
  it('returns 400 for missing title or brief');
  it('returns 401 for unauthenticated requests');
  it('returns 403 for community owner tokens');
  it('auto-triggers AI matching on first campaign creation for a new brand');
});

describe('Campaigns — list', () => {
  it('returns an empty array for a brand with no campaigns');
  it('returns only campaigns belonging to the authenticated brand');
  it('includes aggregate stats (notified count, interested count) per campaign');
  it('orders results by createdAt ascending');
});

describe('Campaigns — get single', () => {
  it('returns the campaign with full detail for the owning brand');
  it('returns 404 for a campaign owned by a different brand');
  it('returns 404 for a non-existent campaign ID');
});

describe('Campaigns — update', () => {
  it('updates allowed fields (title, brief, status)');
  it('returns 400 for invalid status transitions');
  it('returns 403 for campaigns owned by a different brand');
});

describe('Campaigns — dashboard accuracy', () => {
  it('notified count matches number of partnership requests sent');
  it('interested count matches partnership requests with status=accepted');
});
