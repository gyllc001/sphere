import { NextResponse } from 'next/server';

import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = createServerClient();
  await supabase.auth.signOut();

  // 303 forces the browser to follow the redirect with GET so the form's
  // POST doesn't get retried against /admin/login.
  return NextResponse.redirect(new URL('/admin/login', req.url), { status: 303 });
}
