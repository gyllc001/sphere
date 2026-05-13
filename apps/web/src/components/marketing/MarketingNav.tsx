'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

import { buttonClasses } from '@/components/ui/Button';
import { SphereMark } from '@/components/admin/SphereMark';
import { cn } from '@/lib/cn';

const LINKS = [
  { href: '/for-brands', label: 'For Brands' },
  { href: '/for-communities', label: 'For Communities' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/brand/login', label: 'Sign in' },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-16 bg-surface/80 backdrop-blur-md border-b border-default">
      <div className="h-full flex items-center justify-between px-6 md:px-[60px]">
        <Link
          href="/"
          className="inline-flex items-center gap-2 select-none"
          onClick={() => setOpen(false)}
        >
          <SphereMark size={28} />
          <span className="font-display font-bold text-[17px] tracking-tight text-primary">
            Sphere
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-secondary hover:text-primary transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/signup"
            className={buttonClasses({ variant: 'primary', size: 'md' })}
          >
            Get started
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-expanded={open}
          aria-controls="marketing-nav-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-sm text-secondary hover:bg-subtle hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile dropdown panel */}
      <div
        id="marketing-nav-menu"
        className={cn(
          'md:hidden border-t border-default bg-surface',
          open ? 'block' : 'hidden',
        )}
      >
        <nav className="flex flex-col gap-1 px-6 py-4">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="py-2 text-sm text-secondary hover:text-primary transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/signup"
            onClick={() => setOpen(false)}
            className={cn(
              buttonClasses({ variant: 'primary', size: 'md' }),
              'w-full mt-2',
            )}
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
