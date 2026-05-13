# Sphere — Project Context for Claude Code

## What Sphere is

Sphere is a two-sided marketplace connecting **brands** with **community owners** (Discord, Slack, Telegram, WhatsApp, Reddit, newsletters, Facebook groups, Circle, Mighty Networks) for authentic, paid partnerships. The platform handles matching, AI-assisted negotiation, contracts, escrow payments, messaging with PII protection, and dispute resolution.

Revenue model: monthly subscription for brands (Starter $250 / Growth $450 / Scale $1000) plus a 5% take-rate on closed deals. Community owners earn payouts into a wallet balance and withdraw.

## Three user roles

1. **brand** — companies running campaigns (table: `brands`). Email + password auth, Stripe subscription, brand-safety filters, partnership limits per tier.
2. **community_owner** — operators of communities (table: `community_owners`, with `communities` they own). Email + password auth, wallet balance, payout flow.
3. **admin** — Sphere staff. Currently API-key-protected (no UI login). Needs a real admin login + dashboard built out. Responsibilities: moderation, bulk community imports, dispute resolution, scraper management.

Every protected route should know which role the requester has and enforce permissions accordingly.

## Current stack (pre-migration)

- **Monorepo**: Turbo + npm workspaces (`apps/web`, `apps/api`, `packages/ui`)
- **Web**: Next.js 14 (App Router), React 18, TypeScript, Tailwind, lucide-react, Sentry, PostHog
- **API**: Express + TypeScript, Drizzle ORM, JWT auth (bcryptjs), Zod validation, Helmet, CORS
- **Database**: PostgreSQL on Neon
- **AI**: Anthropic SDK (`@anthropic-ai/sdk`) powers matching scoring and negotiation services
- **Payments**: Stripe (subscriptions + payment intents + transfers for payouts)
- **Email**: Resend
- **Storage**: Cloudinary (env vars present)
- **Observability**: Sentry + PostHog (analytics, feature flags, session replay)
- **Hosting**: Vercel (web) + Railway (api). Render and Docker configs also present but unused.
- **Testing**: Jest + Supertest (API integration), Playwright (E2E)

## Strategic direction — Supabase-native migration

We are migrating away from the Express + Neon + custom-JWT stack to a Supabase-first architecture. This is the project's overriding direction. When making decisions, prefer the Supabase-native path even if it means a refactor.

**Target stack:**
- **DB + Auth + Storage + Realtime**: Supabase (Postgres, Supabase Auth, Supabase Storage, Realtime)
- **API**: Next.js API routes (and/or Supabase Edge Functions for heavy/scheduled work)
- **Frontend**: Same — Next.js + Tailwind + shadcn/ui (port the design system from the HTML prototype)
- **Payments / Email / Observability**: Stripe / Resend / Sentry / PostHog (unchanged)
- **Hosting**: Vercel (web) + Supabase (everything else). Drop Railway.

**Migration sequencing (do not skip steps):**
1. Set up Supabase staging + production projects.
2. Port the Drizzle schema to Supabase SQL migrations. Verify the schema lands cleanly.
3. Migrate auth: link `brands` and `community_owners` to `auth.users`. Remove `passwordHash`, email verification tokens, password reset tokens from the schema — Supabase Auth handles all of that.
4. Add RLS policies on every table. Brand can see their own campaigns. Community owner can see their communities + matched opportunities. Admin can see everything.
5. Port Express routes to Next.js API routes incrementally: auth → campaigns → matching → deals → messages → billing → admin. Keep Express running until each area is fully migrated and tested.
6. Replace Cloudinary with Supabase Storage buckets.
7. Decommission Railway and the `apps/api` package once the last route is migrated.
8. Build the admin login UI + dashboard (currently just API-key-guarded routes).
9. Close the design-implementation gap by porting the visual system from the HTML design prototype into the Next.js components.

## Important conventions

- **Database migrations are files in the repo.** Never modify the schema via the Supabase or Neon dashboard. Always create a migration file, check it into git, and run `db:migrate`. Drift between environments is the #1 thing that will hurt us.
- **TypeScript everywhere.** No untyped `any` unless absolutely necessary.
- **Currency is stored in cents** (integers). UI converts to dollars. See `budgetCents`, `agreedRateCents`, `walletBalanceCents`, `SUBSCRIPTION_TIERS`.
- **UUIDs** for all primary keys (`uuid('id').primaryKey().defaultRandom()`).
- **Enums** are Postgres enums via Drizzle's `pgEnum` (e.g. `dealStatusEnum`, `campaignStatusEnum`).
- **Server-only secrets** (Stripe secret key, JWT secret, Resend key, Anthropic key) must never appear in any file under `apps/web/public/` or in any variable prefixed with `NEXT_PUBLIC_`.
- **PII protection in messages** is required — see `apps/api/src/services/pii.ts`. The migration must preserve this behavior.
- **Stripe webhooks** must receive the raw request body — keep the `express.raw` middleware (or equivalent in Next.js: don't parse the body before the signature is verified).

## Testing

- API integration tests live in `apps/api/src/__tests__/`. Run with `npm test --workspace=apps/api`. Tests use Jest + Supertest against a dedicated test database (`sphere_test`). After migration, these tests need to be moved to wherever the new API routes live.
- E2E tests live in `apps/web/e2e/`. Run with `npx playwright test --config=apps/web/playwright.config.ts`. Test accounts (must exist in staging DB): `brand@test.sphere.com / TestBrand123!` and `community@test.sphere.com / TestCommunity123!`.
- Add new tests for every new route and every refactored route. Don't ship migration work without test coverage proving the old behavior is preserved.

## Visual design

The design system lives in the HTML prototype (Caroline has the file). Key tokens:

- **Fonts**: Inter (body), Space Grotesk (display/headings)
- **Accent color**: `#00C662` (light) / `#00F078` (dark). Hover: `#00A854` / `#00D468`.
- **Sidebar**: 220px wide, dark background even in light mode (`#111110` / `#0A0A09`).
- **Radii**: 6px small, 10px medium.
- **Theme**: support light + dark via `data-theme` attribute and CSS variables.
- **Iconography**: lucide-react.
- **Layout**: app-shell with persistent left sidebar, main content area, optional right rail.

When building components, mirror these tokens via Tailwind config and shadcn/ui theming. Use shadcn/ui primitives wherever possible rather than hand-rolling components.

## Page structure (current Next.js routes)

```
/                       — marketing homepage
/signup                 — generic signup landing
/privacy                — privacy policy
/hub                    — central hub
/brand/register         — brand signup
/brand/login            — brand login
/brand/onboarding       — brand onboarding wizard
/brand/dashboard        — brand dashboard
/brand/safety           — brand safety filters
/brand/campaigns/new    — create campaign
/brand/campaigns/[id]   — campaign detail
/brand/campaigns/[id]/report
/brand/communities/[communityId]
/community/register     — community owner signup
/community/login        — community owner login
/community/onboarding   — community owner onboarding
/community/communities  — list owned communities
/community/communities/new
/community/communities/[id]/topics
/community/campaigns    — campaigns relevant to my communities
/community/opportunities
/community/my-applications
/admin/communities      — admin community list (currently the only admin page)
/deals/[id]             — deal/partnership detail
/messages               — messages inbox
/messages/[id]          — message thread
```

After migration the admin section needs a full dashboard (login, communities, brands, disputes, scraper, payouts, metrics).

## Rules for Claude Code working in this repo

1. **Always commit before destructive changes.** If `git status` shows uncommitted work, ask Caroline before running anything that could overwrite it.
2. **Read before writing.** Use the Read tool first on any file you intend to modify.
3. **Migrations as files.** Schema changes go in `apps/api/src/db/migrations/` (current) or the new Supabase migrations folder (after migration begins). Never via dashboard.
4. **Preserve RLS.** Once RLS is enabled on a table, every new query path must respect it — never bypass RLS with the service role key from client-callable code.
5. **No new code in `apps/api/`** during the migration phase unless explicitly directed. New routes go into Next.js API routes.
6. **Run tests after meaningful changes.** API: `npm test --workspace=apps/api`. Web build: `npm run build --workspace=apps/web`.
7. **Ask, don't assume.** If a refactor has more than one reasonable interpretation, ask Caroline before proceeding.

## Caroline's context

- Non-technical builder, can follow clear instructions but won't write code herself.
- Wants the system to be easy to manage long-term — favor managed services and minimal ops.
- Was previously using "Paperclip agents" for orchestration. Dropping that; using Claude Code instead.
- Default communication style: explain *why* before *how* for any significant decision.
