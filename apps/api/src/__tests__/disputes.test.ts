/**
 * Dispute Resolution — integration tests
 *
 * Covers:
 *   POST /api/disputes             — raise a dispute on a deal
 *   GET  /api/disputes             — list disputes for authenticated party
 *   GET  /api/disputes/:id         — get dispute detail
 *   POST /api/disputes/:id/resolve — admin resolves a dispute
 *
 * Run: npm test --workspace=apps/api -- --testPathPattern=disputes
 */

import supertest from 'supertest';
import app from '../index';

const request = supertest(app);

describe('Disputes — raise', () => {
  it('brand can raise a dispute on a deal they own');
  it('community owner can raise a dispute on a deal they are party to');
  it('returns 400 for missing reason or description');
  it('returns 404 for a deal that does not exist');
  it('returns 403 for a deal the caller is not party to');
  it('creates dispute with status open');
});

describe('Disputes — listing', () => {
  it('brand sees only disputes on their deals');
  it('community owner sees only disputes on their deals');
  it('admin sees all open disputes (if admin route implemented)');
});

describe('Disputes — admin resolution', () => {
  it('admin can resolve a dispute with a verdict (brand_wins / owner_wins / split)');
  it('resolution moves dispute status to resolved');
  it('non-admin callers cannot call the resolve endpoint (403)');
  it('resolution triggers payout adjustment according to verdict');
});

describe('Disputes — state machine', () => {
  it('cannot raise a second dispute on a deal that already has an open dispute');
  it('resolved dispute cannot be reopened via the raise endpoint');
});
