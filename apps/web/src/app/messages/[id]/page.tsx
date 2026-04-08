'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { messagesApi, ConversationDetail, Message } from '@/lib/api';

const PII_ERROR =
  "For your protection, we don't allow sharing email addresses or phone numbers. Keep communication on Sphere.";

export default function ConversationPage() {
  const params = useParams();
  const id = params?.id as string;

  const [conv, setConv] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('brandToken') || localStorage.getItem('communityToken') || ''
      : '';

  useEffect(() => {
    if (!token || !id) return;
    messagesApi
      .getConversation(token, id)
      .then((data) => {
        setConv(data);
        // Mark as read
        messagesApi.markRead(token, id).catch(() => {});
      })
      .catch(() => setError('Conversation not found'))
      .finally(() => setLoading(false));
  }, [token, id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conv?.messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !conv) return;
    setSendError('');
    setSending(true);
    try {
      const msg = await messagesApi.sendMessage(token, conv.id, draft.trim());
      setConv((prev) =>
        prev ? { ...prev, messages: [...prev.messages, msg] } : prev,
      );
      setDraft('');
    } catch (err: any) {
      // Surface PII block error clearly; use generic fallback for others
      if (err?.error === PII_ERROR || err?.code === 'pii_blocked') {
        setSendError(PII_ERROR);
      } else {
        setSendError(err?.error ?? 'Failed to send message.');
      }
    } finally {
      setSending(false);
    }
  }

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;
  if (error || !conv) return (
    <div className="p-8">
      <p className="text-red-500">{error || 'Conversation not found'}</p>
      <Link href="/messages" className="text-indigo-600 hover:underline mt-2 inline-block">← Back to inbox</Link>
    </div>
  );

  const myRole =
    typeof window !== 'undefined' && localStorage.getItem('brandToken')
      ? 'brand'
      : 'community_owner';

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 flex flex-col h-screen">
      {/* Header */}
      <div className="mb-4">
        <Link href="/messages" className="text-indigo-600 hover:underline text-sm">← Inbox</Link>
        <h1 className="text-xl font-semibold text-gray-900 mt-1">
          {conv.subject ?? `${conv.brandName} ↔ ${conv.ownerName}`}
        </h1>
        <p className="text-sm text-gray-500">{conv.brandName} &amp; {conv.ownerName}</p>
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto space-y-3 py-4 border-t border-gray-200">
        {conv.messages.length === 0 && (
          <p className="text-gray-400 text-sm text-center">No messages yet. Start the conversation.</p>
        )}
        {conv.messages.map((msg) => {
          const isMe = msg.senderType === myRole;
          const isSystem = msg.senderType === 'system';
          return (
            <div
              key={msg.id}
              className={`flex ${isSystem ? 'justify-center' : isMe ? 'justify-end' : 'justify-start'}`}
            >
              {isSystem ? (
                <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-3 py-1">
                  {msg.body}
                </span>
              ) : (
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                  <p className={`text-xs mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      <div className="border-t border-gray-200 pt-4">
        {sendError && (
          <div className="mb-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            {sendError}
          </div>
        )}
        <form onSubmit={handleSend} className="flex gap-2">
          <textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setSendError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e as any);
              }
            }}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            rows={2}
            className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="self-end px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending…' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
