'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { communityTopics, getToken, clearToken, type CommunityTopics } from '@/lib/api';

const TOPIC_LABELS: Record<string, string> = {
  alcohol: 'Alcohol',
  tobacco: 'Tobacco',
  gambling: 'Gambling',
  nsfw: 'NSFW / Adult',
  politics: 'Politics',
  religion: 'Religion',
  violence: 'Violence',
  cannabis: 'Cannabis',
  firearms: 'Firearms',
  fitness: 'Fitness & Health',
  finance: 'Finance',
  technology: 'Technology',
  gaming: 'Gaming',
  travel: 'Travel',
  food: 'Food & Drink',
  fashion: 'Fashion & Beauty',
  parenting: 'Parenting',
  education: 'Education',
  entertainment: 'Entertainment',
};

export default function CommunityTopicsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const communityId = params.id;

  const [data, setData] = useState<CommunityTopics | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken('community');
    if (!token) { router.replace('/community/login'); return; }

    communityTopics.get(token, communityId)
      .then((d) => {
        setData(d);
        setSelected(new Set(d.topics));
      })
      .catch((err) => {
        if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
          clearToken('community');
          router.replace('/community/login');
        } else {
          setError(err.message);
        }
      });
  }, [router, communityId]);

  function toggleTopic(topic: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) next.delete(topic);
      else next.add(topic);
      return next;
    });
    setSaved(false);
  }

  async function handleSave() {
    const token = getToken('community');
    if (!token) return;

    setSaving(true);
    setError('');
    try {
      const updated = await communityTopics.update(token, communityId, [...selected]);
      setData(updated);
      setSaved(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  const sensitiveTopics = (data.availableTopics as string[]).filter((t) =>
    ['alcohol', 'tobacco', 'gambling', 'nsfw', 'politics', 'religion', 'violence', 'cannabis', 'firearms'].includes(t)
  );
  const generalTopics = (data.availableTopics as string[]).filter((t) => !sensitiveTopics.includes(t));

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link href="/community/communities" className="text-indigo-600 hover:underline text-sm">
          ← Communities
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">Content Topics</h1>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-indigo-700">
          <strong>Why this matters:</strong> Brands can configure safety filters that exclude communities
          covering certain topics. Accurately tagging your community's content ensures you only receive
          partnership requests from brands that are a good fit.
        </div>

        {/* Sensitive topics */}
        <section className="bg-white rounded-xl border p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Sensitive Topics</h2>
            <p className="text-sm text-gray-500 mt-1">
              Check any that apply to your community's content. Some brands exclude these.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {sensitiveTopics.map((topic) => (
              <label
                key={topic}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selected.has(topic) ? 'border-orange-300 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(topic)}
                  onChange={() => toggleTopic(topic)}
                  className="w-4 h-4 text-orange-500 rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">{TOPIC_LABELS[topic] ?? topic}</span>
              </label>
            ))}
          </div>
        </section>

        {/* General topics */}
        <section className="bg-white rounded-xl border p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Content Categories</h2>
            <p className="text-sm text-gray-500 mt-1">Select the main topics your community covers.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {generalTopics.map((topic) => (
              <label
                key={topic}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selected.has(topic) ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(topic)}
                  onChange={() => toggleTopic(topic)}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">{TOPIC_LABELS[topic] ?? topic}</span>
              </label>
            ))}
          </div>
        </section>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Topics'}
          </button>
          {saved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
        </div>
      </main>
    </div>
  );
}
