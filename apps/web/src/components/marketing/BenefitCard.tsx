import { LucideIcon } from 'lucide-react';

export interface BenefitCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function BenefitCard({ icon: Icon, title, description }: BenefitCardProps) {
  return (
    <div className="bg-surface border border-default rounded-md p-7 shadow-card">
      <div className="w-10 h-10 rounded-md bg-accent/10 flex items-center justify-center mb-3.5">
        <Icon size={20} strokeWidth={2} className="text-accent" />
      </div>
      <div className="text-[15px] font-semibold text-primary mb-1.5">
        {title}
      </div>
      <p className="text-sm text-secondary leading-relaxed">{description}</p>
    </div>
  );
}
