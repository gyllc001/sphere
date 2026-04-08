'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function SignupRouter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type');

  useEffect(() => {
    if (type === 'brand') {
      router.replace('/brand/register');
    } else if (type === 'community') {
      router.replace('/community/register');
    }
    // otherwise fall through to type-selection UI
  }, [type, router]);

  if (type === 'brand' || type === 'community') {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Redirecting...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-gray-900">Sphere</Link>
          <p className="text-gray-500 text-sm mt-2">The marketplace for brand–community partnerships</p>
        </div>

        <h1 className="text-xl font-bold text-gray-900 text-center mb-6">Join Sphere — who are you?</h1>

        <div className="space-y-4">
          <Link
            href="/brand/register"
            className="flex items-center gap-4 bg-white border-2 border-gray-200 hover:border-blue-500 rounded-xl p-5 transition-colors group"
          >
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">I'm a Brand</p>
              <p className="text-sm text-gray-500">Find and partner with engaged communities</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 ml-auto group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            href="/community/register"
            className="flex items-center gap-4 bg-white border-2 border-gray-200 hover:border-green-500 rounded-xl p-5 transition-colors group"
          >
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-green-100">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">I own a community</p>
              <p className="text-sm text-gray-500">List your community and earn from brand partnerships</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 ml-auto group-hover:text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/brand/login" className="text-blue-600 hover:underline">Brand login</Link>
          {' '}or{' '}
          <Link href="/community/login" className="text-green-600 hover:underline">Community login</Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>}>
      <SignupRouter />
    </Suspense>
  );
}
