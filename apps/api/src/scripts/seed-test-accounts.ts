/**
 * Seed test accounts for brand and community sides.
 * Run after migrations. Skips gracefully if emails already exist.
 *
 * Usage: ts-node -r tsconfig-paths/register scripts/seed-test-accounts.ts
 */
import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { brands, communityOwners, communities } from '../src/db/schema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function seed() {
  // ── Brand test account ─────────────────────────────────────────────────────
  const brandEmail = 'brand@test.sphere.com';
  const [existingBrand] = await db
    .select({ id: brands.id })
    .from(brands)
    .where(eq(brands.email, brandEmail))
    .limit(1);

  if (existingBrand) {
    console.log(`Brand account already exists (${brandEmail}), skipping.`);
  } else {
    const passwordHash = await bcrypt.hash('TestBrand123!', 12);
    const [brand] = await db
      .insert(brands)
      .values({
        name: 'Test Brand Co',
        slug: 'test-brand-co',
        email: brandEmail,
        passwordHash,
        industry: 'Technology',
        description: 'Test brand account for QA and board demos.',
      })
      .returning({ id: brands.id });
    console.log(`Created brand account: ${brandEmail} (id: ${brand.id})`);
  }

  // ── Community owner test account ───────────────────────────────────────────
  const ownerEmail = 'community@test.sphere.com';
  const [existingOwner] = await db
    .select({ id: communityOwners.id })
    .from(communityOwners)
    .where(eq(communityOwners.email, ownerEmail))
    .limit(1);

  let ownerId: string;

  if (existingOwner) {
    console.log(`Community owner account already exists (${ownerEmail}), skipping.`);
    ownerId = existingOwner.id;
  } else {
    const passwordHash = await bcrypt.hash('TestCommunity123!', 12);
    const [owner] = await db
      .insert(communityOwners)
      .values({
        name: 'Test Community Owner',
        email: ownerEmail,
        passwordHash,
        bio: 'Test community owner account for QA and board demos.',
      })
      .returning({ id: communityOwners.id });
    console.log(`Created community owner account: ${ownerEmail} (id: ${owner.id})`);
    ownerId = owner.id;
  }

  // ── Seed a demo community if none exists for this owner ────────────────────
  const [existingCommunity] = await db
    .select({ id: communities.id })
    .from(communities)
    .where(eq(communities.ownerId, ownerId))
    .limit(1);

  if (existingCommunity) {
    console.log(`Demo community already exists for owner, skipping.`);
  } else {
    const [community] = await db
      .insert(communities)
      .values({
        ownerId,
        name: 'Test Tech Community',
        slug: 'test-tech-community',
        description: 'A demo tech community for QA testing.',
        platform: 'discord',
        niche: 'Technology',
        memberCount: 5000,
        engagementRate: '8%',
      })
      .returning({ id: communities.id });
    console.log(`Created demo community (id: ${community.id})`);
  }

  console.log('\nSeed complete. Test credentials:');
  console.log('  Brand:     brand@test.sphere.com / TestBrand123!');
  console.log('  Community: community@test.sphere.com / TestCommunity123!');

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
