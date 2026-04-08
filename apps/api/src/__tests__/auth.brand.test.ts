/**
 * Brand Authentication — integration tests
 *
 * Covers:
 *   POST /api/brands/auth/register
 *   POST /api/brands/auth/login
 *
 * Run: npm test --workspace=apps/api -- --testPathPattern=auth.brand
 */

import supertest from 'supertest';
import app from '../index';

const request = supertest(app);

describe('Brand Auth — register', () => {
  it('registers a new brand and returns a JWT + brand object');
  it('rejects registration with missing required fields (name, email, password)');
  it('rejects registration with an email that is already taken (409)');
  it('rejects a password shorter than 8 characters');
  it('rejects an invalid email format');
  it('returns 201 with a valid token that can be used for subsequent requests');
});

describe('Brand Auth — login', () => {
  it('logs in with correct credentials and returns a JWT');
  it('rejects login with wrong password (401)');
  it('rejects login with unknown email (401)');
  it('returns 400 for malformed request body');
});

describe('Brand Auth — token validation', () => {
  it('accepts a valid Bearer token on protected routes');
  it('rejects requests with no Authorization header (401)');
  it('rejects requests with a tampered / expired token (401)');
  it('rejects a community_owner token on brand-only routes (403)');
});
