import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const adminKey =
    req.cookies.get('sphere_admin_key')?.value ||
    req.headers.get('x-admin-key');

  if (!adminKey || adminKey.trim() === '') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };
