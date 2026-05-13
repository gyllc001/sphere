import Link from 'next/link';
import { Check } from 'lucide-react';

import { buttonClasses } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

export interface PricingCardProps {
  tierName: string;
  price: string;
  period: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  ctaVariant: 'primary' | 'secondary';
  features: string[];
  featured?: boolean;
}

export function PricingCard({
  tierName,
  price,
  period,
  description,
  ctaLabel,
  ctaHref,
  ctaVariant,
  features,
  featured = false,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        'relative bg-surface rounded-md p-8 flex flex-col',
        // 1.5px border per mockup (.pricing-card); featured swaps colour
        // to the accent green.
        featured
          ? 'border-[1.5px] border-accent'
          : 'border-[1.5px] border-default hover:border-strong transition-colors',
      )}
    >
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-[#0A0A0A] text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full shadow-card whitespace-nowrap">
          Most popular
        </div>
      )}

      <div className="text-[13px] font-semibold uppercase tracking-wider text-secondary mb-3">
        {tierName}
      </div>
      <div className="font-display text-[36px] font-bold text-primary leading-none">
        {price}
        <span className="text-base font-normal text-secondary ml-1">
          {period}
        </span>
      </div>
      {/* Description min-height keeps the CTAs aligned across the three
          cards at desktop width even when copy lengths differ slightly. */}
      <p className="text-sm text-secondary leading-relaxed mt-3 mb-6 min-h-[72px]">
        {description}
      </p>

      <Link
        href={ctaHref}
        className={cn(
          buttonClasses({ variant: ctaVariant, size: 'md' }),
          'w-full',
        )}
      >
        {ctaLabel}
      </Link>

      <div className="border-t border-default my-6" />

      <ul className="flex flex-col gap-2.5">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check
              size={16}
              strokeWidth={2}
              className="text-accent flex-shrink-0 mt-0.5"
            />
            <span className="text-sm text-primary">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
