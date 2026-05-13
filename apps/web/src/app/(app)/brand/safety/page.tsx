'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { brandSafety, getToken, clearToken, type BrandSafetySettings } from '@/lib/api';

const CATEGORY_LABELS: Record<string, string> = {
  alcohol: 'Alcohol',
  tobacco: 'Tobacco',
  gambling: 'Gambling',
  nsfw: 'NSFW / Adult',
  politics: 'Politics',
  religion: 'Religion',
  violence: 'Violence',
  competitor_brands: 'Competitor Brands',
  cannabis: 'Cannabis',
  firearms: 'Firearms',
};

export default function BrandSafetyPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<BrandSafetySettings | null>(null);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [keywords, setKeywords] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken('brand');
    if (!token) { router.replace('/brand/login'); return; }

    brandSafety.get(token)
      .then((s) => {
        setSettings(s);
        setExcluded(new Set(s.excludedCategories));
        setKeywords(s.excludedKeywords.join(', '));
      })
      .catch((err) => {
        if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
          clearToken('brand');
          router.replace('/brand/login');
        } else {
          setError(err.message);
        }
      });
  }, [router]);

  function toggleCategory(cat: string) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
    setSaved(false);
  }

  async function handleSave() {
    const token = getToken('brand');
    if (!token) return;

    const keywordList = keywords
      .split(/[,\n]+/)
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    setSaving(true);
    setError('');
    try {
      const updated = await brandSafety.update(token, {
        excludedCategories: [...excluded],
        excludedKeywords: keywordList,
      });
      setSettings(updated);
      setKeywords(updated.excludedKeywords.join(', '));
      setSaved(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading safety settings…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/brand/dashboard" className="text-indigo-600 hover:underline text-sm">
            ← Dashboard
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Brand Safety Settings</h1>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
        )}

        {/* Category exclusions */}
        <section className="bg-white rounded-xl border p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Excluded Topic Categories</h2>
            <p className="text-sm text-gray-500 mt-1">
              Community owners whose self-declared topics match any checked category will be filtered out of your match results.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(settings.availableCategories as string[]).map((cat) => (
              <label
                key={cat}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  excluded.has(cat)
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={excluded.has(cat)}
                  onChange={() => toggleCategory(cat)}
                  className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  {CATEGORY_LABELS[cat] ?? cat}
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* Keyword exclusions */}
        <section className="bg-white rounded-xl border p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Excluded Keywords</h2>
            <p className="text-sm text-gray-500 mt-1">
              Comma-separated keywords (e.g. competitor names). Communities whose niche or description
              contains these words will be filtered out.
            </p>
          </div>

          <textarea
            value={keywords}
            onChange={(e) => { setKeywords(e.target.value); setSaved(false); }}
            rows={4}
            placeholder="e.g. budweiser, draftkings, fentanyl"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-400">
            {keywords.split(/[,\n]+/).filter((k) => k.trim()).length} keyword(s)
          </p>
        </section>

        {/* Save */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
          {saved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-indigo-700">
          <strong>How it works:</strong> When you run AI matching for a campaign, community owners whose
          content topics or descriptions match your exclusions are automatically removed from the results.
          Your settings apply to all future matching runs.
        </div>
      </main>
    </div>
  );
}
