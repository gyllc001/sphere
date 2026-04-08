import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { communityOwners } from '../db/schema';
import { signToken, requireAuth, requireRole } from '../middleware/auth';

const router = Router();

const RegisterSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(8),
  bio: z.string().optional(),
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

  const passwordHash = await bcrypt.hash(password, 12);

  const [owner] = await db.insert(communityOwners).values({
    name,
    email,
    passwordHash,
    bio,
  }).returning({ id: communityOwners.id, name: communityOwners.name, email: communityOwners.email });

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
