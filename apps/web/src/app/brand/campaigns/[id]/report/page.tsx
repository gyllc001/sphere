'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { campaigns, getToken, type CampaignReport } from '@/lib/api';

function formatMoney(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const STATUS_BADGE: Record<string, string> = {
  negotiating: 'bg-yellow-100 text-yellow-700',
  agreed: 'bg-blue-100 text-blue-700',
  contract_sent: 'bg-indigo-100 text-indigo-700',
  signed: 'bg-purple-100 text-purple-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-600',
  released: 'bg-emerald-100 text-emerald-700',
  escrowed: 'bg-indigo-100 text-indigo-700',
  pending: 'bg-gray-100 text-gray-500',
};

export default function CampaignReportPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const campaignId = params.id;
  const [report, setReport] = useState<CampaignReport | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken('brand');
    if (!token) { router.replace('/brand/login'); return; }
    campaigns.report(token, campaignId)
      .then(setReport)
      .catch((err) => setError(err.message));
  }, [campaignId, router]);

  function handlePrint() {
    window.print();
  }

  function handleCsvDownload() {
    const token = getToken('brand');
    if (!token) return;
    const url = `/api/campaigns/${campaignId}/report?format=csv`;
    const a = document.createElement('a');
    a.href = url;
    // Pass auth via fetch + blob download since query params can't carry Bearer token
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        a.href = blobUrl;
        a.download = `sphere-campaign-report.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      });
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">Loading report...</div>
    );
  }

  const { campaign, summary, deals } = report;

  return (
    <div className="min-h-screen bg-white">
      {/* Screen-only toolbar */}
      <div className="print:hidden bg-gray-50 border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/brand/campaigns/${campaignId}`} className="text-sm text-gray-500 hover:text-gray-800">
            ← Back to Campaign
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-sm font-medium text-gray-700">Campaign Report</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCsvDownload}
            className="text-sm px-4 py-2 border rounded-md hover:bg-gray-100 text-gray-700"
          >
            Download CSV
          </button>
          <button
            onClick={handlePrint}
            className="text-sm px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Download PDF (Print)
          </button>
        </div>
      </div>

      {/* Report body */}
      <div className="max-w-4xl mx-auto px-8 py-10 print:px-0 print:py-4">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 print:mb-6">
          <div>
            <div className="text-2xl font-bold text-indigo-600 mb-1">Sphere</div>
            <h1 className="text-xl font-semibold text-gray-900">Campaign Performance Report</h1>
            <p className="text-sm text-gray-500 mt-1">Generated {formatDate(report.generatedAt)}</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p className="font-medium text-gray-800">{campaign.title}</p>
            {campaign.startDate && <p>{formatDate(campaign.startDate)} – {formatDate(campaign.endDate)}</p>}
            <p className="mt-1 capitalize text-xs font-medium px-2 py-0.5 rounded-full inline-block bg-gray-100 text-gray-600">
              {campaign.status}
            </p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mb-8 print:mb-6">
          <div className="border rounded-lg p-4 print:border-gray-300">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Deals</p>
            <p className="text-3xl font-bold mt-1">{summary.totalDeals}</p>
            <p className="text-xs text-gray-400 mt-1">{summary.activeDeals} active · {summary.completedDeals} completed</p>
          </div>
          <div className="border rounded-lg p-4 print:border-gray-300">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Spend</p>
            <p className="text-3xl font-bold mt-1 text-indigo-600">{formatMoney(summary.totalSpentCents)}</p>
            <p className="text-xs text-gray-400 mt-1">{formatMoney(summary.totalContractedCents)} contracted</p>
          </div>
          <div className="border rounded-lg p-4 print:border-gray-300">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Est. Reach</p>
            <p className="text-3xl font-bold mt-1 text-emerald-600">
              {summary.estimatedTotalReach.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">combined community members</p>
          </div>
        </div>

        {/* Campaign brief */}
        <div className="mb-8 print:mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Campaign Brief</h2>
          <div className="border rounded-lg p-4 print:border-gray-300 text-sm text-gray-700 space-y-1">
            <p>{campaign.brief}</p>
            {campaign.niche && <p className="text-gray-400 text-xs mt-2">Niche: {campaign.niche}</p>}
            {campaign.budgetCents && (
              <p className="text-gray-400 text-xs">Budget: {formatMoney(campaign.budgetCents)}</p>
            )}
          </div>
        </div>

        {/* Per-deal breakdown */}
        <div className="mb-8 print:mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Community Partner Breakdown
          </h2>
          {deals.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No deals yet for this campaign.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-500 uppercase tracking-wide">
                    <th className="pb-2 pr-4 font-medium">Community</th>
                    <th className="pb-2 pr-4 font-medium">Platform</th>
                    <th className="pb-2 pr-4 font-medium text-right">Members</th>
                    <th className="pb-2 pr-4 font-medium text-right">Rate</th>
                    <th className="pb-2 pr-4 font-medium">Deal Status</th>
                    <th className="pb-2 pr-4 font-medium">Payment</th>
                    <th className="pb-2 font-medium">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.map((d) => (
                    <tr key={d.dealId} className="border-b last:border-b-0">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-gray-900">{d.communityName}</p>
                        <p className="text-xs text-gray-400">{d.ownerName}</p>
                        {d.niche && <p className="text-xs text-gray-400">{d.niche}</p>}
                      </td>
                      <td className="py-3 pr-4 capitalize text-gray-600">{d.platform}</td>
                      <td className="py-3 pr-4 text-right text-gray-600">
                        {d.memberCount ? d.memberCount.toLocaleString() : '—'}
                      </td>
                      <td className="py-3 pr-4 text-right font-medium">{formatMoney(d.agreedRateCents)}</td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[d.dealStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                          {d.dealStatus}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[d.paymentStatus ?? 'pending'] ?? 'bg-gray-100 text-gray-600'}`}>
                          {d.paymentStatus ?? 'pending'}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500 text-xs">{formatDate(d.completedAt)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-semibold">
                    <td colSpan={3} className="pt-3 pr-4 text-right text-gray-500 text-xs">Total contracted:</td>
                    <td className="pt-3 pr-4 text-right">{formatMoney(summary.totalContractedCents)}</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t pt-4 text-xs text-gray-400 flex justify-between print:pt-2">
          <span>Sphere — sphereapp.co</span>
          <span>Report generated {new Date(report.generatedAt).toLocaleString()}</span>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
