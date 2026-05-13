import Link from 'next/link';
import { ReactNode } from 'react';

import { buttonClasses } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

export interface MarketingCTAProps {
  title: ReactNode;
  subtitle: ReactNode;
  primaryCta: string;
  primaryHref: string;
  /** Optional secondary CTA. Both `secondaryCta` and `secondaryHref` must
   *  be provided together — render-time guard treats them as a pair. */
  secondaryCta?: string;
  secondaryHref?: string;
}

export function MarketingCTA({
  title,
  subtitle,
  primaryCta,
  primaryHref,
  secondaryCta,
  secondaryHref,
}: MarketingCTAProps) {
  const hasSecondary = Boolean(secondaryCta && secondaryHref);

  return (
    <section className="py-20 px-6 md:px-[60px] bg-gradient-to-br from-[#0A0A0A] to-[#1C1C1B] text-center">
      <div className="max-w-[560px] mx-auto">
        <h2 className="font-display text-[28px] md:text-[36px] font-bold text-white tracking-tight mb-4">
          {title}
        </h2>
        <p className="text-base text-white/70 leading-relaxed mb-8">
          {subtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={primaryHref}
            className={buttonClasses({ variant: 'primary', size: 'lg' })}
          >
            {primaryCta}
          </Link>
          {hasSecondary && (
            <Link
              href={secondaryHref!}
              className={cn(
                buttonClasses({ variant: 'secondary', size: 'lg' }),
                // One-off translucent-white-on-dark style for the secondary
                // button on the dark CTA section. Not promoted to a global
                // variant because it's only used here.
                'bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white',
              )}
            >
              {secondaryCta}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
