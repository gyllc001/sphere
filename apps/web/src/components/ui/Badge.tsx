import { HTMLAttributes, forwardRef } from 'react';

import { cn } from '@/lib/cn';

export type BadgeVariant = 'green' | 'yellow' | 'red' | 'gray';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const VARIANT: Record<BadgeVariant, string> = {
  green:
    'bg-[rgba(0,198,98,0.12)] text-accent-text border-[rgba(0,198,98,0.2)]',
  yellow:
    'bg-[rgba(234,179,8,0.12)] text-yellow-900 border-[rgba(234,179,8,0.2)]',
  red: 'bg-[rgba(239,68,68,0.12)] text-red-900 border-[rgba(239,68,68,0.2)]',
  gray: 'bg-subtle text-secondary border-default',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, variant = 'gray', ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
        VARIANT[variant],
        className,
      )}
      {...rest}
    />
  );
});
