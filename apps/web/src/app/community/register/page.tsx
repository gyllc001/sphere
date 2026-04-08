'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { communityAuth, setToken } from '@/lib/api';
import { track, identifyUser } from '@/lib/analytics';

const TOS_VERSION = '2026-04-08';

const TOS_SUMMARY = [
  'Creator payout processing fee: 10–15% deducted from payouts before disbursement',
  'Wallet dispensement fee: 2.5% on all wallet transactions',
  'Off-platform contact policy: 12-month circumvention prohibition — all communication must happen on Sphere',
  'Violation may result in suspension and liquidated damages of 20% of deal value (min $500)',
];

export default function CommunityRegister() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', bio: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [tosExpanded, setTosExpanded] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    track('signup_started', { user_type: 'community' });
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        ...(form.bio && { bio: form.bio }),
        tosAccepted: true,
      };
      const { token, owner } = await communityAuth.register(payload);
      setToken('community', token);
      identifyUser(owner.id, { email: owner.email, name: owner.name, user_type: 'community' });
      track('signup_completed', { user_type: 'community' });
      router.push('/community/onboarding');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-2">Create Community Owner Account</h1>
        <p className="text-gray-500 mb-6 text-sm">List your community and find brand partnerships</p>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              required
              minLength={8}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => update('bio', e.target.value)}
              rows={3}
              placeholder="Tell brands about yourself..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          {/* ToS display */}
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => setTosExpanded((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 text-sm text-gray-700 hover:bg-gray-100"
            >
              <span className="font-medium">Sphere Terms of Service (v{TOS_VERSION})</span>
              <span className="text-gray-400">{tosExpanded ? '▲ Hide' : '▼ View'}</span>
            </button>
            {tosExpanded && (
              <div className="px-3 py-3 text-xs text-gray-600 space-y-1.5 max-h-40 overflow-y-auto border-t border-gray-200">
                <p className="font-medium text-gray-700">Key terms for community owners:</p>
                {TOS_SUMMARY.map((item, i) => (
                  <p key={i}>• {item}</p>
                ))}
                <p className="text-gray-400 mt-2">By checking below you agree to the full Sphere Terms of Service including brand subscription tiers, payout fees, wallet fees, and off-platform contact policy.</p>
              </div>
            )}
          </div>
          <div className="flex items-start gap-2">
            <input
              id="terms"
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              required
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <label htmlFor="terms" className="text-sm text-gray-600">
              I have read and accept the Sphere Terms of Service (v{TOS_VERSION}), including the payout processing fee (10–15%), wallet fees (2.5%), and off-platform contact policy.
            </label>
          </div>
          <button
            type="submit"
            disabled={loading || !agreedToTerms}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-500 text-center">
          Already have an account?{' '}
          <Link href="/community/login" className="text-green-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
