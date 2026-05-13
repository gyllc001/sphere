import { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex items-end justify-between gap-6 px-10 py-8 border-b border-default',
        className,
      )}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <h1 className="font-display text-[24px] leading-tight font-semibold text-primary truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-secondary truncate">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
