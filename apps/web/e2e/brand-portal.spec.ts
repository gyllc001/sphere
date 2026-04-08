/**
 * E2E — Brand Portal flows
 *
 * Pre-condition: brand@test.sphere.com / TestBrand123! is a valid account.
 */

import { test, expect } from '@playwright/test';

test.describe('Brand Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: implement login helper or use storageState once auth is working
  });

  test('dashboard renders with campaign list (or empty state for new brand)');
  test('campaign cards show correct notified/interested counts');
  test('clicking a campaign card navigates to campaign detail page');
});

test.describe('Brand — Campaign Brief Submission', () => {
  test('new campaign form is reachable from dashboard');
  test('submitting a valid brief creates campaign and shows it in dashboard');
  test('form validation prevents submission with empty title or brief');
  test('budget field accepts numeric values and rejects negative numbers');
  test('date range picker allows setting start and end dates');
});

test.describe('Brand — Opportunity Board', () => {
  test('opportunity board lists communities that expressed interest');
  test('each opportunity shows community name, platform, follower count, match score');
  test('brand can accept an opportunity (starts deal flow)');
  test('brand can decline an opportunity');
  test('accepted opportunity disappears from pending list and appears in deals');
});

test.describe('Brand — Deal Tracking', () => {
  test('deals section shows active negotiations with current status');
  test('deal status updates in real-time (or on refresh) as negotiation progresses');
  test('brand can view full negotiation history for a deal');
  test('completed deal shows final agreed rate and payout information');
});
