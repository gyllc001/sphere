import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// Paths under /admin that an unauthenticated user is allowed to hit.
// Everything else under /admin requires a Supabase session AND a matching
// row in public.admins.
const PUBLIC_ADMIN_PATHS = new Set<string>([
  '/admin/login',
  '/admin/forbidden',
  '/admin/logout',
]);

export async function middleware(req: NextRequest) {
  // Per @supabase/ssr docs, we have to return a NextResponse that the
  // Supabase client can attach refreshed-cookie Set-Cookie headers to.
  // The cookie callbacks below mutate `res` in place.
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({ name, value, ...options });
          res = NextResponse.next({ request: req });
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({ name, value: '', ...options });
          res = NextResponse.next({ request: req });
          res.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Calling getUser() is what actually triggers the cookie refresh.
  // Do this for every request, not just /admin — otherwise the session
  // can silently expire while the user is on a non-admin page.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = req.nextUrl.pathname;
  const isAdminPath = path === '/admin' || path.startsWith('/admin/');
  const isPublicAdmin = PUBLIC_ADMIN_PATHS.has(path);

  if (!isAdminPath) {
    return res;
  }

  // /admin/* — enforce auth + admin role.

  if (!user) {
    if (isPublicAdmin) return res;
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = '';
    url.searchParams.set('from', path + (req.nextUrl.search || ''));
    return NextResponse.redirect(url);
  }

  // Authenticated. Confirm admin status by hitting the admins table.
  // This goes through the user's RLS context; the admins-row RLS policy
  // must allow an admin to read their own row.
  const { data: adminRow } = await supabase
    .from('admins')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  const isAdmin = !!adminRow;

  // Already-signed-in admin bouncing off /admin/login → send to dashboard.
  if (path === '/admin/login' && isAdmin) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Authenticated non-admin trying to enter the admin section.
  // /admin/forbidden and /admin/logout stay reachable so they can sign out.
  if (!isAdmin && !isPublicAdmin) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/forbidden';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  // Run on every request except static assets, so the Supabase session
  // cookie gets refreshed regardless of which page is being loaded.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml)$).*)',
  ],
};
