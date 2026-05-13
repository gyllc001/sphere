import { SectionHeader } from './SectionHeader';

export function PricingHero() {
  return (
    <section className="py-20 px-6 md:px-[60px]">
      <SectionHeader
        label="Pricing"
        title="Simple, transparent pricing"
        subtitle="All plans include full marketplace access. No hidden fees on deals."
      />
    </section>
  );
}
