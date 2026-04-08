'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { communityPortal, getToken, clearToken, type CampaignApplication } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-600',
};

export default function MyApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<CampaignApplication[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken('community');
    if (!token) {
      router.replace('/community/login');
      return;
    }
    communityPortal
      .myApplications(token)
      .then(setApplications)
      .catch((err: any) => {
        if (err.message?.includes('Unauthorized') || err.message?.includes('401')) {
          clearToken('community');
          router.replace('/community/login');
        } else {
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold text-gray-900">Sphere</Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/community/communities" className="text-gray-600 hover:text-gray-900">My Communities</Link>
            <Link href="/community/campaigns" className="text-gray-600 hover:text-gray-900">Browse Campaigns</Link>
            <Link href="/community/opportunities" className="text-gray-600 hover:text-gray-900">Inbound Offers</Link>
            <Link href="/community/my-applications" className="font-medium text-green-600">My Applications</Link>
          </nav>
        </div>
        <button
          onClick={() => { clearToken('community'); router.push('/community/login'); }}
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          Sign out
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">My Applications</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>
        )}

        {loading ? (
          <div className="text-center text-gray-400 py-16 text-sm">Loading…</div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-lg border p-12 text-center text-gray-400 text-sm">
            No applications yet.{' '}
            <Link href="/community/campaigns" className="text-green-600 hover:underline">Browse open campaigns</Link> to apply.
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((a) => (
              <div key={a.applicationId} className="bg-white rounded-lg border p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">{a.campaignTitle}</p>
                    <p className="text-sm text-gray-500">
                      by <strong>{a.brandName}</strong> · submitted with <strong>{a.communityName}</strong>
                    </p>
                    {a.campaignNiche && <p className="text-xs text-gray-400 mt-0.5">Niche: {a.campaignNiche}</p>}
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ml-4 flex-shrink-0 ${STATUS_COLORS[a.status] || 'bg-gray-100 text-gray-600'}`}>
                    {a.status}
                  </span>
                </div>

                <div className="text-sm text-gray-600 bg-gray-50 rounded p-3 mb-3 italic">
                  "{a.pitch}"
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                  {a.proposedRateCents != null && (
                    <span>Your rate: <strong className="text-gray-600">${(a.proposedRateCents / 100).toLocaleString()}</strong></span>
                  )}
                  {a.campaignBudgetCents != null && (
                    <span>Campaign budget: <strong className="text-gray-600">${(a.campaignBudgetCents / 100).toLocaleString()}</strong></span>
                  )}
                  <span>Applied: {new Date(a.createdAt).toLocaleDateString()}</span>
                </div>

                {a.brandNote && (
                  <div className="mt-3 text-sm text-gray-600 border-t pt-3">
                    <span className="text-xs font-medium text-gray-400 uppercase">Brand note: </span>
                    {a.brandNote}
                  </div>
                )}

                {a.status === 'accepted' && a.dealId && (
                  <div className="mt-3 pt-3 border-t">
                    <Link href={`/deals/${a.dealId}`} className="text-sm text-green-600 hover:underline font-medium">
                      View deal →
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
