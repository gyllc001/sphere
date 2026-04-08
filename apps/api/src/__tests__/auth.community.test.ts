/**
 * Community Owner Authentication — integration tests
 *
 * Covers:
 *   POST /api/communities/auth/register
 *   POST /api/communities/auth/login
 *
 * Run: npm test --workspace=apps/api -- --testPathPattern=auth.community
 */

import supertest from 'supertest';
import app from '../index';

const request = supertest(app);

describe('Community Owner Auth — register', () => {
  it('registers a new community owner and returns a JWT + owner object');
  it('rejects registration with missing required fields (name, email, password)');
  it('rejects registration with a duplicate email (409)');
  it('rejects a password shorter than 8 characters');
  it('rejects an invalid email format');
});

describe('Community Owner Auth — login', () => {
  it('logs in with correct credentials and returns a JWT');
  it('rejects login with wrong password (401)');
  it('rejects login with unknown email (401)');
  it('returns 400 for malformed request body');
});

describe('Community Owner Auth — token validation', () => {
  it('accepts a valid Bearer token on protected owner routes');
  it('rejects requests with no Authorization header (401)');
  it('rejects requests with an invalid token (401)');
  it('rejects a brand token on community-owner-only routes (403)');
});
