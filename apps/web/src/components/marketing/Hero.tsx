import Link from 'next/link';
import { ChevronDown, Zap } from 'lucide-react';

import { buttonClasses } from '@/components/ui/Button';

const STATS = [
  { value: '4,200+', label: 'Active communities' },
  { value: '$12M+', label: 'Paid to creators' },
  { value: '840', label: 'Brand campaigns live' },
  { value: '3.6x', label: 'Avg. campaign ROI' },
];

// Stagger delays for the hero entrance animation. Matches the mockup's
// rhythm (lines 1696–1700) but uses our existing @keyframes fadeUp from
// globals.css (kept from the legacy marketing block in round 2).
const FADE_UP = 'opacity-0 animate-[fadeUp_0.8s_ease_forwards]';

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 md:px-[60px] pt-24 md:pt-[100px] pb-16 md:pb-20 text-center">
      {/* Ambient orbs — translucent green disks with heavy blur. No blend
          mode (the mockup doesn't use one and additive blending would
          over-brighten against the dark base). */}
      <div aria-hidden className="absolute inset-0 -z-0 overflow-hidden pointer-events-none">
        <div
          className="absolute blur-3xl rounded-full"
          style={{
            width: 400,
            height: 400,
            top: -100,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,198,98,0.12)',
          }}
        />
        <div
          className="absolute blur-3xl rounded-full"
          style={{
            width: 300,
            height: 300,
            bottom: -50,
            right: '10%',
            background: 'rgba(0,198,98,0.06)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-[800px] mx-auto">
        <div
          className={`${FADE_UP} inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-medium`}
          style={{ animationDelay: '200ms' }}
        >
          <Zap size={14} strokeWidth={2} />
          <span>Now with AI-powered community matching</span>
        </div>

        <h1
          className={`${FADE_UP} font-display font-bold text-[36px] md:text-[52px] leading-[1.1] tracking-[-0.03em] text-primary mt-6`}
          style={{ animationDelay: '350ms' }}
        >
          The Marketplace for
          <br />
          <span className="text-accent">Authentic Partnerships</span>
        </h1>

        <p
          className={`${FADE_UP} text-base md:text-lg text-secondary leading-relaxed max-w-[560px] mx-auto mt-5`}
          style={{ animationDelay: '500ms' }}
        >
          Sphere connects forward-thinking brands with newsletter writers,
          podcast hosts, and community builders who have the audiences that
          matter.
        </p>

        <div
          className={`${FADE_UP} flex flex-col sm:flex-row gap-3 justify-center mt-9`}
          style={{ animationDelay: '650ms' }}
        >
          <Link
            href="/signup"
            className={buttonClasses({ variant: 'primary', size: 'lg' })}
          >
            Get started free
          </Link>
          <Link
            href="/pricing"
            className={buttonClasses({ variant: 'secondary', size: 'lg' })}
          >
            See pricing
          </Link>
        </div>

        <div
          className={`${FADE_UP} mt-12 max-w-[680px] mx-auto bg-white/5 backdrop-blur-md border border-white/10 rounded-md p-8`}
          style={{ animationDelay: '850ms' }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-3xl font-bold text-primary leading-none">
                  {s.value}
                </div>
                <div className="text-xs text-tertiary uppercase tracking-wider mt-2">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        aria-hidden
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-tertiary animate-bounce"
      >
        <ChevronDown size={16} strokeWidth={1.5} />
      </div>
    </section>
  );
}
