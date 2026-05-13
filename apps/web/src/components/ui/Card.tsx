import { HTMLAttributes, forwardRef } from 'react';

import { cn } from '@/lib/cn';

export type CardProps = HTMLAttributes<HTMLDivElement>;

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'bg-surface border border-default rounded-md p-5 shadow-card',
        className,
      )}
      {...rest}
    />
  );
});
