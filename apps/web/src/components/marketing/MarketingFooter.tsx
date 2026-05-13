import Link from 'next/link';

import { SphereMark } from '@/components/admin/SphereMark';

const LINKS = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/contact', label: 'Contact' },
  { href: '/blog', label: 'Blog' },
];

export function MarketingFooter() {
  return (
    <footer className="bg-surface border-t border-default px-6 md:px-[60px] py-10">
      <div className="flex flex-col md:flex-row items-center md:justify-between gap-6 text-center md:text-left">
        <Link
          href="/"
          className="inline-flex items-center gap-2 select-none"
        >
          <SphereMark size={24} />
          <span className="font-display font-bold text-[15px] tracking-tight text-primary">
            Sphere
          </span>
        </Link>

        <div className="text-sm text-tertiary">
          © 2026 Sphere, Inc. All rights reserved.
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-6">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-secondary hover:text-primary transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
