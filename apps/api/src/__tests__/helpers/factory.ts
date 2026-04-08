/**
 * Test data factory for Sphere API integration tests.
 *
 * Creates brand accounts, community owner accounts, and campaign briefs
 * via the real API. All factory helpers return both the API response
 * and the bearer token so callers can make authenticated requests.
 *
 * Usage:
 *   const { token, brand } = await createBrand();
 *   const { token: ownerToken } = await createCommunity();
 *   const campaign = await createCampaign(token);
 */

import supertest from 'supertest';
import app from '../../index';

const request = supertest(app);

let _counter = 0;
function uid() {
  return `${Date.now()}-${++_counter}`;
}

// ─── Brand ────────────────────────────────────────────────────────────────────

export interface BrandFixture {
  token: string;
  brand: { id: string; name: string; email: string; slug: string };
  email: string;
  password: string;
}

export async function createBrand(overrides: Partial<{
  name: string;
  email: string;
  password: string;
  industry: string;
}> = {}): Promise<BrandFixture> {
  const id = uid();
  const payload = {
    name: overrides.name ?? `Test Brand ${id}`,
    email: overrides.email ?? `brand+${id}@test.sphere.com`,
    password: overrides.password ?? 'TestBrand123!',
    industry: overrides.industry ?? 'Technology',
    website: 'https://example.com',
    description: 'Auto-generated test brand',
  };

  const res = await request.post('/api/brands/auth/register').send(payload);
  if (res.status !== 201) {
    throw new Error(`createBrand failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return { token: res.body.token, brand: res.body.brand, email: payload.email, password: payload.password };
}

// ─── Community Owner ──────────────────────────────────────────────────────────

export interface CommunityOwnerFixture {
  token: string;
  owner: { id: string; name: string; email: string };
  email: string;
  password: string;
}

export async function createCommunityOwner(overrides: Partial<{
  name: string;
  email: string;
  password: string;
}> = {}): Promise<CommunityOwnerFixture> {
  const id = uid();
  const payload = {
    name: overrides.name ?? `Test Owner ${id}`,
    email: overrides.email ?? `owner+${id}@test.sphere.com`,
    password: overrides.password ?? 'TestCommunity123!',
    bio: 'Auto-generated test community owner',
  };

  const res = await request.post('/api/communities/auth/register').send(payload);
  if (res.status !== 201) {
    throw new Error(`createCommunityOwner failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return { token: res.body.token, owner: res.body.owner, email: payload.email, password: payload.password };
}

// ─── Community ────────────────────────────────────────────────────────────────

export interface CommunityFixture {
  id: string;
  name: string;
  platform: string;
  vertical: string;
}

export async function createCommunity(
  ownerToken: string,
  overrides: Partial<{
    name: string;
    platform: string;
    vertical: string;
    followerCount: number;
  }> = {},
): Promise<CommunityFixture> {
  const id = uid();
  const payload = {
    name: overrides.name ?? `Test Community ${id}`,
    platform: overrides.platform ?? 'Instagram',
    vertical: overrides.vertical ?? 'Technology',
    followerCount: overrides.followerCount ?? 50000,
    description: 'Auto-generated test community',
    engagementRate: 3.5,
  };

  const res = await request
    .post('/api/owner/communities')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send(payload);

  if (res.status !== 201) {
    throw new Error(`createCommunity failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return res.body;
}

// ─── Campaign ─────────────────────────────────────────────────────────────────

export interface CampaignFixture {
  id: string;
  title: string;
  brief: string;
  status: string;
  budgetCents: number;
}

export async function createCampaign(
  brandToken: string,
  overrides: Partial<{
    title: string;
    brief: string;
    niche: string;
    budgetCents: number;
  }> = {},
): Promise<CampaignFixture> {
  const id = uid();
  const payload = {
    title: overrides.title ?? `Test Campaign ${id}`,
    brief: overrides.brief ?? 'This is a test campaign brief for automated testing purposes.',
    niche: overrides.niche ?? 'Technology',
    budgetCents: overrides.budgetCents ?? 500000,
    targetAudience: 'Developers aged 25-40',
    minCommunitySize: 1000,
  };

  const res = await request
    .post('/api/campaigns')
    .set('Authorization', `Bearer ${brandToken}`)
    .send(payload);

  if (res.status !== 201) {
    throw new Error(`createCampaign failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return res.body;
}
