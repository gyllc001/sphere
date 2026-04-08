'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SphereWordmark } from '@/components/SphereLogo';
import { campaigns, getToken } from '@/lib/api';

export default function NewCampaign() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    brief: '',
    objectives: '',
    targetAudience: '',
    niche: '',
    minCommunitySize: '',
    budgetCents: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken('brand');
    if (!token) {
      router.replace('/brand/login');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        brief: form.brief,
      };
      if (form.objectives) payload.objectives = form.objectives;
      if (form.targetAudience) payload.targetAudience = form.targetAudience;
      if (form.niche) payload.niche = form.niche;
      if (form.minCommunitySize) payload.minCommunitySize = parseInt(form.minCommunitySize, 10);
      if (form.budgetCents) payload.budgetCents = Math.round(parseFloat(form.budgetCents) * 100);

      const campaign = await campaigns.create(token, payload as any);
      router.push(`/brand/campaigns/${campaign.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link href="/brand/dashboard" className="text-sm text-gray-500 hover:text-gray-800">← Dashboard</Link>
        <h1 className="text-lg font-semibold">New Campaign Brief</h1>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg border p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                required
                placeholder="e.g. Q3 Product Launch — Community Spotlight"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Brief *</label>
              <textarea
                value={form.brief}
                onChange={(e) => update('brief', e.target.value)}
                required
                rows={5}
                placeholder="Describe your campaign in detail — what you want communities to do, what you're promoting, etc."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Objectives</label>
              <textarea
                value={form.objectives}
                onChange={(e) => update('objectives', e.target.value)}
                rows={2}
                placeholder="Key goals: awareness, signups, conversions..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
              <input
                type="text"
                value={form.targetAudience}
                onChange={(e) => update('targetAudience', e.target.value)}
                placeholder="e.g. Developers, indie hackers, startup founders"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Niche</label>
                <input
                  type="text"
                  value={form.niche}
                  onChange={(e) => update('niche', e.target.value)}
                  placeholder="e.g. tech, fitness, finance"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Community Size</label>
                <input
                  type="number"
                  value={form.minCommunitySize}
                  onChange={(e) => update('minCommunitySize', e.target.value)}
                  min={0}
                  placeholder="e.g. 1000"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget (USD)</label>
              <input
                type="number"
                value={form.budgetCents}
                onChange={(e) => update('budgetCents', e.target.value)}
                min={0}
                step="0.01"
                placeholder="e.g. 5000"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white py-2 px-6 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Campaign'}
              </button>
              <Link
                href="/brand/dashboard"
                className="py-2 px-4 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
