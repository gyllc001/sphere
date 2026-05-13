import { Card } from '@/components/ui/Card';

interface Testimonial {
  quote: string;
  initials: string;
  name: string;
  community: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Sphere is the only sponsorship platform I trust. The brands are vetted, the briefs are clear, and I've never had a payment issue in 18 months.",
    initials: 'MK',
    name: 'Marcus Kim',
    community: 'Devtools Weekly · 31K subs',
  },
  {
    quote:
      'I used to spend hours emailing brands. Now I just check my Sphere inbox on Monday mornings. Last month I earned $11K across 5 placements.',
    initials: 'AW',
    name: 'Aisha Williams',
    community: 'The Operator · 18K subs',
  },
];

export function Testimonials() {
  return (
    <div className="max-w-[640px] mx-auto mt-10">
      <div className="text-[13px] font-semibold uppercase tracking-wider text-tertiary text-center mb-5">
        What creators say
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TESTIMONIALS.map((t) => (
          <Card key={t.name}>
            <p className="text-sm text-primary leading-relaxed mb-3">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-semibold font-display flex-shrink-0">
                {t.initials}
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-primary">
                  {t.name}
                </div>
                <div className="text-xs text-secondary">{t.community}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
