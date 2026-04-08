import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { brands, BRAND_SAFETY_CATEGORIES } from '../db/schema';
import { signToken, requireAuth, requireRole } from '../middleware/auth';

const router = Router();

const RegisterSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(8),
  website: z.string().url().optional(),
  industry: z.string().max(100).optional(),
  description: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Slug helper
function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

router.post('/register', async (req: Request, res: Response) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }
  const { name, email, password, website, industry, description } = parsed.data;

  const existing = await db.select({ id: brands.id }).from(brands).where(eq(brands.email, email)).limit(1);
  if (existing.length > 0) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const baseSlug = toSlug(name);

  const [brand] = await db.insert(brands).values({
    name,
    slug: `${baseSlug}-${Date.now()}`,
    email,
    passwordHash,
    website,
    industry,
    description,
  }).returning({ id: brands.id, name: brands.name, email: brands.email, slug: brands.slug });

  const token = signToken(brand.id, 'brand');
  return res.status(201).json({ token, brand });
});

router.post('/login', async (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const [brand] = await db.select().from(brands).where(eq(brands.email, email)).limit(1);
  if (!brand) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const valid = await bcrypt.compare(password, brand.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  if (brand.status !== 'active') {
    return res.status(403).json({ error: 'Account suspended' });
  }

  const token = signToken(brand.id, 'brand');
  return res.json({
    token,
    brand: { id: brand.id, name: brand.name, email: brand.email, slug: brand.slug },
  });
});

router.get('/me', requireAuth, requireRole('brand'), async (req: Request, res: Response) => {
  const [brand] = await db
    .select({ id: brands.id, name: brands.name, email: brands.email, slug: brands.slug, website: brands.website, industry: brands.industry, description: brands.description, status: brands.status })
    .from(brands)
    .where(eq(brands.id, req.auth!.sub))
    .limit(1);

  if (!brand) return res.status(404).json({ error: 'Not found' });
  return res.json(brand);
});

const SafetySettingsSchema = z.object({
  excludedCategories: z.array(z.enum(BRAND_SAFETY_CATEGORIES as unknown as [string, ...string[]])).optional().default([]),
  excludedKeywords: z.array(z.string().max(100)).max(100).optional().default([]),
});

// GET /api/brands/me/safety-settings — return brand's current safety configuration
router.get('/me/safety-settings', requireAuth, requireRole('brand'), async (req: Request, res: Response) => {
  const [brand] = await db
    .select({ brandSafetyCategories: brands.brandSafetyCategories, brandSafetyKeywords: brands.brandSafetyKeywords })
    .from(brands)
    .where(eq(brands.id, req.auth!.sub))
    .limit(1);

  if (!brand) return res.status(404).json({ error: 'Not found' });
  return res.json({
    excludedCategories: brand.brandSafetyCategories ?? [],
    excludedKeywords: brand.brandSafetyKeywords ?? [],
    availableCategories: BRAND_SAFETY_CATEGORIES,
  });
});

// PUT /api/brands/me/safety-settings — update brand's safety configuration
router.put('/me/safety-settings', requireAuth, requireRole('brand'), async (req: Request, res: Response) => {
  const parsed = SafetySettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const { excludedCategories, excludedKeywords } = parsed.data;

  // Normalize keywords: lowercase, dedupe, strip empty
  const normalizedKeywords = [...new Set(
    excludedKeywords.map((k) => k.trim().toLowerCase()).filter(Boolean),
  )];

  await db
    .update(brands)
    .set({
      brandSafetyCategories: excludedCategories,
      brandSafetyKeywords: normalizedKeywords,
      updatedAt: new Date(),
    })
    .where(eq(brands.id, req.auth!.sub));

  return res.json({
    excludedCategories,
    excludedKeywords: normalizedKeywords,
    availableCategories: BRAND_SAFETY_CATEGORIES,
  });
});

export default router;
