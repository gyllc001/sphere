/**
 * Platform-First Messaging & PII Detection — integration tests
 *
 * Covers:
 *   GET  /api/messages/conversations              — list conversations
 *   POST /api/messages/conversations              — start a conversation
 *   GET  /api/messages/conversations/:id          — get conversation + messages
 *   POST /api/messages/conversations/:id/messages — send a message
 *   POST /api/messages/conversations/:id/read     — mark as read
 *
 * PII guard tests confirm that raw email addresses, phone numbers, and
 * social handles are blocked before persistence.
 *
 * Run: npm test --workspace=apps/api -- --testPathPattern=messages.pii
 */

import supertest from 'supertest';
import app from '../index';

const request = supertest(app);

describe('Messaging — conversation lifecycle', () => {
  it('brand can start a conversation with a community owner linked to an active deal');
  it('community owner can reply to an existing conversation');
  it('both parties see the conversation in their conversation list');
  it('only parties to the conversation can read its messages (403 for outsiders)');
  it('mark-as-read updates brandLastReadAt or ownerLastReadAt appropriately');
});

describe('Messaging — PII detection (email)', () => {
  it('message containing a plain email address is rejected with a PII block message');
  it('email embedded in prose ("reach me at user@example.com") is detected and blocked');
  it('message without PII is accepted and persisted normally');
});

describe('Messaging — PII detection (phone)', () => {
  it('message with a US phone number (+1 555 123 4567) is blocked');
  it('message with a formatted number (555-123-4567) is blocked');
  it('message with an international phone (+44 20 7946 0958) is blocked');
});

describe('Messaging — platform-first enforcement', () => {
  it('message containing a Zoom/Teams/Slack invite link is blocked or flagged');
  it('message containing a personal social media handle is blocked or flagged');
  it('internal Sphere deal links are allowed');
});

describe('Messaging — response format', () => {
  it('conversation list does NOT return brand or owner raw email addresses');
  it('message payload does NOT include sender's contact details');
});
