import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { brands, BRAND_SAFETY_CATEGORIES } from '../db/schema';
import { signToken, requireAuth, requireRole } from '../middleware/auth';
import {
  sendSignupConfirmationEmail,
  sendPasswordResetEmail,
} from '../services/email';
import { trackServerEvent } from '../services/analytics';

const router = Router();

const CURRENT_TOS_VERSION = '2026-04-08';

const RegisterSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(8),
  website: z.string().url().optional(),
  industry: z.string().max(100).optional(),
  description: z.string().optional(),
  tosAccepted: z.boolean().refine((v) => v === true, {
    message: 'You must accept the Terms of Service to create an account',
  }),
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
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  const [brand] = await db.insert(brands).values({
    name,
    slug: `${baseSlug}-${Date.now()}`,
    email,
    passwordHash,
    website,
    industry,
    description,
    emailVerificationToken: verificationToken,
    emailVerificationTokenExpiresAt: tokenExpiry,
    tosAcceptedAt: new Date(),
    tosVersion: CURRENT_TOS_VERSION,
  }).returning({ id: brands.id, name: brands.name, email: brands.email, slug: brands.slug });

  // Send verification email (non-blocking — don't fail registration if email fails)
  sendSignupConfirmationEmail({
    to: email,
    name,
    role: 'brand',
    verificationToken,
  }).catch((err) => console.error('[email] signup confirmation failed:', err));

  const token = signToken(brand.id, 'brand');
  trackServerEvent(brand.id, 'signup_completed', { user_type: 'brand', industry });
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

/**
 * POST /api/brands/verify-email
 * Verify email address using the token sent on signup.
 */
router.post('/verify-email', async (req: Request, res: Response) => {
  const schema = z.object({ token: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'token is required' });

  const [brand] = await db
    .select()
    .from(brands)
    .where(eq(brands.emailVerificationToken, parsed.data.token))
    .limit(1);

  if (!brand) return res.status(400).json({ error: 'Invalid or expired token' });
  if (brand.emailVerificationTokenExpiresAt && brand.emailVerificationTokenExpiresAt < new Date()) {
    return res.status(400).json({ error: 'Verification token has expired' });
  }
  if (brand.emailVerifiedAt) {
    return res.json({ message: 'Email already verified' });
  }

  await db.update(brands).set({
    emailVerifiedAt: new Date(),
    emailVerificationToken: null,
    emailVerificationTokenExpiresAt: null,
    updatedAt: new Date(),
  }).where(eq(brands.id, brand.id));

  return res.json({ message: 'Email verified successfully' });
});

/**
 * POST /api/brands/forgot-password
 * Request a password reset email.
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
  const schema = z.object({ email: z.string().email() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Valid email is required' });

  // Always return success to prevent email enumeration
  const [brand] = await db.select().from(brands).where(eq(brands.email, parsed.data.email)).limit(1);
  if (brand) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await db.update(brands).set({
      passwordResetToken: resetToken,
      passwordResetTokenExpiresAt: tokenExpiry,
      updatedAt: new Date(),
    }).where(eq(brands.id, brand.id));

    sendPasswordResetEmail({
      to: brand.email,
      name: brand.name,
      role: 'brand',
      resetToken,
    }).catch((err) => console.error('[email] password reset failed:', err));
  }

  return res.json({ message: 'If that email is registered, you will receive a reset link.' });
});

/**
 * POST /api/brands/reset-password
 * Set a new password using the reset token.
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  const schema = z.object({
    token: z.string().min(1),
    password: z.string().min(8),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'token and password (min 8 chars) are required' });

  const [brand] = await db
    .select()
    .from(brands)
    .where(eq(brands.passwordResetToken, parsed.data.token))
    .limit(1);

  if (!brand) return res.status(400).json({ error: 'Invalid or expired token' });
  if (brand.passwordResetTokenExpiresAt && brand.passwordResetTokenExpiresAt < new Date()) {
    return res.status(400).json({ error: 'Reset token has expired' });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await db.update(brands).set({
    passwordHash,
    passwordResetToken: null,
    passwordResetTokenExpiresAt: null,
    updatedAt: new Date(),
  }).where(eq(brands.id, brand.id));

  return res.json({ message: 'Password reset successfully' });
});

router.get('/me', requireAuth, requireRole('brand'), async (req: Request, res: Response) => {
  const [brand] = await db
    .select({ id: brands.id, name: brands.name, email: brands.email, slug: brands.slug, website: brands.website, industry: brands.industry, description: brands.description, status: brands.status, createdAt: brands.createdAt })
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
