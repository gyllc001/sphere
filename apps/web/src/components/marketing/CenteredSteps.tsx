import { ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { SectionHeader } from './SectionHeader';

export interface CenteredStep {
  title: string;
  desc: string;
}

export interface CenteredStepsProps {
  label: string;
  title: ReactNode;
  subtitle?: ReactNode;
  steps: CenteredStep[];
  /** Additional className appended to the outer <section>. */
  className?: string;
}

export function CenteredSteps({
  label,
  title,
  subtitle,
  steps,
  className,
}: CenteredStepsProps) {
  return (
    <section
      className={cn('bg-subtle py-20 px-6 md:px-[60px]', className)}
    >
      <SectionHeader label={label} title={title} subtitle={subtitle} />
      <ol className="max-w-[600px] mx-auto flex flex-col gap-8">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/30 text-accent font-bold text-sm flex items-center justify-center flex-shrink-0">
              {i + 1}
            </div>
            <div>
              <div className="text-base font-semibold text-primary mb-1">
                {step.title}
              </div>
              <div className="text-sm text-secondary leading-relaxed">
                {step.desc}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
