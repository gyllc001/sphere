import {
  BarChart2,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';

import { BenefitCard } from './BenefitCard';
import { SectionHeader } from './SectionHeader';

interface Benefit {
  icon: LucideIcon;
  title: string;
  description: string;
}

const BENEFITS: Benefit[] = [
  {
    icon: Target,
    title: 'Precision targeting',
    description:
      'Filter communities by audience size, open rate, demographics, niche, and geography. Only pay for the reach that matters to you.',
  },
  {
    icon: BarChart2,
    title: 'Real-time analytics',
    description:
      'Track impressions, clicks, conversions, and ROI in a unified dashboard. No spreadsheets, no manual reporting.',
  },
  {
    icon: ShieldCheck,
    title: 'Escrow protection',
    description:
      "Funds are held securely until your content goes live and is verified. You're never at risk of paying for work that doesn't happen.",
  },
  {
    icon: Zap,
    title: 'AI-powered matching',
    description:
      'Our algorithm scores every community in the marketplace against your brief and surfaces your top matches automatically.',
  },
  {
    icon: Users,
    title: 'Team collaboration',
    description:
      'Invite campaign managers, give read-only access to stakeholders, and manage approvals without sharing credentials.',
  },
  {
    icon: TrendingUp,
    title: '3.6x average ROI',
    description:
      'Brands on Sphere see an average return of 3.6x on campaign spend, measured from click to closed deal within 90 days.',
  },
];

export function BenefitsGrid() {
  return (
    <section className="py-20 px-6 md:px-[60px]">
      <SectionHeader
        label="Benefits"
        title="Everything you need to run great campaigns"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-[1080px] mx-auto">
        {BENEFITS.map((b) => (
          <BenefitCard key={b.title} {...b} />
        ))}
      </div>
    </section>
  );
}
