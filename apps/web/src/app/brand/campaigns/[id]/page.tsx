'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { campaigns, getToken, type Campaign, type Partnership } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
  agreed: 'bg-blue-100 text-blue-700',
  contract_sent: 'bg-purple-100 text-purple-700',
  signed: 'bg-green-200 text-green-800',
  completed: 'bg-gray-200 text-gray-700',
  cancelled: 'bg-red-100 text-red-600',
};

function formatRate(cents?: number | null) {
  if (!cents) return '—';
  return `$${(cents / 100).toLocaleString()}`;
}

export default function CampaignDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken('brand');
    if (!token) {
      router.replace('/brand/login');
      return;
    }

    Promise.all([campaigns.get(token, id), campaigns.partnerships(token, id)])
      .then(([camp, parts]) => {
        setCampaign(camp);
        setPartnerships(parts);
      })
      .catch((err) => setError(err.message));
  }, [id, router]);

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        {error || 'Loading...'}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link href="/brand/dashboard" className="text-sm text-gray-500 hover:text-gray-800">← Dashboard</Link>
        <h1 className="text-lg font-semibold truncate">{campaign.title}</h1>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ml-auto ${STATUS_COLORS[campaign.status] || 'bg-gray-100 text-gray-600'}`}>
          {campaign.status}
        </span>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Campaign details */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="font-semibold mb-3">Campaign Brief</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{campaign.brief}</p>
          {campaign.objectives && (
            <div className="mt-4">
              <span className="text-xs font-medium text-gray-500 uppercase">Objectives</span>
              <p className="text-sm text-gray-700 mt-1">{campaign.objectives}</p>
            </div>
          )}
          <div className="flex gap-6 mt-4 text-sm text-gray-500">
            {campaign.niche && <span>Niche: <strong>{campaign.niche}</strong></span>}
            {campaign.budgetCents && <span>Budget: <strong>${(campaign.budgetCents / 100).toLocaleString()}</strong></span>}
            {campaign.targetAudience && <span>Audience: <strong>{campaign.targetAudience}</strong></span>}
          </div>
        </div>

        {/* Matched communities / partnerships */}
        <div>
          <h2 className="font-semibold mb-3">Matched Communities & Deals</h2>
          {partnerships.length === 0 ? (
            <div className="bg-white rounded-lg border p-8 text-center text-gray-400 text-sm">
              No matches yet. The AI matching engine will surface relevant communities once the campaign is active.
            </div>
          ) : (
            <div className="space-y-3">
              {partnerships.map((p) => (
                <div key={p.requestId} className="bg-white rounded-lg border p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{p.communityName}</p>
                      <p className="text-sm text-gray-500">
                        {p.communityPlatform} · {p.communityMemberCount?.toLocaleString()} members · Owner: {p.ownerName}
                      </p>
                      {p.matchRationale && (
                        <p className="text-sm text-gray-500 mt-1 italic">"{p.matchRationale}"</p>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-gray-400">
                        {p.matchScore != null && <span>Match score: {p.matchScore}</span>}
                        <span>Proposed rate: {formatRate(p.proposedRateCents)}</span>
                      </div>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {p.communityAdminDiscordUserId && (
                          <a
                            href={`https://discord.com/users/${p.communityAdminDiscordUserId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100"
                          >
                            Message on Discord
                          </a>
                        )}
                        {p.communityAdminPhone && (
                          <a
                            href={`https://wa.me/${p.communityAdminPhone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100"
                          >
                            WhatsApp
                          </a>
                        )}
                        {p.communityAdminFacebookPageId && (
                          <a
                            href={`https://m.me/${p.communityAdminFacebookPageId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                          >
                            Facebook Messenger
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-600'}`}>
                        {p.status}
                      </span>
                      {p.deal && (
                        <Link
                          href={`/deals/${p.deal.id}`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View deal →
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Deal status row */}
                  {p.deal && (
                    <div className="mt-3 pt-3 border-t flex gap-4 text-xs text-gray-500">
                      <span>Deal: <span className={`font-medium ${STATUS_COLORS[p.deal.status] ? '' : ''}`}>{p.deal.status}</span></span>
                      <span>Agreed rate: {formatRate(p.deal.agreedRateCents)}</span>
                      {p.deal.signedAt && <span>Signed: {new Date(p.deal.signedAt).toLocaleDateString()}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
