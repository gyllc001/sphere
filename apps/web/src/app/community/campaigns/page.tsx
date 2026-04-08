'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SphereWordmark } from '@/components/SphereLogo';
import {
  communityPortal,
  getToken,
  clearToken,
  type BrowseCampaign,
  type Community,
} from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-600',
};

export default function BrowseCampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<BrowseCampaign[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Filters
  const [nicheFilter, setNicheFilter] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');

  // Apply modal
  const [applyModal, setApplyModal] = useState<BrowseCampaign | null>(null);
  const [selectedCommunityId, setSelectedCommunityId] = useState('');
  const [pitch, setPitch] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [applyError, setApplyError] = useState('');

  function getToken_() {
    const token = getToken('community');
    if (!token) {
      router.replace('/community/login');
      return null;
    }
    return token;
  }

  async function loadData(filters?: { niche?: string; minBudget?: number; maxBudget?: number }) {
    const token = getToken_();
    if (!token) return;
    setLoading(true);
    try {
      const [camps, comms] = await Promise.all([
        communityPortal.browseCampaigns(token, filters),
        communityPortal.listCommunities(token),
      ]);
      setCampaigns(camps);
      setCommunities(comms);
    } catch (err: any) {
      if (err.message?.includes('Unauthorized') || err.message?.includes('401')) {
        clearToken('community');
        router.replace('/community/login');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  function applyFilters() {
    loadData({
      niche: nicheFilter || undefined,
      minBudget: minBudget ? parseInt(minBudget) : undefined,
      maxBudget: maxBudget ? parseInt(maxBudget) : undefined,
    });
  }

  function openApplyModal(campaign: BrowseCampaign) {
    setApplyModal(campaign);
    setSelectedCommunityId(communities[0]?.id ?? '');
    setPitch('');
    setProposedRate('');
    setApplyError('');
  }

  async function submitApplication() {
    if (!applyModal) return;
    const token = getToken_();
    if (!token) return;
    if (!selectedCommunityId) { setApplyError('Please select a community'); return; }
    if (!pitch.trim()) { setApplyError('Pitch is required'); return; }

    setSubmitting(true);
    setApplyError('');
    try {
      await communityPortal.apply(token, applyModal.id, {
        communityId: selectedCommunityId,
        pitch: pitch.trim(),
        proposedRateCents: proposedRate ? Math.round(parseFloat(proposedRate) * 100) : undefined,
      });
      setApplyModal(null);
      loadData({
        niche: nicheFilter || undefined,
        minBudget: minBudget ? parseInt(minBudget) : undefined,
        maxBudget: maxBudget ? parseInt(maxBudget) : undefined,
      });
    } catch (err: any) {
      setApplyError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedCommunity = communities.find((c) => c.id === selectedCommunityId);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" ><SphereWordmark size={26} /></Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/community/communities" className="text-gray-600 hover:text-gray-900">My Communities</Link>
            <Link href="/community/campaigns" className="font-medium text-green-600">Browse Campaigns</Link>
            <Link href="/community/opportunities" className="text-gray-600 hover:text-gray-900">Inbound Offers</Link>
            <Link href="/community/my-applications" className="text-gray-600 hover:text-gray-900">My Applications</Link>
          </nav>
        </div>
        <button
          onClick={() => { clearToken('community'); router.push('/community/login'); }}
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          Sign out
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-2">Browse Brand Campaigns</h1>
        <p className="text-sm text-gray-500 mb-6">Find campaigns that fit your community and apply with a pitch.</p>

        {/* Filters */}
        <div className="bg-white rounded-lg border p-4 mb-6 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Niche / category</label>
            <input
              type="text"
              value={nicheFilter}
              onChange={(e) => setNicheFilter(e.target.value)}
              placeholder="e.g. Tech, Gaming, Mom"
              className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Min budget ($)</label>
            <input
              type="number"
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value)}
              min={0}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Max budget ($)</label>
            <input
              type="number"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              min={0}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            onClick={applyFilters}
            className="bg-green-600 text-white text-sm px-4 py-1.5 rounded hover:bg-green-700"
          >
            Filter
          </button>
          <button
            onClick={() => { setNicheFilter(''); setMinBudget(''); setMaxBudget(''); loadData(); }}
            className="border border-gray-300 text-gray-600 text-sm px-4 py-1.5 rounded hover:bg-gray-50"
          >
            Clear
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>
        )}

        {loading ? (
          <div className="text-center text-gray-400 py-16 text-sm">Loading campaigns…</div>
        ) : campaigns.length === 0 ? (
          <div className="bg-white rounded-lg border p-12 text-center text-gray-400 text-sm">
            No open campaigns found. Try adjusting your filters.
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((c) => (
              <div key={c.id} className="bg-white rounded-lg border p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">{c.title}</p>
                    <p className="text-sm text-gray-500">
                      by <strong>{c.brandName}</strong>
                      {c.niche && <> · <span className="text-gray-400">niche: {c.niche}</span></>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    {c.myApplication && (
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[c.myApplication.status] || 'bg-gray-100 text-gray-600'}`}>
                        Applied · {c.myApplication.status}
                      </span>
                    )}
                    {!c.myApplication && (
                      <button
                        onClick={() => openApplyModal(c)}
                        disabled={communities.length === 0}
                        className="bg-green-600 text-white text-sm px-4 py-1.5 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={communities.length === 0 ? 'Add a community first' : undefined}
                      >
                        Apply
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-600 line-clamp-3 mb-3">{c.brief}</p>

                <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                  {c.budgetCents != null && (
                    <span>Budget: <strong className="text-gray-600">${(c.budgetCents / 100).toLocaleString()}</strong></span>
                  )}
                  {c.minCommunitySize != null && (
                    <span>Min community size: <strong className="text-gray-600">{c.minCommunitySize.toLocaleString()}</strong></span>
                  )}
                  {c.targetAudience && <span>Audience: {c.targetAudience}</span>}
                  {c.endDate && <span>Deadline: {new Date(c.endDate).toLocaleDateString()}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Apply modal */}
      {applyModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <h2 className="font-semibold text-lg mb-1">Apply to: {applyModal.title}</h2>
            <p className="text-sm text-gray-500 mb-4">by {applyModal.brandName}</p>

            {applyError && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{applyError}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Which community? *</label>
                <select
                  value={selectedCommunityId}
                  onChange={(e) => setSelectedCommunityId(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {communities.map((com) => (
                    <option key={com.id} value={com.id}>
                      {com.name} ({com.platform} · {com.memberCount.toLocaleString()} members)
                    </option>
                  ))}
                </select>
                {selectedCommunity && (
                  <div className="mt-1 text-xs text-gray-400 flex gap-3">
                    {selectedCommunity.niche && <span>Niche: {selectedCommunity.niche}</span>}
                    {selectedCommunity.engagementRate && <span>Engagement: {selectedCommunity.engagementRate}</span>}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your pitch *</label>
                <textarea
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  rows={4}
                  placeholder="Why is your community a great fit for this campaign? Include any relevant stats, engagement data, or past collaboration results."
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-400 mt-0.5">{pitch.length}/2000</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proposed rate (USD, optional)</label>
                <input
                  type="number"
                  value={proposedRate}
                  onChange={(e) => setProposedRate(e.target.value)}
                  min={0}
                  step="0.01"
                  placeholder="Leave blank to negotiate later"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={submitApplication}
                disabled={submitting || !pitch.trim() || !selectedCommunityId}
                className="bg-green-600 text-white text-sm px-5 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Submit Application'}
              </button>
              <button
                onClick={() => setApplyModal(null)}
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
