import { CenteredSteps } from '@/components/marketing/CenteredSteps';
import { BenefitsGrid } from '@/components/marketing/BenefitsGrid';
import { ForBrandsVisual } from '@/components/marketing/ForBrandsVisual';
import { MarketingCTA } from '@/components/marketing/MarketingCTA';
import { SplitHero } from '@/components/marketing/SplitHero';

const STEPS = [
  {
    title: 'Create your campaign brief',
    desc: 'Describe your campaign goals, target audience, budget, and preferred content format. Our brief builder guides you through every field.',
  },
  {
    title: 'Review matched communities',
    desc: 'Within hours, Sphere surfaces communities ranked by fit. Browse detailed profiles, audience data, past partnerships, and rates — then reach out directly.',
  },
  {
    title: 'Go live and track results',
    desc: "Once you confirm terms, funds go into escrow. Content goes live, you get notified, and Sphere's tracking kicks in automatically. Payment releases to the community on delivery.",
  },
];

export const metadata = {
  title: 'For Brands — Sphere',
  description:
    'Reach audiences that actually convert. Sphere connects you with community owners whose audiences trust their recommendations.',
};

export default function ForBrandsPage() {
  return (
    <>
      <SplitHero
        label="For Brands"
        title={
          <>
            Reach audiences that
            <br />
            actually convert
          </>
        }
        subtitle="Stop guessing on ad spend. Sphere connects you with community owners whose audiences trust their recommendations — and track every click to revenue."
        ctas={[
          { label: 'Start your campaign', href: '/signup', variant: 'primary' },
          { label: 'View pricing', href: '/pricing', variant: 'secondary' },
        ]}
      >
        <ForBrandsVisual />
      </SplitHero>

      <BenefitsGrid />

      <CenteredSteps
        label="How it works"
        title="Launch your first campaign in under an hour"
        steps={STEPS}
      />

      <MarketingCTA
        title="Ready to launch your first campaign?"
        subtitle="Join 840 brands already on Sphere. Start free — no credit card required for your first campaign brief."
        primaryCta="Create free account"
        primaryHref="/signup"
      />
    </>
  );
}
