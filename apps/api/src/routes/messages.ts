/**
 * Platform-first messaging routes
 *
 * All brand <-> community owner communication is routed through this API.
 * Raw contact details (email, phone) are NEVER returned by any endpoint here.
 *
 * Auth: either role may access. Callers only see conversations they are party to.
 *
 * Routes:
 *   GET    /api/messages/conversations              — list my conversations
 *   POST   /api/messages/conversations              — start a conversation
 *   GET    /api/messages/conversations/:id          — get conversation + messages
 *   POST   /api/messages/conversations/:id/messages — send a message
 *   POST   /api/messages/conversations/:id/read     — mark conversation as read
 */

import { Router, Request, Response } from 'express';
import { eq, and, or, desc } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import {
  conversations,
  messages,
  brands,
  communityOwners,
  deals,
} from '../db/schema';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a where clause that restricts a conversation to the authenticated caller.
 * Brands see conversations where brand_id = their id.
 * Community owners see conversations where community_owner_id = their id.
 */
function callerFilter(req: Request) {
  if (req.auth!.role === 'brand') {
    return eq(conversations.brandId, req.auth!.sub);
  }
  return eq(conversations.communityOwnerId, req.auth!.sub);
}

// ─── List conversations ───────────────────────────────────────────────────────

router.get('/conversations', async (req: Request, res: Response) => {
  const rows = await db
    .select({
      id: conversations.id,
      subject: conversations.subject,
      status: conversations.status,
      dealId: conversations.dealId,
      brandId: conversations.brandId,
      communityOwnerId: conversations.communityOwnerId,
      brandLastReadAt: conversations.brandLastReadAt,
      ownerLastReadAt: conversations.ownerLastReadAt,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
      // Display names only — no raw contact info
      brandName: brands.name,
      ownerName: communityOwners.name,
    })
    .from(conversations)
    .innerJoin(brands, eq(conversations.brandId, brands.id))
    .innerJoin(communityOwners, eq(conversations.communityOwnerId, communityOwners.id))
    .where(callerFilter(req))
    .orderBy(desc(conversations.updatedAt));

  return res.json(rows);
});

// ─── Start a conversation ─────────────────────────────────────────────────────

const CreateConversationSchema = z.object({
  // Who the other party is — depends on caller role
  // Brands supply communityOwnerId, community owners supply brandId
  communityOwnerId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  subject: z.string().max(255).optional(),
  initialMessage: z.string().min(1),
});

router.post('/conversations', async (req: Request, res: Response) => {
  const parsed = CreateConversationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }
  const data = parsed.data;

  let brandId: string;
  let communityOwnerId: string;

  if (req.auth!.role === 'brand') {
    brandId = req.auth!.sub;
    if (!data.communityOwnerId) {
      return res.status(400).json({ error: 'communityOwnerId is required for brand callers' });
    }
    communityOwnerId = data.communityOwnerId;
    // Verify the community owner exists
    const [owner] = await db.select({ id: communityOwners.id }).from(communityOwners).where(eq(communityOwners.id, communityOwnerId)).limit(1);
    if (!owner) return res.status(404).json({ error: 'Community owner not found' });
  } else {
    communityOwnerId = req.auth!.sub;
    if (!data.brandId) {
      return res.status(400).json({ error: 'brandId is required for community owner callers' });
    }
    brandId = data.brandId;
    // Verify the brand exists
    const [brand] = await db.select({ id: brands.id }).from(brands).where(eq(brands.id, brandId)).limit(1);
    if (!brand) return res.status(404).json({ error: 'Brand not found' });
  }

  // Check if conversation already exists for this pair (+deal if provided)
  const existing = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.brandId, brandId),
        eq(conversations.communityOwnerId, communityOwnerId),
        data.dealId ? eq(conversations.dealId, data.dealId) : eq(conversations.dealId, conversations.dealId),
      ),
    )
    .limit(1);

  let conversationId: string;

  if (existing.length > 0) {
    conversationId = existing[0].id;
  } else {
    const [created] = await db
      .insert(conversations)
      .values({
        brandId,
        communityOwnerId,
        dealId: data.dealId,
        subject: data.subject,
      })
      .returning({ id: conversations.id });
    conversationId = created.id;
  }

  // Insert the initial message
  const [msg] = await db
    .insert(messages)
    .values({
      conversationId,
      senderType: req.auth!.role === 'brand' ? 'brand' : 'community_owner',
      senderId: req.auth!.sub,
      body: data.initialMessage,
    })
    .returning();

  // Update conversation timestamp
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));

  return res.status(201).json({ conversationId, message: msg });
});

// ─── Get conversation with messages ──────────────────────────────────────────

router.get('/conversations/:id', async (req: Request, res: Response) => {
  const [conv] = await db
    .select({
      id: conversations.id,
      subject: conversations.subject,
      status: conversations.status,
      dealId: conversations.dealId,
      brandId: conversations.brandId,
      communityOwnerId: conversations.communityOwnerId,
      brandLastReadAt: conversations.brandLastReadAt,
      ownerLastReadAt: conversations.ownerLastReadAt,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
      brandName: brands.name,
      ownerName: communityOwners.name,
    })
    .from(conversations)
    .innerJoin(brands, eq(conversations.brandId, brands.id))
    .innerJoin(communityOwners, eq(conversations.communityOwnerId, communityOwners.id))
    .where(and(eq(conversations.id, req.params.id), callerFilter(req)))
    .limit(1);

  if (!conv) return res.status(404).json({ error: 'Conversation not found' });

  const msgs = await db
    .select({
      id: messages.id,
      senderType: messages.senderType,
      senderId: messages.senderId,
      body: messages.body,
      createdAt: messages.createdAt,
      // _inboundEmailAddress intentionally omitted — audit only
    })
    .from(messages)
    .where(eq(messages.conversationId, conv.id))
    .orderBy(messages.createdAt);

  return res.json({ ...conv, messages: msgs });
});

// ─── Send a message ───────────────────────────────────────────────────────────

const SendMessageSchema = z.object({
  body: z.string().min(1).max(10000),
});

router.post('/conversations/:id/messages', async (req: Request, res: Response) => {
  const parsed = SendMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  // Verify caller is party to this conversation
  const [conv] = await db
    .select({ id: conversations.id, status: conversations.status })
    .from(conversations)
    .where(and(eq(conversations.id, req.params.id), callerFilter(req)))
    .limit(1);

  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  if (conv.status === 'closed') return res.status(409).json({ error: 'Conversation is closed' });

  const [msg] = await db
    .insert(messages)
    .values({
      conversationId: conv.id,
      senderType: req.auth!.role === 'brand' ? 'brand' : 'community_owner',
      senderId: req.auth!.sub,
      body: parsed.data.body,
    })
    .returning({
      id: messages.id,
      senderType: messages.senderType,
      senderId: messages.senderId,
      body: messages.body,
      createdAt: messages.createdAt,
    });

  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conv.id));

  return res.status(201).json(msg);
});

// ─── Mark conversation as read ────────────────────────────────────────────────

router.post('/conversations/:id/read', async (req: Request, res: Response) => {
  const [conv] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(eq(conversations.id, req.params.id), callerFilter(req)))
    .limit(1);

  if (!conv) return res.status(404).json({ error: 'Conversation not found' });

  const now = new Date();
  if (req.auth!.role === 'brand') {
    await db.update(conversations).set({ brandLastReadAt: now }).where(eq(conversations.id, conv.id));
  } else {
    await db.update(conversations).set({ ownerLastReadAt: now }).where(eq(conversations.id, conv.id));
  }

  return res.json({ ok: true });
});

export default router;
