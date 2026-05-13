import { PricingCards } from '@/components/marketing/PricingCards';
import { PricingComparisonTable } from '@/components/marketing/PricingComparisonTable';
import { PricingFreeForCommunities } from '@/components/marketing/PricingFreeForCommunities';
import { PricingHero } from '@/components/marketing/PricingHero';

export const metadata = {
  title: 'Pricing — Sphere',
  description:
    'Simple, transparent pricing. All plans include full marketplace access. No hidden fees on deals.',
};

export default function PricingPage() {
  return (
    <>
      <PricingHero />
      <PricingCards />
      <PricingComparisonTable />
      <PricingFreeForCommunities />
    </>
  );
}
