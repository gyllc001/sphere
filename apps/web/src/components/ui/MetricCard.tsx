import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

import { cn } from '@/lib/cn';
import { Card } from './Card';

export type MetricChangeDirection = 'up' | 'down' | 'flat';

export interface MetricChange {
  value: string;
  direction: MetricChangeDirection;
}

export interface MetricCardProps {
  label: string;
  value: string | number;
  change?: MetricChange;
  /** Render the value in muted (tertiary) colour, e.g. when showing "—"
   *  for not-yet-loaded counts. */
  placeholder?: boolean;
  className?: string;
}

const CHANGE_COLOR: Record<MetricChangeDirection, string> = {
  up: 'text-accent-text',
  down: 'text-red-600',
  flat: 'text-tertiary',
};

const CHANGE_ICON = {
  up: ArrowUp,
  down: ArrowDown,
  flat: Minus,
} as const;

export function MetricCard({
  label,
  value,
  change,
  placeholder = false,
  className,
}: MetricCardProps) {
  const Icon = change ? CHANGE_ICON[change.direction] : null;
  return (
    <Card className={cn('flex flex-col', className)}>
      <div className="text-label text-secondary uppercase mb-2">{label}</div>
      <div
        className={cn(
          'font-display text-3xl font-semibold leading-none mb-1.5',
          placeholder ? 'text-tertiary' : 'text-primary',
        )}
      >
        {value}
      </div>
      {change && Icon && (
        <div
          className={cn(
            'text-xs flex items-center gap-1',
            CHANGE_COLOR[change.direction],
          )}
        >
          <Icon size={12} />
          <span>{change.value}</span>
        </div>
      )}
    </Card>
  );
}
