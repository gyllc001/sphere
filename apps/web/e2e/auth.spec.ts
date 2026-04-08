/**
 * E2E — Authentication flows (brand + community owner)
 *
 * Tests run against: PLAYWRIGHT_BASE_URL (default: https://sphere-web-lemon.vercel.app)
 * API target:        PLAYWRIGHT_API_URL  (default: https://sphere-production-6477.up.railway.app)
 *
 * Test accounts:
 *   Brand:     brand@test.sphere.com   / TestBrand123!
 *   Community: community@test.sphere.com / TestCommunity123!
 */

import { test, expect } from '@playwright/test';

// ─── Brand Auth ───────────────────────────────────────────────────────────────

test.describe('Brand — sign up', () => {
  test('brand signup page renders with email + password fields');
  test('valid signup creates account and redirects to brand dashboard');
  test('duplicate email shows inline error message');
  test('weak password (< 8 chars) is rejected client-side before submit');
  test('invalid email format shows validation error');
});

test.describe('Brand — login', () => {
  test('login page renders at /brand/login');
  test('correct credentials log in and redirect to /brand/dashboard');
  test('wrong password shows error message without revealing account existence');
  test('session persists across page reload (token stored correctly)');
  test('logout clears session and redirects to /brand/login');
});

// ─── Community Owner Auth ─────────────────────────────────────────────────────

test.describe('Community Owner — sign up', () => {
  test('community signup page renders with required fields');
  test('valid signup creates account and redirects to community dashboard');
  test('duplicate email shows appropriate error');
});

test.describe('Community Owner — login', () => {
  test('login page renders at /community/login');
  test('correct credentials log in and redirect to community dashboard');
  test('wrong password shows error without leaking account info');
  test('logout clears session');
});

// ─── Cross-role access ────────────────────────────────────────────────────────

test.describe('Access control', () => {
  test('brand session cannot access /community/* protected routes');
  test('community owner session cannot access /brand/* protected routes');
  test('unauthenticated user is redirected to login from protected pages');
});
