'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { communityPortal, getToken, clearToken, type Community } from '@/lib/api';

const PLATFORM_LABELS: Record<string, string> = {
  discord: 'Discord',
  slack: 'Slack',
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  facebook_group: 'Facebook Group',
  reddit: 'Reddit',
  circle: 'Circle',
  mighty_networks: 'Mighty Networks',
  other: 'Other',
};

export default function CommunitiesPage() {
  const router = useRouter();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken('community');
    if (!token) {
      router.replace('/community/login');
      return;
    }
    communityPortal.listCommunities(token)
      .then(setCommunities)
      .catch((err) => {
        if (err.message?.includes('Unauthorized') || err.message?.includes('401')) {
          clearToken('community');
          router.replace('/community/login');
        } else {
          setError(err.message);
        }
      });
  }, [router]);

  function handleLogout() {
    clearToken('community');
    router.push('/community/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold text-gray-900">Sphere</Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/community/communities" className="font-medium text-green-600">My Communities</Link>
            <Link href="/community/campaigns" className="text-gray-600 hover:text-gray-900">Browse Campaigns</Link>
            <Link href="/community/opportunities" className="text-gray-600 hover:text-gray-900">Inbound Offers</Link>
            <Link href="/community/my-applications" className="text-gray-600 hover:text-gray-900">My Applications</Link>
          </nav>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-800">
          Sign out
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Communities</h1>
          <Link
            href="/community/communities/new"
            className="bg-green-600 text-white text-sm px-4 py-2 rounded-md hover:bg-green-700"
          >
            + Add Community
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>
        )}

        {communities.length === 0 ? (
          <div className="bg-white rounded-lg border p-12 text-center">
            <p className="text-gray-400 mb-4">No communities listed yet</p>
            <Link href="/community/communities/new" className="text-green-600 text-sm hover:underline">
              List your first community →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {communities.map((c) => (
              <div key={c.id} className="bg-white rounded-lg border p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold">{c.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {PLATFORM_LABELS[c.platform] || c.platform} · {c.memberCount?.toLocaleString()} members
                      {c.niche && ` · ${c.niche}`}
                      {c.vertical && ` · ${c.vertical}`}
                    </p>
                    {c.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{c.description}</p>
                    )}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {c.adminDiscordUserId && (
                        <a
                          href={`https://discord.com/users/${c.adminDiscordUserId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100"
                        >
                          Discord DM
                        </a>
                      )}
                      {c.adminPhone && (
                        <a
                          href={`https://wa.me/${c.adminPhone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100"
                        >
                          WhatsApp
                        </a>
                      )}
                      {c.adminFacebookPageId && (
                        <a
                          href={`https://m.me/${c.adminFacebookPageId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                        >
                          Messenger
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-4 text-right">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {c.status}
                    </span>
                    {c.baseRate && (
                      <span className="text-xs text-gray-500">${(c.baseRate / 100).toLocaleString()} base rate</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
