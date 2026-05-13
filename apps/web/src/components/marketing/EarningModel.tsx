import { ShieldCheck } from 'lucide-react';

import { Card } from '@/components/ui/Card';
import { SectionHeader } from './SectionHeader';

interface PayoutExample {
  listPrice: string;
  payout: string;
}

const EXAMPLES: PayoutExample[] = [
  { listPrice: 'You list at $1,200/issue', payout: '$1,140' },
  { listPrice: 'You list at $3,500/send', payout: '$3,325' },
];

export function EarningModel() {
  return (
    <section className="py-20 px-6 md:px-[60px]">
      <SectionHeader
        label="Earning model"
        title="You set the terms. We handle the rest."
        subtitle="There are no upfront fees. Sphere takes a 5% fee only when a deal closes and funds are paid out."
      />

      <div className="max-w-[720px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {EXAMPLES.map((ex) => (
            <Card key={ex.listPrice}>
              <div className="text-[13px] font-semibold text-secondary mb-2">
                {ex.listPrice}
              </div>
              <div className="font-display text-2xl font-bold text-primary mb-1">
                {ex.payout}
              </div>
              <div className="text-[13px] text-secondary">
                What you receive after 5% fee
              </div>
            </Card>
          ))}
        </div>

        <div className="bg-subtle border border-default rounded-md p-5 flex gap-3 items-start">
          <ShieldCheck
            size={20}
            strokeWidth={2}
            className="text-accent flex-shrink-0 mt-0.5"
          />
          <div>
            <div className="font-semibold text-primary mb-1">
              Payment is guaranteed by Sphere escrow
            </div>
            <p className="text-[13px] text-secondary leading-relaxed">
              When a brand confirms a deal, funds are deposited into escrow
              before any content is created. Once your issue goes live, Sphere
              releases payment within 2 business days — no invoicing, no
              chasing.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
