/**
 * E2E — Community Owner Portal flows
 *
 * Pre-condition: community@test.sphere.com / TestCommunity123! is a valid account.
 */

import { test, expect } from '@playwright/test';

test.describe('Community Portal — Profile Setup', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: implement login helper
  });

  test('new community owner is prompted to create their first community listing');
  test('community listing form accepts name, platform, vertical, follower count');
  test('created community appears in community list');
  test('ToS checkbox is required before community can be published');
});

test.describe('Community Portal — Opportunity Browsing', () => {
  test('opportunities page lists inbound brand campaigns matched to this owner');
  test('each opportunity shows campaign title, niche, budget range, and match score');
  test('brand raw contact details are NOT visible on opportunity cards');
  test('owner can accept an opportunity');
  test('owner can decline an opportunity');
  test('owner can submit a counter-offer with a custom rate');
});

test.describe('Community Portal — Active Deals', () => {
  test('accepted opportunities appear in deals section');
  test('deal shows current negotiation status');
  test('owner can view message thread for a deal');
  test('completed deal shows final payout amount (after platform fee)');
});

test.describe('Community Portal — Messaging', () => {
  test('owner can read messages from brand in conversation thread');
  test('owner can send a reply');
  test('attempting to send an email address in a message shows a PII block notice');
  test('attempting to send a phone number in a message shows a PII block notice');
});
