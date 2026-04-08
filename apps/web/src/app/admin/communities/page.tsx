'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  adminApi,
  type ScrapedCommunity,
  type ScraperStats,
  type ScrapedCommunitiesFilters,
} from '@/lib/api';

const PAGE_SIZE = 50;

const PLATFORMS = ['discord', 'slack', 'telegram', 'whatsapp', 'facebook', 'reddit', 'youtube', 'twitter', 'other'];
const VERIFICATION_STATUSES = ['unverified', 'pending', 'verified'];

function formatNumber(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    verified: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    unverified: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

function downloadCsv(communities: ScrapedCommunity[]) {
  const headers = ['name', 'platform', 'handle', 'memberCount', 'nicheTags', 'adminContactEmail', 'adminContactName', 'verificationStatus', 'url', 'scrapedAt'];
  const rows = communities.map(c => [
    c.name,
    c.platform,
    c.handle ?? '',
    c.memberCount ?? '',
    (c.nicheTags ?? []).join(';'),
    c.adminContactEmail ?? '',
    c.adminContactName ?? '',
    c.verificationStatus,
    c.url ?? '',
    c.scrapedAt,
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sphere-communities-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminCommunitiesPage() {
  const [adminKey, setAdminKey] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [authed, setAuthed] = useState(false);

  const [stats, setStats] = useState<ScraperStats | null>(null);
  const [communities, setCommunities] = useState<ScrapedCommunity[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);

  const [filters, setFilters] = useState<ScrapedCommunitiesFilters>({});
  const [pendingFilters, setPendingFilters] = useState<ScrapedCommunitiesFilters>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scraperMsg, setScraperMsg] = useState('');
  const [scraperLoading, setScraperLoading] = useState(false);

  const [sortBy, setSortBy] = useState<'memberCount' | 'scrapedAt'>('memberCount');

  useEffect(() => {
    const stored = sessionStorage.getItem('sphere_admin_key');
    if (stored) { setAdminKey(stored); setAuthed(true); }
  }, []);

  const load = useCallback(async (key: string, f: ScrapedCommunitiesFilters, p: number) => {
    setLoading(true);
    setError('');
    try {
      const [data, statsData] = await Promise.all([
        adminApi.getScrapedCommunities(key, { ...f, limit: PAGE_SIZE, offset: p * PAGE_SIZE }),
        adminApi.getScraperStats(key),
      ]);
      setCommunities(data.communities);
      setTotal(data.total);
      setStats(statsData);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load';
      if (msg.includes('401') || msg.includes('Unauthorized')) {
        setError('Invalid admin key. Check ADMIN_API_KEY env var.');
        setAuthed(false);
        sessionStorage.removeItem('sphere_admin_key');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed && adminKey) load(adminKey, filters, page);
  }, [authed, adminKey, filters, page, load]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    sessionStorage.setItem('sphere_admin_key', keyInput);
    setAdminKey(keyInput);
    setAuthed(true);
  }

  function applyFilters() {
    setFilters(pendingFilters);
    setPage(0);
  }

  function clearFilters() {
    setPendingFilters({});
    setFilters({});
    setPage(0);
  }

  async function runScraper() {
    setScraperLoading(true);
    setScraperMsg('');
    try {
      const result = await adminApi.runScraper(adminKey);
      setScraperMsg(result.message);
      await load(adminKey, filters, page);
    } catch (e: unknown) {
      setScraperMsg(e instanceof Error ? e.message : 'Scraper error');
    } finally {
      setScraperLoading(false);
    }
  }

  const sorted = [...communities].sort((a, b) => {
    if (sortBy === 'memberCount') return (b.memberCount ?? 0) - (a.memberCount ?? 0);
    return new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime();
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 p-8 w-full max-w-sm shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Admin Access</h1>
          <p className="text-sm text-gray-500 mb-6">Enter your admin API key to continue.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              placeholder="Admin API key"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Sign in
            </button>
          </form>
          {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-2xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Community Database</h1>
            <p className="text-sm text-gray-500 mt-0.5">Scraped community records — admin view</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => downloadCsv(communities)}
              className="text-sm bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Export CSV
            </button>
            <button
              onClick={runScraper}
              disabled={scraperLoading}
              className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {scraperLoading ? 'Running…' : 'Run Scraper'}
            </button>
            <button
              onClick={() => { setAuthed(false); sessionStorage.removeItem('sphere_admin_key'); }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>

        {scraperMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
            {scraperMsg}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total.toLocaleString()}</p>
            </div>
            {Object.entries(stats.byPlatform).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([platform, count]) => (
              <div key={platform} className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">{platform}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{count.toLocaleString()}</p>
              </div>
            ))}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Verified</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{(stats.byStatus['verified'] ?? 0).toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <input
              type="text"
              placeholder="Search name…"
              value={pendingFilters.q ?? ''}
              onChange={e => setPendingFilters(f => ({ ...f, q: e.target.value || undefined }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <select
              value={pendingFilters.platform ?? ''}
              onChange={e => setPendingFilters(f => ({ ...f, platform: e.target.value || undefined }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All platforms</option>
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select
              value={pendingFilters.verificationStatus ?? ''}
              onChange={e => setPendingFilters(f => ({ ...f, verificationStatus: e.target.value || undefined }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All statuses</option>
              {VERIFICATION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input
              type="text"
              placeholder="Niche tag…"
              value={pendingFilters.niche ?? ''}
              onChange={e => setPendingFilters(f => ({ ...f, niche: e.target.value || undefined }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <input
              type="number"
              placeholder="Min members"
              value={pendingFilters.minMembers ?? ''}
              onChange={e => setPendingFilters(f => ({ ...f, minMembers: e.target.value ? Number(e.target.value) : undefined }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <input
              type="number"
              placeholder="Max members"
              value={pendingFilters.maxMembers ?? ''}
              onChange={e => setPendingFilters(f => ({ ...f, maxMembers: e.target.value ? Number(e.target.value) : undefined }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={applyFilters}
              className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Apply
            </button>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5"
            >
              Clear
            </button>
            <span className="ml-auto text-xs text-gray-500">
              Sort by:{' '}
              <button
                onClick={() => setSortBy('memberCount')}
                className={`font-medium ${sortBy === 'memberCount' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Members
              </button>
              {' · '}
              <button
                onClick={() => setSortBy('scrapedAt')}
                className={`font-medium ${sortBy === 'scrapedAt' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Date scraped
              </button>
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {loading ? 'Loading…' : `${total.toLocaleString()} communities`}
              {total > PAGE_SIZE && ` — page ${page + 1} of ${totalPages}`}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Platform</th>
                  <th className="px-4 py-3 text-left font-medium">Handle</th>
                  <th className="px-4 py-3 text-right font-medium cursor-pointer" onClick={() => setSortBy('memberCount')}>
                    Members {sortBy === 'memberCount' ? '↓' : ''}
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Niches</th>
                  <th className="px-4 py-3 text-left font-medium">Contact</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium cursor-pointer" onClick={() => setSortBy('scrapedAt')}>
                    Scraped {sortBy === 'scrapedAt' ? '↓' : ''}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">
                      {c.url ? (
                        <a href={c.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-indigo-700">
                          {c.name}
                        </a>
                      ) : c.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{c.platform}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{c.handle ?? '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">{formatNumber(c.memberCount)}</td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {(c.nicheTags ?? []).slice(0, 3).map(tag => (
                          <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs">
                            {tag}
                          </span>
                        ))}
                        {(c.nicheTags ?? []).length > 3 && (
                          <span className="text-xs text-gray-400">+{c.nicheTags.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs truncate max-w-xs">
                      {c.adminContactEmail ?? (c.adminContactName ? c.adminContactName : '—')}
                    </td>
                    <td className="px-4 py-3">{statusBadge(c.verificationStatus)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(c.scrapedAt)}</td>
                  </tr>
                ))}
                {!loading && sorted.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                      No communities found. Try adjusting filters or run the scraper.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <span className="text-xs text-gray-500">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
