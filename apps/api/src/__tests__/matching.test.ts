/**
 * AI Matching Engine — integration tests
 *
 * Covers:
 *   POST /api/campaigns/:id/match    — trigger AI matching run
 *   GET  /api/campaigns/:id/matches  — fetch match results
 *
 * Run: npm test --workspace=apps/api -- --testPathPattern=matching
 */

import supertest from 'supertest';
import app from '../index';
import { createBrand, createCampaign, createCommunityOwner, createCommunity } from './helpers/factory';

const request = supertest(app);

describe('AI Matching — trigger run', () => {
  it('triggers a match run and returns matchesFound count and match array');
  it('returns 404 for a campaign not owned by the authenticated brand');
  it('returns 409 when campaign status is not active or matching');
  it('respects topN parameter (caps results at requested N)');
  it('respects threshold parameter (excludes communities scoring below threshold)');
  it('returns an empty matches array when no communities qualify');
});

describe('AI Matching — match quality', () => {
  it('score is between 0 and 100 for all returned matches');
  it('communities in the correct niche score higher than out-of-niche communities');
  it('communities below minCommunitySize are excluded from results');
  it('rejected/blocked communities are not returned in match results');
});

describe('AI Matching — get existing matches', () => {
  it('returns previously computed partnership requests for the campaign');
  it('returns 404 for a campaign not owned by the authenticated brand');
  it('includes matchScore and status for each match');
});

describe('AI Matching — vetting', () => {
  it('communities flagged in a safety category are excluded or ranked lower');
  it('re-running match on same campaign updates existing partnership requests');
});
