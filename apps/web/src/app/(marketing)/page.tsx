import { Hero } from '@/components/marketing/Hero';
import { HowItWorks } from '@/components/marketing/HowItWorks';
import { LogosRow } from '@/components/marketing/LogosRow';
import { MarketingCTA } from '@/components/marketing/MarketingCTA';

export default function HomePage() {
  return (
    <>
      <Hero />
      <LogosRow />
      <HowItWorks />
      <MarketingCTA
        title="Start your first campaign today"
        subtitle="Join 840 brands already running campaigns on Sphere. Plans start at $250/month with no long-term commitment."
        primaryCta="Create free account"
        primaryHref="/signup"
        secondaryCta="View pricing"
        secondaryHref="/pricing"
      />
    </>
  );
}
