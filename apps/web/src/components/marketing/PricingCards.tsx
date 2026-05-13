import { PricingCard, PricingCardProps } from './PricingCard';

const TIERS: PricingCardProps[] = [
  {
    tierName: 'Starter',
    price: '$250',
    period: '/month',
    description:
      'For brands running 1–2 campaigns a month looking to explore community partnerships.',
    ctaLabel: 'Get started',
    ctaHref: '/signup',
    ctaVariant: 'secondary',
    features: [
      'Up to 2 active campaigns',
      'Access to full community marketplace',
      'Basic analytics dashboard',
      'Email support',
      'Escrow payment protection',
    ],
  },
  {
    tierName: 'Growth',
    price: '$450',
    period: '/month',
    description:
      'For growing brands that want better matching, deeper analytics, and team collaboration.',
    ctaLabel: 'Get started',
    ctaHref: '/signup',
    ctaVariant: 'primary',
    featured: true,
    features: [
      'Up to 8 active campaigns',
      'AI-powered community matching',
      'Advanced analytics + ROI tracking',
      '3 team seats',
      'Priority email & chat support',
      'Campaign templates library',
      'Custom UTM tracking',
    ],
  },
  {
    tierName: 'Scale',
    price: '$1,000',
    period: '/month',
    description:
      'For established brands running ongoing campaigns at volume who need dedicated support.',
    ctaLabel: 'Talk to sales',
    ctaHref: '/contact',
    ctaVariant: 'secondary',
    features: [
      'Unlimited campaigns',
      'Dedicated account manager',
      'Custom integrations (Slack, HubSpot)',
      'Unlimited team seats',
      'White-glove onboarding',
      'SLA & phone support',
      'Custom reporting',
    ],
  },
];

export function PricingCards() {
  return (
    <section className="px-6 md:px-[60px] mb-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-[1080px] mx-auto">
        {TIERS.map((tier) => (
          <PricingCard key={tier.tierName} {...tier} />
        ))}
      </div>
    </section>
  );
}
