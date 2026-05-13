import { redirect } from 'next/navigation';

import { createServerClient } from '@/lib/supabase/server';

export type AdminRow = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'super_admin';
};

/**
 * Use from server components, server actions, and route handlers under /admin.
 * Returns the Supabase user + the matching admins row. Redirects to
 * /admin/login if there's no session and /admin/forbidden if the session
 * isn't tied to an admins row.
 *
 * The middleware enforces the same checks at the request boundary so an
 * unauthenticated request never reaches a server component — this is the
 * second line of defense and the canonical place to pull the admin row.
 */
export async function requireAdmin(): Promise<{
  user: { id: string; email: string | undefined };
  admin: AdminRow;
}> {
  const supabase = createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  // RLS on `admins` should allow an admin to read their own row. If the
  // SELECT returns nothing, the user is authenticated but not staff.
  const { data: admin, error } = await supabase
    .from('admins')
    .select('id, name, email, role')
    .eq('user_id', user.id)
    .maybeSingle<AdminRow>();

  if (error || !admin) {
    redirect('/admin/forbidden');
  }

  return { user: { id: user.id, email: user.email }, admin };
}
