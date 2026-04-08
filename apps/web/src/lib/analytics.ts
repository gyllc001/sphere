import posthog from 'posthog-js';

export function initPostHog() {
  if (typeof window === 'undefined') return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    capture_pageview: false, // we fire manually via usePathname
    capture_pageleave: true,
    session_recording: {
      maskAllInputs: true,
    },
  });
}

export function identifyUser(id: string, props?: Record<string, unknown>) {
  posthog.identify(id, props);
}

export function resetUser() {
  posthog.reset();
}

export function track(event: string, properties?: Record<string, unknown>) {
  posthog.capture(event, properties);
}

export { posthog };
