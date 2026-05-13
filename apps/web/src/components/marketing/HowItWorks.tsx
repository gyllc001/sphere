import { SectionHeader } from './SectionHeader';

interface Step {
  title: string;
  desc: string;
}

const BRAND_STEPS: Step[] = [
  {
    title: 'Post your campaign brief',
    desc: "Describe your audience, budget, and goals. Sphere's matching algorithm surfaces the most relevant communities within hours.",
  },
  {
    title: 'Review matches and negotiate',
    desc: 'Browse community profiles with real audience data — open rates, demographics, past partnerships — and negotiate terms directly in the platform.',
  },
  {
    title: 'Track results in real time',
    desc: 'See impressions, clicks, and conversions as they happen. Pay only when placements go live, with full transparency on spend.',
  },
];

const OWNER_STEPS: Step[] = [
  {
    title: 'Create your listing',
    desc: 'Set up your community profile with audience stats, content formats, and rates. It takes less than 10 minutes and can be updated anytime.',
  },
  {
    title: 'Receive inbound opportunities',
    desc: 'Brands find and pitch you directly. Review briefs, accept the ones that fit, and counter-offer on terms you want to adjust.',
  },
  {
    title: 'Get paid reliably',
    desc: 'Sphere holds funds in escrow and releases payment within 2 business days of your content going live. No invoicing, no chasing.',
  },
];

function StepColumn({ label, steps }: { label: string; steps: Step[] }) {
  return (
    <div>
      <div className="text-[13px] font-semibold uppercase tracking-wider text-tertiary mb-7">
        {label}
      </div>
      <ol className="flex flex-col gap-7">
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
    </div>
  );
}

export function HowItWorks() {
  return (
    <section className="py-20 px-6 md:px-[60px]">
      <SectionHeader
        label="How it works"
        title="Simple for both sides of the marketplace"
        subtitle={
          <>
            Whether you&apos;re a brand looking to grow or a community owner
            looking to earn, Sphere handles the complexity.
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-[60px] max-w-[960px] mx-auto">
        <StepColumn label="For Brands" steps={BRAND_STEPS} />
        <StepColumn label="For Community Owners" steps={OWNER_STEPS} />
      </div>
    </section>
  );
}
