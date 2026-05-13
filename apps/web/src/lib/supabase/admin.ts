import 'server-only';

import { createClient } from '@supabase/supabase-js';

export function createServiceRoleClient() {
  // Defense-in-depth. The "server-only" import above already fails the
  // build if this module is imported from a client component; this
  // runtime check catches anyone who manages to slip past that (e.g.
  // via dynamic import) before the key ever gets used.
  if (typeof window !== 'undefined') {
    throw new Error(
      'createServiceRoleClient() must never run in the browser. ' +
        'SUPABASE_SERVICE_ROLE_KEY would leak.'
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
