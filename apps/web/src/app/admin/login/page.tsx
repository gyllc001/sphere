'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { createBrowserClient } from '@/lib/supabase/browser';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { SphereMark } from '@/components/admin/SphereMark';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const supabase = createBrowserClient();
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInErr) {
      // Don't reveal whether the email exists; same message regardless.
      setError('Invalid credentials');
      setPending(false);
      return;
    }

    // router.refresh() makes the server components re-run with the new
    // session cookie so the layout's requireAdmin() check sees the user.
    router.replace(from);
    router.refresh();
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-base px-4 py-12">
      <Card className="w-full max-w-[400px] p-10 flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-3">
          <SphereMark size={40} />
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-2xl font-semibold text-primary">
              Sign in to Sphere Admin
            </h1>
            <p className="text-sm text-secondary">
              Use your admin credentials
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="email"
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            placeholder="you@sphere.com"
          />

          <Input
            id="password"
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
            error={error || undefined}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={pending}
            className="w-full mt-2"
          >
            {pending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
