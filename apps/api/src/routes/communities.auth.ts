import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { communityOwners } from '../db/schema';
import { signToken, requireAuth, requireRole } from '../middleware/auth';
import {
  sendSignupConfirmationEmail,
  sendPasswordResetEmail,
} from '../services/email';

const router = Router();

const CURRENT_TOS_VERSION = '2026-04-08';

const RegisterSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(8),
  bio: z.string().optional(),
  tosAccepted: z.boolean().refine((v) => v === true, {
    message: 'You must accept the Terms of Service to create an account',
  }),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/register', async (req: Request, res: Response) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }
  const { name, email, password, bio } = parsed.data;

  const existing = await db.select({ id: communityOwners.id }).from(communityOwners).where(eq(communityOwners.email, email)).limit(1);
  if (existing.length > 0) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 8);
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  const [owner] = await db.insert(communityOwners).values({
    name,
    email,
    passwordHash,
    bio,
    emailVerificationToken: verificationToken,
    emailVerificationTokenExpiresAt: tokenExpiry,
    tosAcceptedAt: new Date(),
    tosVersion: CURRENT_TOS_VERSION,
  }).returning({ id: communityOwners.id, name: communityOwners.name, email: communityOwners.email });

  // Send verification email (non-blocking)
  sendSignupConfirmationEmail({
    to: email,
    name,
    role: 'community_owner',
    verificationToken,
  }).catch((err) => console.error('[email] signup confirmation failed:', err));

  const token = signToken(owner.id, 'community_owner');
  return res.status(201).json({ token, owner });
});

router.post('/login', async (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const [owner] = await db.select().from(communityOwners).where(eq(communityOwners.email, email)).limit(1);
  if (!owner) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const valid = await bcrypt.compare(password, owner.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  if (owner.status !== 'active') {
    return res.status(403).json({ error: 'Account suspended' });
  }

  const token = signToken(owner.id, 'community_owner');
  return res.json({
    token,
    owner: { id: owner.id, name: owner.name, email: owner.email },
  });
});

/**
 * POST /api/communities/verify-email
 */
router.post('/verify-email', async (req: Request, res: Response) => {
  const schema = z.object({ token: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'token is required' });

  const [owner] = await db
    .select()
    .from(communityOwners)
    .where(eq(communityOwners.emailVerificationToken, parsed.data.token))
    .limit(1);

  if (!owner) return res.status(400).json({ error: 'Invalid or expired token' });
  if (owner.emailVerificationTokenExpiresAt && owner.emailVerificationTokenExpiresAt < new Date()) {
    return res.status(400).json({ error: 'Verification token has expired' });
  }
  if (owner.emailVerifiedAt) {
    return res.json({ message: 'Email already verified' });
  }

  await db.update(communityOwners).set({
    emailVerifiedAt: new Date(),
    emailVerificationToken: null,
    emailVerificationTokenExpiresAt: null,
    updatedAt: new Date(),
  }).where(eq(communityOwners.id, owner.id));

  return res.json({ message: 'Email verified successfully' });
});

/**
 * POST /api/communities/forgot-password
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
  const schema = z.object({ email: z.string().email() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Valid email is required' });

  const [owner] = await db.select().from(communityOwners).where(eq(communityOwners.email, parsed.data.email)).limit(1);
  if (owner) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await db.update(communityOwners).set({
      passwordResetToken: resetToken,
      passwordResetTokenExpiresAt: tokenExpiry,
      updatedAt: new Date(),
    }).where(eq(communityOwners.id, owner.id));

    sendPasswordResetEmail({
      to: owner.email,
      name: owner.name,
      role: 'community_owner',
      resetToken,
    }).catch((err) => console.error('[email] password reset failed:', err));
  }

  return res.json({ message: 'If that email is registered, you will receive a reset link.' });
});

/**
 * POST /api/communities/reset-password
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  const schema = z.object({
    token: z.string().min(1),
    password: z.string().min(8),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'token and password (min 8 chars) are required' });

  const [owner] = await db
    .select()
    .from(communityOwners)
    .where(eq(communityOwners.passwordResetToken, parsed.data.token))
    .limit(1);

  if (!owner) return res.status(400).json({ error: 'Invalid or expired token' });
  if (owner.passwordResetTokenExpiresAt && owner.passwordResetTokenExpiresAt < new Date()) {
    return res.status(400).json({ error: 'Reset token has expired' });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 8);
  await db.update(communityOwners).set({
    passwordHash,
    passwordResetToken: null,
    passwordResetTokenExpiresAt: null,
    updatedAt: new Date(),
  }).where(eq(communityOwners.id, owner.id));

  return res.json({ message: 'Password reset successfully' });
});

router.get('/me', requireAuth, requireRole('community_owner'), async (req: Request, res: Response) => {
  const [owner] = await db
    .select({ id: communityOwners.id, name: communityOwners.name, email: communityOwners.email, bio: communityOwners.bio, avatarUrl: communityOwners.avatarUrl, status: communityOwners.status, createdAt: communityOwners.createdAt })
    .from(communityOwners)
    .where(eq(communityOwners.id, req.auth!.sub))
    .limit(1);

  if (!owner) return res.status(404).json({ error: 'Not found' });
  return res.json(owner);
});

export default router;
