import { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export interface SectionHeaderProps {
  label: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
}

/**
 * The eyebrow + display-font title + optional subtitle pattern used across
 * the marketing pages (HowItWorks, Benefits, Earning model, Trust signals,
 * Pricing, …). Centered by default — wrap in a different container if a
 * page needs left alignment.
 */
export function SectionHeader({
  label,
  title,
  subtitle,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'max-w-[500px] mx-auto text-center mb-14',
        className,
      )}
    >
      <div className="text-xs font-semibold uppercase tracking-wider text-accent mb-3">
        {label}
      </div>
      <h2 className="font-display text-[28px] md:text-[36px] font-semibold tracking-tight text-primary mb-3">
        {title}
      </h2>
      {subtitle && (
        <p className="text-base text-secondary leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}
