# Sphere — Testing Guide

## Overview

Sphere has two test layers:

| Layer | Framework | Location | Target |
|-------|-----------|----------|--------|
| API integration | Jest + Supertest | `apps/api/src/__tests__/` | Backend API routes |
| E2E | Playwright | `apps/web/e2e/` | Full stack via browser |

---

## API Integration Tests (Jest + Supertest)

These tests hit the real Express app mounted in-process. They require a dedicated test database.

### Setup

```bash
# 1. Create a test database (must NOT be production)
createdb sphere_test

# 2. Copy the env template
cp apps/api/.env.test.example apps/api/.env.test
# Fill in TEST_DATABASE_URL, JWT_SECRET, etc.

# 3. Run migrations against the test DB
TEST_DATABASE_URL=postgresql://... npm run db:migrate --workspace=apps/api

# 4. Install ts-jest (needed by jest.config.ts)
npm install --save-dev ts-jest @types/jest supertest @types/supertest --workspace=apps/api
```

### Run

```bash
# All API tests
npm test --workspace=apps/api

# Single test file
npm test --workspace=apps/api -- --testPathPattern=auth.brand

# Watch mode
npm test --workspace=apps/api -- --watch
```

### Test files

| File | Area |
|------|------|
| `auth.brand.test.ts` | Brand signup / login / token validation |
| `auth.community.test.ts` | Community owner signup / login / token validation |
| `campaigns.test.ts` | Campaign brief CRUD, dashboard accuracy |
| `community-portal.test.ts` | Community listing, opportunities, accept/decline/counter |
| `matching.test.ts` | AI matching engine, match quality, vetting |
| `deals.test.ts` | Deal lifecycle, AI negotiation state machine, payments |
| `messages.pii.test.ts` | Platform-first messaging, PII detection |
| `disputes.test.ts` | Dispute raise, admin resolution |

### Test helpers

- `src/__tests__/helpers/factory.ts` — creates brand accounts, community owners, communities, and campaigns via the API
- `src/__tests__/helpers/globalSetup.ts` — validates env vars before suite runs
- `src/__tests__/helpers/globalTeardown.ts` — cleanup hook (extend as needed)

---

## E2E Tests (Playwright)

These tests drive a real browser against the deployed staging environment.

### Setup

```bash
# Install Playwright + browser binaries
npm install --save-dev @playwright/test --workspace=apps/web
npx playwright install chromium
```

### Run

```bash
# All E2E tests against staging
npx playwright test --config=apps/web/playwright.config.ts

# Local dev (start api + web first)
PLAYWRIGHT_BASE_URL=http://localhost:3000 \
PLAYWRIGHT_API_URL=http://localhost:4000 \
npx playwright test --config=apps/web/playwright.config.ts

# Single spec
npx playwright test apps/web/e2e/auth.spec.ts

# Interactive UI mode
npx playwright test --ui --config=apps/web/playwright.config.ts
```

### Test accounts (staging)

| Role | Email | Password |
|------|-------|----------|
| Brand | brand@test.sphere.com | TestBrand123! |
| Community Owner | community@test.sphere.com | TestCommunity123! |

> These accounts must exist in the staging database before E2E tests run. Create them manually or via the factory helper after Railway is restored ([SPHA-68](/SPHA/issues/SPHA-68)).

### E2E spec files

| File | Area |
|------|------|
| `auth.spec.ts` | Brand + community auth, cross-role access |
| `brand-portal.spec.ts` | Dashboard, campaign brief, opportunity board, deals |
| `community-portal.spec.ts` | Profile setup, opportunities, deals, messaging |

---

## CI Integration (Future)

When Railway is stable, add to CI pipeline:
1. Spin up test DB from `TEST_DATABASE_URL` secret
2. Run migrations: `npm run db:migrate --workspace=apps/api`
3. Run API tests: `npm test --workspace=apps/api`
4. Run E2E tests: `npx playwright test --config=apps/web/playwright.config.ts`
5. Upload Playwright HTML report as artifact
