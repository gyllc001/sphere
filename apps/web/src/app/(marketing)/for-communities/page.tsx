import { EarningModel } from '@/components/marketing/EarningModel';
import { ForCommunitiesVisual } from '@/components/marketing/ForCommunitiesVisual';
import { MarketingCTA } from '@/components/marketing/MarketingCTA';
import { SectionHeader } from '@/components/marketing/SectionHeader';
import { SplitHero } from '@/components/marketing/SplitHero';
import { Testimonials } from '@/components/marketing/Testimonials';
import { TrustGrid } from '@/components/marketing/TrustGrid';

export const metadata = {
  title: 'For Communities — Sphere',
  description:
    'Turn your audience into reliable income. Sphere connects you with brands that genuinely want to reach your readers, listeners, or members.',
};

export default function ForCommunitiesPage() {
  return (
    <>
      <SplitHero
        label="For Communities"
        title={
          <>
            Turn your audience
            <br />
            into reliable income
          </>
        }
        subtitle="Sphere connects you with brands that genuinely want to reach your readers, listeners, or members — on your terms, at your rates, with payment guaranteed."
        ctas={[
          {
            label: 'List your community free',
            href: '/signup',
            variant: 'primary',
          },
          {
            label: 'See how pricing works',
            href: '/pricing',
            variant: 'secondary',
          },
        ]}
        className="bg-gradient-to-br from-[var(--bg-base)] to-[var(--bg-subtle)]"
      >
        <ForCommunitiesVisual />
      </SplitHero>

      <EarningModel />

      <section className="bg-subtle py-20 px-6 md:px-[60px]">
        <SectionHeader
          label="Why creators trust Sphere"
          title="Built for serious community builders"
        />
        <TrustGrid />
        <Testimonials />
      </section>

      <MarketingCTA
        title="List your community in 10 minutes"
        subtitle="Free to list. Free to receive briefs. Sphere's 5% fee only applies when a deal closes and you get paid."
        primaryCta="Create free listing"
        primaryHref="/signup"
      />
    </>
  );
}
