import Link from 'next/link';
import { ReactNode } from 'react';

import { buttonClasses } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

export interface SplitHeroCta {
  label: string;
  href: string;
  variant: 'primary' | 'secondary';
}

export interface SplitHeroProps {
  label: string;
  title: ReactNode;
  subtitle: ReactNode;
  ctas: SplitHeroCta[];
  /** Right-side visual content (e.g. floating preview cards). */
  children?: ReactNode;
  /** Optional className appended to the outer <section>. Use this when a
   *  page wants a gradient background (e.g. /for-communities). */
  className?: string;
}

export function SplitHero({
  label,
  title,
  subtitle,
  ctas,
  children,
  className,
}: SplitHeroProps) {
  return (
    <section
      className={cn(
        'py-20 px-6 md:px-[60px] overflow-hidden',
        className,
      )}
    >
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="max-w-[580px]">
          <div className="text-xs font-semibold uppercase tracking-wider text-accent mb-4">
            {label}
          </div>
          <h1 className="font-display text-[32px] md:text-[44px] font-bold leading-[1.1] tracking-[-0.02em] text-primary mb-4">
            {title}
          </h1>
          <p className="text-base md:text-lg text-secondary leading-relaxed mb-7">
            {subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            {ctas.map((cta) => (
              <Link
                key={cta.href + cta.label}
                href={cta.href}
                className={buttonClasses({ variant: cta.variant, size: 'lg' })}
              >
                {cta.label}
              </Link>
            ))}
          </div>
        </div>

        {children && (
          <div className="w-full max-w-[420px] md:max-w-none md:justify-self-end flex flex-col gap-3">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
