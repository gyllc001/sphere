'use client';

import { useEffect, useState } from 'react';
import posthog from 'posthog-js';
import { getToken, brandAuth, communityAuth } from '@/lib/api';

// Internal/test account patterns — these users are excluded from the NPS survey
const TEST_EMAIL_PATTERNS = [
  '@sphere.app',
  '@paperclip.ing',
  '@example.com',
  '+test',
  'test@',
  'demo@',
  'staging@',
];

function isTestAccount(email: string): boolean {
  const lower = email.toLowerCase();
  return TEST_EMAIL_PATTERNS.some((p) => lower.includes(p));
}

function daysSince(isoDate: string): number {
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24);
}

// localStorage key namespaced by userId so multi-account setups work correctly
const storageKey = (userId: string) => `sphere_nps_${userId}`;

interface NpsLocalState {
  submitted: boolean;
  dismissedAt?: number;
}

function readState(userId: string): NpsLocalState {
  if (typeof window === 'undefined') return { submitted: false };
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as NpsLocalState) : { submitted: false };
  } catch {
    return { submitted: false };
  }
}

function writeState(userId: string, state: NpsLocalState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(userId), JSON.stringify(state));
}

function followUpQuestion(score: number): string {
  if (score >= 9) return 'What do you love most about Sphere?';
  return 'What would make Sphere better for you?';
}

// 0–10 NPS score selector
function ScoreSelector({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex gap-1 flex-wrap">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className={`w-9 h-9 rounded text-sm font-medium border transition-colors ${
              value === i
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600'
            }`}
          >
            {i}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-400 pt-0.5">
        <span>Not at all likely</span>
        <span>Extremely likely</span>
      </div>
    </div>
  );
}

export function NpsSurveyWidget() {
  const [visible, setVisible] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'brand' | 'community_owner' | null>(null);
  const [daysSinceFirstLogin, setDaysSinceFirstLogin] = useState(0);

  const [score, setScore] = useState<number | null>(null);
  const [followUp, setFollowUp] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function evaluate() {
      const brandToken = getToken('brand');
      const communityToken = getToken('community');

      let userId: string | null = null;
      let email: string | null = null;
      let createdAt: string | null = null;
      let role: 'brand' | 'community_owner' | null = null;

      if (brandToken) {
        try {
          const brand = await brandAuth.me(brandToken);
          userId = brand.id;
          email = brand.email;
          createdAt = brand.createdAt ?? null;
          role = 'brand';
        } catch {
          // Not logged in as brand
        }
      }

      if (!userId && communityToken) {
        try {
          const owner = await communityAuth.me(communityToken);
          userId = owner.id;
          email = owner.email;
          createdAt = owner.createdAt ?? null;
          role = 'community_owner';
        } catch {
          // Not logged in as community owner
        }
      }

      if (cancelled) return;
      if (!userId || !email || !createdAt || !role) return;
      if (isTestAccount(email)) return;

      // Check 7-day trigger
      const days = daysSince(createdAt);
      if (days < 7) return;

      // Check local state
      const state = readState(userId);
      if (state.submitted) return;

      if (state.dismissedAt) {
        const daysSinceDismiss = (Date.now() - state.dismissedAt) / (1000 * 60 * 60 * 24);
        if (daysSinceDismiss < 14) return; // wait 14 days before re-triggering
      }

      setUserId(userId);
      setUserRole(role);
      setDaysSinceFirstLogin(Math.floor(days));
      setVisible(true);

      // Identify user and capture impression event in PostHog
      const ph = getPostHog();
      if (ph) {
        ph.identify(userId, { email, role, $created_at: createdAt });
        ph.capture('nps_survey_shown', {
          role,
          days_since_first_login: Math.floor(days),
        });
      }
    }

    evaluate();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleDismiss() {
    if (!userId) return;
    writeState(userId, { submitted: false, dismissedAt: Date.now() });
    const ph = getPostHog();
    if (ph) {
      ph.capture('nps_survey_dismissed', {
        role: userRole,
        days_since_first_login: daysSinceFirstLogin,
      });
    }
    setVisible(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (score === null || !userId || submitting) return;

    setSubmitting(true);

    const ph = getPostHog();
    if (ph) {
      ph.capture('nps_survey_submitted', {
        nps_score: score,
        follow_up_response: followUp.trim() || undefined,
        role: userRole,
        days_since_first_login: daysSinceFirstLogin,
        survey_timestamp: new Date().toISOString(),
      });
    }

    writeState(userId, { submitted: true });
    setSubmitted(true);
    setSubmitting(false);

    // Auto-close after thank-you message
    setTimeout(() => setVisible(false), 3000);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4 pointer-events-none">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg pointer-events-auto">
        {submitted ? (
          <div className="px-5 py-6 text-center space-y-2">
            <p className="text-2xl">🎉</p>
            <p className="font-semibold text-gray-800">Thanks for your feedback!</p>
            <p className="text-sm text-gray-500">Your input helps us build a better Sphere.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b">
              <div>
                <p className="font-semibold text-gray-900">How are we doing?</p>
                <p className="text-xs text-gray-500 mt-0.5">Takes less than 30 seconds.</p>
              </div>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none px-1"
                aria-label="Dismiss survey"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">
                  How likely are you to recommend Sphere to a friend or colleague?
                </label>
                <ScoreSelector value={score} onChange={setScore} />
              </div>

              {score !== null && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 block">
                    {followUpQuestion(score)}{' '}
                    <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={followUp}
                    onChange={(e) => setFollowUp(e.target.value)}
                    rows={2}
                    maxLength={2000}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                    placeholder="Share your thoughts…"
                    autoFocus
                  />
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={submitting || score === null}
                  className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Submitting…' : 'Submit'}
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Maybe later
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// Safe accessor — PostHog may not be initialized if the key is not set
function getPostHog() {
  try {
    return process.env.NEXT_PUBLIC_POSTHOG_KEY ? posthog : null;
  } catch {
    return null;
  }
}
