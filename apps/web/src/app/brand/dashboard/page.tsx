'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { campaigns, getToken, clearToken, type Campaign } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  active: 'bg-green-100 text-green-700',
  matching: 'bg-blue-100 text-blue-700',
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
  const [data, setData] = useState<{ total: number; byStatus: Record<string, number>; campaigns: Campaign[] } | null>(null);
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
          <Link href="/" className="text-lg font-bold text-gray-900">Sphere</Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/brand/dashboard" className="font-medium text-blue-600">Dashboard</Link>
            <Link href="/brand/campaigns/new" className="text-gray-600 hover:text-gray-900">New Campaign</Link>
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
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700"
          >
            + New Campaign
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
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
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-3xl font-bold mt-1 text-purple-600">{data.byStatus.completed || 0}</p>
          </div>
        </div>

        {/* Campaign list */}
        {data.campaigns.length === 0 ? (
          <div className="bg-white rounded-lg border p-12 text-center">
            <p className="text-gray-400 mb-4">No campaigns yet</p>
            <Link href="/brand/campaigns/new" className="text-blue-600 text-sm hover:underline">
              Create your first campaign →
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
                  <div>
                    <h2 className="font-semibold text-gray-900">{c.title}</h2>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{c.brief}</p>
                    <div className="flex gap-3 mt-2 text-xs text-gray-400">
                      {c.niche && <span>Niche: {c.niche}</span>}
                      <span>Budget: {formatBudget(c.budgetCents)}</span>
                      <span>Created: {new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ml-4 ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-600'}`}>
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
