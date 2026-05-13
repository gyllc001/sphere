'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { communityAuth, communityPortal, getToken, clearToken, type CommunityOwner } from '@/lib/api';

const STEPS = ['Welcome', 'List Your Community', 'Collab Preferences', 'Payout Setup', 'You\'re All Set'];

const PLATFORM_OPTIONS = [
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

const VERTICAL_OPTIONS = [
  'Tech', 'Gaming', 'Fashion', 'Mom', 'Finance', 'Health', 'Food', 'Travel', 'Other',
];

const MEMBER_COUNT_RANGES = [
  { label: 'Under 500', value: 250 },
  { label: '500 – 2,000', value: 1000 },
  { label: '2,000 – 10,000', value: 5000 },
  { label: '10,000 – 50,000', value: 25000 },
  { label: '50,000+', value: 50000 },
];

const CONTENT_TYPES = [
  'Sponsored posts',
  'Product reviews',
  'Newsletter mentions',
  'Discord announcements',
  'Giveaways',
  'AMA / Q&A',
  'Video content',
  'Podcast mentions',
  'Community challenges',
  'Affiliate links',
];

export default function CommunityOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [owner, setOwner] = useState<CommunityOwner | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdCommunityId, setCreatedCommunityId] = useState<string | null>(null);

  const [communityForm, setCommunityForm] = useState({
    name: '',
    platform: '',
    platformUrl: '',
    description: '',
    niche: '',
    vertical: '',
    memberCount: 0,
    baseRate: '',
    skipListing: false,
  });

  const [collabForm, setCollabForm] = useState({
    contentTypesAccepted: [] as string[],
    topicsExcluded: '',
    customTopicExcluded: '',
  });

  useEffect(() => {
    const token = getToken('community');
    if (!token) {
      router.replace('/community/login');
      return;
    }
    communityAuth.me(token).then(setOwner).catch(() => {
      clearToken('community');
      router.replace('/community/login');
    });
  }, [router]);

  function updateCommunity(field: string, value: string | number | boolean) {
    setCommunityForm((c) => ({ ...c, [field]: value }));
  }

  function toggleContentType(type: string) {
    setCollabForm((f) => ({
      ...f,
      contentTypesAccepted: f.contentTypesAccepted.includes(type)
        ? f.contentTypesAccepted.filter(t => t !== type)
        : [...f.contentTypesAccepted, type],
    }));
  }

  async function handleListingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (communityForm.skipListing) {
      setStep(2);
      return;
    }
    if (!communityForm.platform) {
      setError('Please select your community platform');
      return;
    }
    setError('');
    setLoading(true);
    const token = getToken('community');
    if (!token) return;
    try {
      const community = await communityPortal.createCommunity(token, {
        name: communityForm.name,
        platform: communityForm.platform as any,
        platformUrl: communityForm.platformUrl || undefined,
        description: communityForm.description || undefined,
        niche: communityForm.niche || undefined,
        vertical: (communityForm.vertical || undefined) as any,
        memberCount: communityForm.memberCount || undefined,
        baseRate: communityForm.baseRate ? Math.round(parseFloat(communityForm.baseRate) * 100) : undefined,
      });
      setCreatedCommunityId((community as any).id ?? null);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to create community listing');
    } finally {
      setLoading(false);
    }
  }

  async function handleCollabPrefsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!createdCommunityId) { setStep(3); return; }
    setLoading(true);
    setError('');
    const token = getToken('community');
    if (!token) return;

    const topicsExcluded = collabForm.topicsExcluded
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
    if (collabForm.customTopicExcluded.trim()) topicsExcluded.push(collabForm.customTopicExcluded.trim());

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await communityPortal.updateCommunity(token, createdCommunityId, {
        contentTypesAccepted: collabForm.contentTypesAccepted.length ? collabForm.contentTypesAccepted : undefined,
        topicsExcluded: topicsExcluded.length ? topicsExcluded : undefined,
      } as any);
    } catch {
      // Non-fatal — prefs are optional
    } finally {
      setLoading(false);
    }
    setStep(3);
  }

  if (!owner) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-gray-900">Sphere</Link>
        <button
          onClick={() => { clearToken('community'); router.push('/community/login'); }}
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          Sign out
        </button>
      </header>

      <main className="max-w-xl mx-auto px-6 py-10">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < step ? 'bg-green-600 text-white' :
                  i === step ? 'bg-green-600 text-white ring-4 ring-green-100' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-8 sm:w-16 mx-1 ${i < step ? 'bg-green-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            {STEPS.map((s, i) => (
              <span key={i} className={`text-center ${i === step ? 'text-green-600 font-medium' : ''}`}>{s}</span>
            ))}
          </div>
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <h1 className="text-xl font-bold mb-1">Welcome to Sphere, {owner.name}!</h1>
            <p className="text-sm text-gray-500 mb-6">You're joining a platform where brands find and partner with engaged communities. Let's get your listing set up.</p>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <span className="text-green-600 text-lg mt-0.5">$</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">Earn from your community</p>
                  <p className="text-xs text-gray-500">Brands pay you directly for sponsored content and promotions.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <span className="text-green-600 text-lg mt-0.5">🤖</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">AI-matched opportunities</p>
                  <p className="text-xs text-gray-500">Our matching engine surfaces brands that align with your community's interests.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <span className="text-amber-600 text-lg mt-0.5">⚠</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">Platform-only communication</p>
                  <p className="text-xs text-gray-500">All communication with brands happens exclusively on Sphere. Sharing contact info off-platform is not permitted.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(1)}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-green-700"
            >
              List my community →
            </button>
          </div>
        )}

        {/* Step 1: Community listing */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <h1 className="text-xl font-bold mb-1">List your community</h1>
            <p className="text-sm text-gray-500 mb-6">This is how brands will find and evaluate you. The more detail you add, the better your match quality.</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>
            )}

            <form onSubmit={handleListingSubmit} className="space-y-4">
              {!communityForm.skipListing && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Community Name *</label>
                    <input
                      type="text"
                      value={communityForm.name}
                      onChange={(e) => updateCommunity('name', e.target.value)}
                      required={!communityForm.skipListing}
                      placeholder="e.g. Indie Hackers Discord"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Platform *</label>
                      <select
                        value={communityForm.platform}
                        onChange={(e) => updateCommunity('platform', e.target.value)}
                        required={!communityForm.skipListing}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Select platform</option>
                        {PLATFORM_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vertical</label>
                      <select
                        value={communityForm.vertical}
                        onChange={(e) => updateCommunity('vertical', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Select vertical</option>
                        {VERTICAL_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Community URL (optional)</label>
                    <input
                      type="url"
                      value={communityForm.platformUrl}
                      onChange={(e) => updateCommunity('platformUrl', e.target.value)}
                      placeholder="https://discord.gg/your-invite"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={communityForm.description}
                      onChange={(e) => updateCommunity('description', e.target.value)}
                      rows={2}
                      placeholder="What is your community about? Who are the members?"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Member Count</label>
                      <select
                        value={communityForm.memberCount}
                        onChange={(e) => updateCommunity('memberCount', Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value={0}>Not sure</option>
                        {MEMBER_COUNT_RANGES.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Base Rate (USD)</label>
                      <input
                        type="number"
                        value={communityForm.baseRate}
                        onChange={(e) => updateCommunity('baseRate', e.target.value)}
                        min={0}
                        step="1"
                        placeholder="e.g. 500"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : (communityForm.skipListing ? 'Continue →' : 'List my community →')}
                </button>
              </div>
              <button
                type="button"
                onClick={() => updateCommunity('skipListing', !communityForm.skipListing)}
                className="w-full text-sm text-gray-400 hover:text-gray-600 py-1"
              >
                {communityForm.skipListing ? '+ List a community instead' : 'Skip for now'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Collab preferences */}
        {step === 2 && (
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <h1 className="text-xl font-bold mb-1">Collab preferences</h1>
            <p className="text-sm text-gray-500 mb-6">Tell brands what types of content you're open to and what topics you won't promote. This helps us match you with relevant opportunities.</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>
            )}

            <form onSubmit={handleCollabPrefsSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content types I accept</label>
                <div className="flex flex-wrap gap-2">
                  {CONTENT_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleContentType(type)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        collabForm.contentTypesAccepted.includes(type)
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                {collabForm.contentTypesAccepted.length === 0 && (
                  <p className="text-xs text-gray-400 mt-2">Select at least one to help brands understand your preferences (optional)</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topics I won't promote</label>
                <input
                  type="text"
                  value={collabForm.topicsExcluded}
                  onChange={(e) => setCollabForm(f => ({ ...f, topicsExcluded: e.target.value }))}
                  placeholder="e.g. gambling, adult content, political content"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-400 mt-1">Comma-separated list</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Continue →'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-md"
                >
                  Skip
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Payout setup */}
        {step === 3 && (
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <h1 className="text-xl font-bold mb-1">Payout setup</h1>
            <p className="text-sm text-gray-500 mb-6">Set up how you'll receive payments for completed deals.</p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-amber-800 mb-1">Beta — manual payouts</p>
              <p className="text-sm text-amber-700">During beta, all payouts are processed manually by the Sphere team within 3 business days of deal confirmation. Full Stripe Connect and PayPal integration is coming soon.</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="border rounded-lg p-4 opacity-50 cursor-not-allowed">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">S</div>
                  <div>
                    <p className="text-sm font-medium">Stripe Connect</p>
                    <p className="text-xs text-gray-500">Instant bank transfers — coming soon</p>
                  </div>
                  <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Soon</span>
                </div>
              </div>
              <div className="border rounded-lg p-4 opacity-50 cursor-not-allowed">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm">P</div>
                  <div>
                    <p className="text-sm font-medium">PayPal</p>
                    <p className="text-xs text-gray-500">PayPal transfers — coming soon</p>
                  </div>
                  <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Soon</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400 mb-6">For beta payouts, our team will contact you via email to arrange bank transfer or wire. Make sure your profile email is up to date.</p>

            <button
              onClick={() => setStep(4)}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-green-700"
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold mb-2">You're live on Sphere!</h1>
            {!communityForm.skipListing && (
              <p className="text-sm text-gray-500 mb-1">
                Your community listing is pending verification and will be visible to brands shortly.
              </p>
            )}
            <p className="text-sm text-gray-500 mb-6">
              We'll notify you when a brand matches with your community. In the meantime, browse inbound opportunities.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 text-left text-sm text-gray-600 mb-6 space-y-2">
              <p className="font-medium text-gray-800">What happens next:</p>
              <p>1. Your listing is reviewed and approved by our team</p>
              <p>2. Our AI matches you with brands looking for your community type</p>
              <p>3. You receive inbound proposals — accept, decline, or counter</p>
              <p>4. Deals close in-platform with transparent terms</p>
            </div>

            <Link
              href="/community/communities"
              className="inline-block bg-green-600 text-white py-2 px-6 rounded-md text-sm font-medium hover:bg-green-700"
            >
              View My Communities →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
