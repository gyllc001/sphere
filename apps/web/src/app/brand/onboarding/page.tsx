'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { brandAuth, campaigns, getToken, clearToken, type Brand } from '@/lib/api';

const STEPS = ['Choose Plan', 'Company Profile', 'Launch Your First Campaign', 'You\'re All Set'];

const INDUSTRY_OPTIONS = [
  'SaaS / Software', 'Consumer Goods', 'Health & Wellness', 'Fashion & Apparel',
  'Food & Beverage', 'Finance / Fintech', 'Gaming', 'Travel', 'Education', 'Other',
];

const NICHE_OPTIONS = [
  'Tech', 'Gaming', 'Fashion', 'Mom', 'Finance', 'Health', 'Food', 'Travel', 'Other',
];

const BUDGET_OPTIONS = [
  { label: 'Under $1,000', value: 100000 },
  { label: '$1,000 – $5,000', value: 500000 },
  { label: '$5,000 – $25,000', value: 2500000 },
  { label: '$25,000+', value: 2500001 },
];

const PLANS = [
  {
    tier: 'starter',
    name: 'Starter',
    price: '$250/mo',
    limit: 'Up to 10 community partnerships',
    features: ['AI-powered community matching', 'Campaign management', 'In-platform messaging', 'Deal tracking'],
    highlight: false,
  },
  {
    tier: 'growth',
    name: 'Growth',
    price: '$450/mo',
    limit: 'Up to 20 community partnerships',
    features: ['Everything in Starter', 'Priority matching', 'Advanced analytics', 'Campaign reports'],
    highlight: true,
  },
  {
    tier: 'scale',
    name: 'Scale',
    price: '$1,000/mo',
    limit: 'Up to 50 partnerships (+$75/extra)',
    features: ['Everything in Growth', 'Dedicated support', 'Custom integrations', 'Bulk outreach'],
    highlight: false,
  },
] as const;

type PlanTier = 'starter' | 'growth' | 'scale';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function BrandOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState<PlanTier>('starter');

  const [profile, setProfile] = useState({
    website: '',
    industry: '',
    targetAudience: '',
  });

  const [campaignForm, setCampaignForm] = useState({
    title: '',
    brief: '',
    niche: '',
    budgetCents: 0,
    objectives: '',
    skipCampaign: false,
  });

  useEffect(() => {
    const token = getToken('brand');
    if (!token) {
      router.replace('/brand/login');
      return;
    }
    brandAuth.me(token).then(setBrand).catch(() => {
      clearToken('brand');
      router.replace('/brand/login');
    });
  }, [router]);

  function updateProfile(field: string, value: string) {
    setProfile((p) => ({ ...p, [field]: value }));
  }

  function updateCampaign(field: string, value: string | number | boolean) {
    setCampaignForm((c) => ({ ...c, [field]: value }));
  }

  async function handlePlanNext(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const token = getToken('brand');
    if (!token) return;
    try {
      // Create a Stripe Checkout session for the selected plan
      const res = await fetch(`${API_URL}/api/billing/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tier: selectedPlan }),
      });
      if (res.ok) {
        const { url } = await res.json();
        // Redirect to Stripe Checkout. On success, Stripe redirects back to /brand/dashboard.
        window.location.href = url;
        return;
      }
      // If Stripe is not configured, proceed to next step without payment
      setStep(1);
    } catch {
      // Fallback: allow progression if billing isn't set up yet
      setStep(1);
    } finally {
      setLoading(false);
    }
  }

  async function handleProfileNext(e: React.FormEvent) {
    e.preventDefault();
    setStep(2);
  }

  async function handleCampaignNext(e: React.FormEvent) {
    e.preventDefault();
    if (campaignForm.skipCampaign) {
      setStep(3);
      return;
    }
    setError('');
    setLoading(true);
    const token = getToken('brand');
    if (!token) return;
    try {
      await campaigns.create(token, {
        title: campaignForm.title,
        brief: campaignForm.brief,
        niche: campaignForm.niche || undefined,
        budgetCents: campaignForm.budgetCents || undefined,
        objectives: campaignForm.objectives || undefined,
        targetAudience: profile.targetAudience || undefined,
      });
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  }

  if (!brand) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-gray-900">Sphere</Link>
        <button
          onClick={() => { clearToken('brand'); router.push('/brand/login'); }}
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          Sign out
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < step ? 'bg-blue-600 text-white' :
                  i === step ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-12 sm:w-24 mx-1 ${i < step ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            {STEPS.map((s, i) => (
              <span key={i} className={i === step ? 'text-blue-600 font-medium' : ''}>{s}</span>
            ))}
          </div>
        </div>

        {/* Step 0: Choose Plan */}
        {step === 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <h1 className="text-xl font-bold mb-1">Choose your plan</h1>
            <p className="text-sm text-gray-500 mb-6">Select a subscription tier. You can upgrade or downgrade anytime from your dashboard.</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>
            )}

            <form onSubmit={handlePlanNext}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {PLANS.map((plan) => (
                  <button
                    key={plan.tier}
                    type="button"
                    onClick={() => setSelectedPlan(plan.tier)}
                    className={`text-left p-5 rounded-xl border-2 transition-all ${
                      selectedPlan === plan.tier
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${plan.highlight ? 'relative' : ''}`}
                  >
                    {plan.highlight && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-0.5 rounded-full">
                        Most Popular
                      </span>
                    )}
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-900">{plan.name}</span>
                      {selectedPlan === plan.tier && (
                        <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-semibold text-blue-600 mb-1">{plan.price}</p>
                    <p className="text-xs text-gray-500 mb-3">{plan.limit}</p>
                    <ul className="space-y-1">
                      {plan.features.map((f) => (
                        <li key={f} className="text-xs text-gray-600 flex items-start gap-1">
                          <svg className="w-3 h-3 text-green-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>

              <p className="text-xs text-gray-400 mb-4 text-center">
                Creator processing fee: 10–15% on payouts · Wallet dispensement fee: 2.5%
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Redirecting to checkout...' : `Continue with ${PLANS.find((p) => p.tier === selectedPlan)?.name} →`}
              </button>
            </form>
          </div>
        )}

        {/* Step 1: Company Profile */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm border p-8 max-w-xl mx-auto">
            <h1 className="text-xl font-bold mb-1">Welcome to Sphere, {brand.name}!</h1>
            <p className="text-sm text-gray-500 mb-6">Let's set up your brand profile to get the best community matches.</p>

            <form onSubmit={handleProfileNext} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  value={profile.website}
                  onChange={(e) => updateProfile('website', e.target.value)}
                  placeholder="https://yourbrand.com"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <select
                  value={profile.industry}
                  onChange={(e) => updateProfile('industry', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select an industry</option>
                  {INDUSTRY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                <textarea
                  value={profile.targetAudience}
                  onChange={(e) => updateProfile('targetAudience', e.target.value)}
                  rows={2}
                  placeholder="e.g. indie developers, millennial parents, fitness enthusiasts..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Platform-only communication notice */}
              <div className="bg-blue-50 border border-blue-100 rounded-md p-3 text-xs text-blue-700">
                <strong>Platform-only communication policy:</strong> All communication with community owners happens exclusively on Sphere. Sharing contact info (email, phone, social handles) in messages is not allowed and may result in account suspension.
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Continue →
              </button>
            </form>
          </div>
        )}

        {/* Step 2: First Campaign */}
        {step === 2 && (
          <div className="bg-white rounded-xl shadow-sm border p-8 max-w-xl mx-auto">
            <h1 className="text-xl font-bold mb-1">Launch your first campaign</h1>
            <p className="text-sm text-gray-500 mb-6">Tell us what you're looking for and we'll start matching you with communities within 24 hours.</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>
            )}

            <form onSubmit={handleCampaignNext} className="space-y-4">
              {!campaignForm.skipCampaign && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name *</label>
                    <input
                      type="text"
                      value={campaignForm.title}
                      onChange={(e) => updateCampaign('title', e.target.value)}
                      required={!campaignForm.skipCampaign}
                      placeholder="e.g. Q3 Product Launch"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Brief *</label>
                    <textarea
                      value={campaignForm.brief}
                      onChange={(e) => updateCampaign('brief', e.target.value)}
                      required={!campaignForm.skipCampaign}
                      rows={3}
                      placeholder="Describe your product and what you want community owners to do..."
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Community Type</label>
                      <select
                        value={campaignForm.niche}
                        onChange={(e) => updateCampaign('niche', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Any niche</option>
                        {NICHE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Budget Range</label>
                      <select
                        value={campaignForm.budgetCents}
                        onChange={(e) => updateCampaign('budgetCents', Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={0}>Not sure yet</option>
                        {BUDGET_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Goals (optional)</label>
                    <input
                      type="text"
                      value={campaignForm.objectives}
                      onChange={(e) => updateCampaign('objectives', e.target.value)}
                      placeholder="e.g. brand awareness, signups, direct revenue"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : (campaignForm.skipCampaign ? 'Go to dashboard →' : 'Create campaign & continue →')}
                </button>
              </div>
              <button
                type="button"
                onClick={() => updateCampaign('skipCampaign', !campaignForm.skipCampaign)}
                className="w-full text-sm text-gray-400 hover:text-gray-600 py-1"
              >
                {campaignForm.skipCampaign ? '+ Create a campaign instead' : 'Skip for now'}
              </button>
            </form>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center max-w-xl mx-auto">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold mb-2">You're all set, {brand.name}!</h1>
            {!campaignForm.skipCampaign && (
              <p className="text-sm text-gray-500 mb-1">
                Your campaign has been created. Our AI is matching you with the best communities now.
              </p>
            )}
            <p className="text-sm text-gray-500 mb-6">
              Expect your first match within <strong>24 hours</strong>. We'll notify you when there's a match.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 text-left text-sm text-gray-600 mb-6 space-y-2">
              <p className="font-medium text-gray-800">What happens next:</p>
              <p>1. Our AI engine scores communities against your campaign brief</p>
              <p>2. Top-matched community owners receive your campaign proposal</p>
              <p>3. Owners accept, decline, or counter — you see everything on your dashboard</p>
              <p>4. Once accepted, all communication happens in-platform</p>
            </div>

            <Link
              href="/brand/dashboard"
              className="inline-block bg-blue-600 text-white py-2 px-6 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Go to Dashboard →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
