import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { MarketingNav } from '@/components/marketing/MarketingNav';

/**
 * Marketing-segment layout.
 *
 * All non-admin pages live under this route group so they can keep their
 * dark-mode styling without fighting the admin theme toggle. The wrapper
 * carries TWO attributes that together pin every marketing descendant to
 * the dark palette regardless of the admin user's theme preference:
 *
 *   • `data-theme="dark"` drives the LEGACY CSS vars in globals.css
 *     (--color-bg / --color-text / --glass-*), which the old marketing
 *     styles (.hero-mesh, .glass-card, .bg-orb-*, .gradient-text, …) read.
 *
 *   • `className="dark"` drives the NEW design-system CSS vars
 *     (--bg-base / --text-primary / --text-secondary / --border-default /
 *     --accent / …), which our Tailwind utilities (text-primary,
 *     bg-surface, border-default, text-accent, …) resolve through.
 *
 * Both var systems are defined under `.dark` and `[data-theme='dark']`
 * selectors that match this element. Without `class="dark"`, toggling
 * the admin sidebar to light mode would unset .dark on <html>, the
 * design-system vars would flip to their light values, and marketing
 * pages built with the new tokens would render light text on the dark
 * (legacy-var-painted) background. Belt + braces by design.
 *
 * URLs are unaffected — Next.js skips the parenthesised group segment,
 * so `/`, `/brand/login`, `/community/register`, etc. all still resolve
 * to their original paths.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-theme="dark"
      className="dark min-h-screen flex flex-col"
      style={{ background: 'var(--color-bg)' }}
    >
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
