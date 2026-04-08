'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { campaigns, getToken, clearToken, type Campaign } from '@/lib/api';
import { SphereWordmark } from '@/components/SphereLogo';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  active: 'bg-green-100 text-green-700',
  matching: 'bg-indigo-50 text-indigo-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-600',
};

function formatBudget(cents?: number) {
  if (!cents) return '—';
  return `$${(cents / 100).toLocaleString()}`;
}

export default function BrandDashboard() {
  const router = useRouter();
  const [data, setData] = useState<{ total: number; byStatus: Record<string, number>; totalNotified: number; totalInterested: number; campaigns: Campaign[] } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken('brand');
    if (!token) {
      router.replace('/brand/login');
      return;
    }
    campaigns.dashboard(token)
      .then(setData)
      .catch((err) => {
        if (err.message?.includes('Unauthorized') || err.message?.includes('401')) {
          clearToken('brand');
          router.replace('/brand/login');
        } else {
          setError(err.message);
        }
      });
  }, [router]);

  function handleLogout() {
    clearToken('brand');
    router.push('/brand/login');
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        {error || 'Loading...'}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/"><SphereWordmark size={26} /></Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/brand/dashboard" className="font-medium text-indigo-600">Dashboard</Link>
            <Link href="/brand/campaigns/new" className="text-gray-600 hover:text-gray-900">New Campaign</Link>
            <Link href="/brand/safety" className="text-gray-600 hover:text-gray-900">Brand Safety</Link>
            <Link href="/messages" className="text-gray-600 hover:text-gray-900">Messages</Link>
          </nav>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-800">
          Sign out
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Campaign Dashboard</h1>
          <Link
            href="/brand/campaigns/new"
            className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            + New Campaign
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-500">Total Campaigns</p>
            <p className="text-3xl font-bold mt-1">{data.total}</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-3xl font-bold mt-1 text-green-600">
              {(data.byStatus.active || 0) + (data.byStatus.matching || 0) + (data.byStatus.in_progress || 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-500">Notified</p>
            <p className="text-3xl font-bold mt-1 text-indigo-600">{data.totalNotified ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">community owners</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-500">Interested</p>
            <p className="text-3xl font-bold mt-1 text-emerald-600">{data.totalInterested ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">confirmed interest</p>
          </div>
        </div>

        {/* Campaign list */}
        {data.campaigns.length === 0 ? (
          <div className="bg-white rounded-lg border p-12 text-center">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-800 mb-1">Launch your first campaign</h3>
            <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">Create a brief and let Sphere match you with the best communities in 24 hours.</p>
            <Link
              href="/brand/campaigns/new"
              className="inline-block bg-blue-600 text-white text-sm px-5 py-2 rounded-md hover:bg-blue-700 font-medium"
            >
              Create Campaign
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {data.campaigns.map((c) => (
              <Link
                key={c.id}
                href={`/brand/campaigns/${c.id}`}
                className="block bg-white rounded-lg border p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-gray-900">{c.title}</h2>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{c.brief}</p>
                    <div className="flex gap-3 mt-2 text-xs text-gray-400">
                      {c.niche && <span>Niche: {c.niche}</span>}
                      <span>Budget: {formatBudget(c.budgetCents)}</span>
                      <span>Created: {new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    {(c.notifiedCount ?? 0) > 0 && (
                      <div className="flex gap-3 mt-2 text-xs">
                        <span className="text-indigo-600 font-medium">{c.notifiedCount} Notified</span>
                        {(c.interestedCount ?? 0) > 0 && (
                          <span className="text-emerald-600 font-medium">{c.interestedCount} Interested</span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ml-4 flex-shrink-0 ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-600'}`}>
                    {c.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
