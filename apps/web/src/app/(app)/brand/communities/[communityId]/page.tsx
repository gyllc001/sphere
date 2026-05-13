'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { communityProfileApi, getToken, type CommunityProfile } from '@/lib/api';
import { track } from '@/lib/analytics';

const PLATFORM_LABELS: Record<string, string> = {
  discord: 'Discord',
  slack: 'Slack',
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  facebook_group: 'Facebook Group',
  reddit: 'Reddit',
  circle: 'Circle',
  mighty_networks: 'Mighty Networks',
  other: 'Other',
};

const VERIFICATION_BADGE: Record<string, { label: string; className: string }> = {
  unverified: { label: 'Unverified', className: 'bg-gray-100 text-gray-600' },
  pending: { label: 'Verification Pending', className: 'bg-yellow-100 text-yellow-700' },
  verified: { label: 'Verified', className: 'bg-green-100 text-green-700' },
};

export default function CommunityProfilePage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params.communityId as string;

  const [community, setCommunity] = useState<CommunityProfile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken('brand');
    if (!token) { router.replace('/brand/login'); return; }
    communityProfileApi.get(token, communityId)
      .then((c) => { setCommunity(c); track('first_match_viewed', { user_type: 'brand', community_id: communityId, platform: c.platform }); })
      .catch((err) => setError(err.message));
  }, [communityId]);

  if (!community) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        {error || 'Loading community profile...'}
      </div>
    );
  }

  const badge = VERIFICATION_BADGE[community.verificationStatus] ?? VERIFICATION_BADGE.unverified;

  let contentTypes: string[] = [];
  let topicsExcluded: string[] = [];
  try { contentTypes = community.contentTypesAccepted ? JSON.parse(community.contentTypesAccepted) : []; } catch {}
  try { topicsExcluded = community.topicsExcluded ? JSON.parse(community.topicsExcluded) : []; } catch {}

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link href="/brand/dashboard" className="text-sm text-gray-500 hover:text-gray-800">← Dashboard</Link>
        <h1 className="text-lg font-semibold">Community Profile</h1>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Header card */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{community.name}</h2>
              <p className="text-sm text-gray-500 mt-0.5">Managed by {community.ownerName}</p>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.className}`}>
              {badge.label}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase font-medium">Platform</p>
              <p className="font-medium mt-0.5">{PLATFORM_LABELS[community.platform] ?? community.platform}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-medium">Members</p>
              <p className="font-medium mt-0.5">{community.memberCount.toLocaleString()}</p>
            </div>
            {community.engagementRate && (
              <div>
                <p className="text-xs text-gray-400 uppercase font-medium">Engagement</p>
                <p className="font-medium mt-0.5">{community.engagementRate}</p>
              </div>
            )}
            {community.vertical && (
              <div>
                <p className="text-xs text-gray-400 uppercase font-medium">Vertical</p>
                <p className="font-medium mt-0.5">{community.vertical}</p>
              </div>
            )}
            {community.niche && (
              <div>
                <p className="text-xs text-gray-400 uppercase font-medium">Niche</p>
                <p className="font-medium mt-0.5">{community.niche}</p>
              </div>
            )}
            {community.baseRate && (
              <div>
                <p className="text-xs text-gray-400 uppercase font-medium">Base Rate</p>
                <p className="font-medium mt-0.5">${(community.baseRate / 100).toLocaleString()}</p>
              </div>
            )}
          </div>

          {community.description && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-400 uppercase font-medium mb-1">About</p>
              <p className="text-sm text-gray-700">{community.description}</p>
            </div>
          )}
        </div>

        {/* Collab preferences */}
        {(contentTypes.length > 0 || topicsExcluded.length > 0) && (
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h3 className="font-semibold text-gray-800">Collab Preferences</h3>

            {contentTypes.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase font-medium mb-2">Content types accepted</p>
                <div className="flex flex-wrap gap-2">
                  {contentTypes.map((type) => (
                    <span key={type} className="px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-200">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {topicsExcluded.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase font-medium mb-2">Topics they won't promote</p>
                <div className="flex flex-wrap gap-2">
                  {topicsExcluded.map((topic) => (
                    <span key={topic} className="px-2.5 py-1 bg-red-50 text-red-600 text-xs rounded-full border border-red-200">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 flex items-center justify-between">
          <div>
            <p className="font-medium text-blue-900">Interested in partnering?</p>
            <p className="text-sm text-blue-700 mt-0.5">Create a campaign and our AI will match and propose a partnership with this community.</p>
          </div>
          <Link
            href="/brand/campaigns/new"
            className="ml-4 bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 whitespace-nowrap"
          >
            Create Campaign
          </Link>
        </div>
      </main>
    </div>
  );
}
