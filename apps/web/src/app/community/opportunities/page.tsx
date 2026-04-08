'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { communityPortal, getToken, clearToken, type Opportunity } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
};

export default function OpportunitiesPage() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [error, setError] = useState('');
  const [responding, setResponding] = useState<string | null>(null);
  const [counterModal, setCounterModal] = useState<{ requestId: string } | null>(null);
  const [counterRate, setCounterRate] = useState('');
  const [counterMessage, setCounterMessage] = useState('');

  function loadOpportunities() {
    const token = getToken('community');
    if (!token) {
      router.replace('/community/login');
      return;
    }
    communityPortal.listOpportunities(token)
      .then(setOpportunities)
      .catch((err) => {
        if (err.message?.includes('Unauthorized') || err.message?.includes('401')) {
          clearToken('community');
          router.replace('/community/login');
        } else {
          setError(err.message);
        }
      });
  }

  useEffect(() => { loadOpportunities(); }, []);

  async function respond(requestId: string, action: 'accept' | 'decline') {
    const token = getToken('community');
    if (!token) return;
    setResponding(requestId);
    try {
      await communityPortal.respond(token, requestId, action);
      loadOpportunities();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResponding(null);
    }
  }

  async function submitCounter() {
    if (!counterModal) return;
    const token = getToken('community');
    if (!token) return;
    setResponding(counterModal.requestId);
    try {
      await communityPortal.respond(token, counterModal.requestId, 'counter', {
        counterRateCents: Math.round(parseFloat(counterRate) * 100),
        message: counterMessage || undefined,
      });
      setCounterModal(null);
      setCounterRate('');
      setCounterMessage('');
      loadOpportunities();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResponding(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold text-gray-900">Sphere</Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/community/communities" className="text-gray-600 hover:text-gray-900">My Communities</Link>
            <Link href="/community/opportunities" className="font-medium text-green-600">Opportunities</Link>
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
        <h1 className="text-2xl font-bold mb-6">Inbound Opportunities</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>
        )}

        {opportunities.length === 0 ? (
          <div className="bg-white rounded-lg border p-12 text-center">
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-800 mb-1">No inbound opportunities yet</h3>
            <p className="text-sm text-gray-500 mb-2 max-w-sm mx-auto">
              Brands are matched with your community automatically. Matches typically arrive within 24–48 hours of your listing going live.
            </p>
            <p className="text-xs text-gray-400">Make sure your communities are listed and approved.</p>
            <div className="mt-5">
              <Link href="/community/communities" className="text-green-600 text-sm hover:underline font-medium">
                View my communities →
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {opportunities.map((o) => (
              <div key={o.requestId} className="bg-white rounded-lg border p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold">{o.campaignTitle}</p>
                    <p className="text-sm text-gray-500">
                      by <strong>{o.brandName}</strong> · for your community: <strong>{o.communityName}</strong>
                    </p>
                    {o.campaignNiche && (
                      <p className="text-xs text-gray-400 mt-0.5">Niche: {o.campaignNiche}</p>
                    )}
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ml-4 ${STATUS_COLORS[o.requestStatus] || 'bg-gray-100 text-gray-600'}`}>
                    {o.requestStatus}
                  </span>
                </div>

                <p className="text-sm text-gray-600 line-clamp-3 mb-3">{o.campaignBrief}</p>

                <div className="flex gap-4 text-xs text-gray-400 mb-4">
                  {o.matchScore != null && <span>Match score: {o.matchScore}</span>}
                  {o.proposedRateCents && (
                    <span>Proposed rate: <strong>${(o.proposedRateCents / 100).toLocaleString()}</strong></span>
                  )}
                  {o.initiatedByAi && <span className="text-blue-400">AI-matched</span>}
                  <span>Received: {new Date(o.createdAt).toLocaleDateString()}</span>
                </div>

                {o.requestStatus === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => respond(o.requestId, 'accept')}
                      disabled={responding === o.requestId}
                      className="bg-green-600 text-white text-sm px-4 py-1.5 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => setCounterModal({ requestId: o.requestId })}
                      disabled={responding === o.requestId}
                      className="border border-blue-500 text-blue-600 text-sm px-4 py-1.5 rounded hover:bg-blue-50 disabled:opacity-50"
                    >
                      Counter
                    </button>
                    <button
                      onClick={() => respond(o.requestId, 'decline')}
                      disabled={responding === o.requestId}
                      className="border border-gray-300 text-gray-600 text-sm px-4 py-1.5 rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Counter modal */}
      {counterModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="font-semibold mb-4">Counter Offer</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Rate (USD) *</label>
                <input
                  type="number"
                  value={counterRate}
                  onChange={(e) => setCounterRate(e.target.value)}
                  min={0}
                  step="0.01"
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
                <textarea
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={submitCounter}
                disabled={!counterRate || responding === counterModal.requestId}
                className="bg-green-600 text-white text-sm px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                Submit Counter
              </button>
              <button
                onClick={() => setCounterModal(null)}
                className="border border-gray-300 text-gray-600 text-sm px-4 py-2 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
