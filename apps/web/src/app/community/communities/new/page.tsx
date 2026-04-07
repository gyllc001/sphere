'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { communityPortal, getToken } from '@/lib/api';

const PLATFORMS = [
  { value: 'discord', label: 'Discord' },
  { value: 'slack', label: 'Slack' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'facebook_group', label: 'Facebook Group' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'circle', label: 'Circle' },
  { value: 'mighty_networks', label: 'Mighty Networks' },
  { value: 'other', label: 'Other' },
];

export default function NewCommunity() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    platform: 'discord',
    platformUrl: '',
    niche: '',
    description: '',
    memberCount: '',
    engagementRate: '',
    audienceDemographics: '',
    baseRate: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken('community');
    if (!token) {
      router.replace('/community/login');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        platform: form.platform,
      };
      if (form.platformUrl) payload.platformUrl = form.platformUrl;
      if (form.niche) payload.niche = form.niche;
      if (form.description) payload.description = form.description;
      if (form.memberCount) payload.memberCount = parseInt(form.memberCount, 10);
      if (form.engagementRate) payload.engagementRate = form.engagementRate;
      if (form.audienceDemographics) payload.audienceDemographics = form.audienceDemographics;
      if (form.baseRate) payload.baseRate = Math.round(parseFloat(form.baseRate) * 100);

      await communityPortal.createCommunity(token, payload as any);
      router.push('/community/communities');
    } catch (err: any) {
      setError(err.message || 'Failed to create community');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link href="/community/communities" className="text-sm text-gray-500 hover:text-gray-800">← My Communities</Link>
        <h1 className="text-lg font-semibold">List a New Community</h1>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg border p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Community Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                required
                placeholder="e.g. The Indie Hackers Network"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform *</label>
                <select
                  value={form.platform}
                  onChange={(e) => update('platform', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform URL</label>
                <input
                  type="url"
                  value={form.platformUrl}
                  onChange={(e) => update('platformUrl', e.target.value)}
                  placeholder="https://"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Niche</label>
              <input
                type="text"
                value={form.niche}
                onChange={(e) => update('niche', e.target.value)}
                placeholder="e.g. tech, startup, fitness, finance"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                rows={3}
                placeholder="What's your community about? Who are the members?"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member Count</label>
                <input
                  type="number"
                  value={form.memberCount}
                  onChange={(e) => update('memberCount', e.target.value)}
                  min={0}
                  placeholder="e.g. 5000"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Engagement Rate</label>
                <input
                  type="text"
                  value={form.engagementRate}
                  onChange={(e) => update('engagementRate', e.target.value)}
                  placeholder="e.g. 12%"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Audience Demographics</label>
              <input
                type="text"
                value={form.audienceDemographics}
                onChange={(e) => update('audienceDemographics', e.target.value)}
                placeholder="e.g. 70% engineers, 25-40yo, US/EU"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Rate (USD per sponsorship)</label>
              <input
                type="number"
                value={form.baseRate}
                onChange={(e) => update('baseRate', e.target.value)}
                min={0}
                step="0.01"
                placeholder="e.g. 500"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white py-2 px-6 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Listing...' : 'List Community'}
              </button>
              <Link href="/community/communities" className="py-2 px-4 text-sm text-gray-600 hover:text-gray-900">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
