'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { messagesApi, ConversationSummary } from '@/lib/api';

const PII_ERROR =
  "For your protection, we don't allow sharing email addresses or phone numbers. Keep communication on Sphere.";

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('brandToken') || localStorage.getItem('communityToken') || ''
      : '';

  useEffect(() => {
    if (!token) {
      setError('Not logged in');
      setLoading(false);
      return;
    }
    messagesApi
      .listConversations(token)
      .then(setConversations)
      .catch(() => setError('Failed to load conversations'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>
      {conversations.length === 0 ? (
        <p className="text-gray-500">No conversations yet.</p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
          {conversations.map((conv) => (
            <li key={conv.id}>
              <Link
                href={`/messages/${conv.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {conv.subject ?? `${conv.brandName} ↔ ${conv.ownerName}`}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {conv.brandName} &amp; {conv.ownerName}
                  </p>
                </div>
                <div className="ml-4 text-xs text-gray-400 whitespace-nowrap">
                  {new Date(conv.updatedAt).toLocaleDateString()}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
