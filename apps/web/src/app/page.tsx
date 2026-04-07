import Link from 'next/link';
import {
  ArrowRight,
  Zap,
  Users,
  BarChart3,
  CheckCircle2,
  Search,
  FileText,
  Handshake,
  Globe,
  TrendingUp,
  Shield,
  Star,
  ChevronRight,
  Mail,
} from 'lucide-react';

// ─── Sphere Logomark (SVG) ────────────────────────────────────────────────────
function SphereLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="16" fill="#4F46E5" />
      <circle
        cx="17.2"
        cy="15.6"
        r="9.6"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-screen-xl mx-auto px-5 md:px-10 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 text-gray-950 font-semibold text-lg tracking-wide">
          <SphereLogo size={28} />
          Sphere
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-600 font-medium">
          <a href="#how-it-works" className="hover:text-gray-950 transition-colors duration-200">How it works</a>
          <a href="#social-proof" className="hover:text-gray-950 transition-colors duration-200">Why Sphere</a>
          <a href="#cta" className="hover:text-gray-950 transition-colors duration-200">Get started</a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/brand/login"
            className="hidden md:inline-flex text-sm font-medium text-gray-600 hover:text-gray-950 transition-colors duration-200"
          >
            Sign in
          </Link>
          <Link
            href="/brand/register"
            className="inline-flex items-center gap-1.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Get early access
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="pt-32 pb-24 px-5 md:px-10 bg-white text-center">
      <div className="max-w-screen-xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold px-3 py-1.5 rounded-full mb-8 tracking-wide uppercase">
          <Zap size={12} />
          Now in private beta
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#0F0F1A] leading-tight mb-6 max-w-4xl mx-auto">
          Connect brands with{' '}
          <span className="text-[#4F46E5]">communities</span>
          {' '}that care
        </h1>

        {/* Subheadline */}
        <p className="text-xl text-[#4B5563] max-w-2xl mx-auto mb-12 leading-relaxed">
          Sphere is the marketplace where ambitious brands find engaged communities.
          Authentic partnerships — matched by AI, closed in minutes.
        </p>

        {/* Dual CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/brand/register"
            className="inline-flex items-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold px-8 py-4 rounded-lg text-base transition-colors duration-200 w-full sm:w-auto justify-center"
          >
            I&apos;m a Brand
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/community/register"
            className="inline-flex items-center gap-2 border-2 border-[#4F46E5] text-[#4F46E5] hover:bg-[#EEF2FF] font-semibold px-8 py-4 rounded-lg text-base transition-colors duration-200 w-full sm:w-auto justify-center"
          >
            I own a community
            <ArrowRight size={18} />
          </Link>
        </div>

        <p className="mt-6 text-sm text-[#9CA3AF]">No credit card required · Free during beta</p>

        {/* Hero visual — abstract connection graphic */}
        <div className="mt-20 relative max-w-3xl mx-auto">
          <div className="rounded-2xl bg-[#F3F4F6] border border-[#E5E7EB] overflow-hidden p-8">
            <div className="flex items-center justify-center gap-8 md:gap-16">
              {/* Brand node */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-[#EEF2FF] border-2 border-[#4F46E5] flex items-center justify-center">
                  <BarChart3 size={28} className="text-[#4F46E5]" />
                </div>
                <span className="text-sm font-semibold text-[#0F0F1A]">Brand</span>
                <span className="text-xs text-[#4B5563] text-center max-w-[80px]">Submit brief</span>
              </div>

              {/* Connection line with Sphere */}
              <div className="flex flex-col items-center gap-2">
                <div className="hidden md:flex items-center gap-2 text-[#4B5563] text-xs font-medium">
                  <div className="h-px w-12 bg-[#4F46E5]/30" />
                  <SphereLogo size={36} />
                  <div className="h-px w-12 bg-[#4F46E5]/30" />
                </div>
                <SphereLogo size={36} className="md:hidden" />
                <span className="text-xs text-[#4B5563] font-medium">AI matching</span>
              </div>

              {/* Community node */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-[#ECFEFF] border-2 border-[#06B6D4] flex items-center justify-center">
                  <Users size={28} className="text-[#06B6D4]" />
                </div>
                <span className="text-sm font-semibold text-[#0F0F1A]">Community</span>
                <span className="text-xs text-[#4B5563] text-center max-w-[80px]">Accept deal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const brandSteps = [
    {
      icon: FileText,
      step: '01',
      title: 'Submit your brief',
      description:
        'Describe your campaign goals, target audience, and budget. Takes under 5 minutes.',
    },
    {
      icon: Zap,
      step: '02',
      title: 'AI finds your communities',
      description:
        'Our matching engine surfaces the most relevant communities from thousands of options — ranked by fit.',
    },
    {
      icon: Handshake,
      step: '03',
      title: 'Close deals fast',
      description:
        'Review proposals, negotiate terms, and sign in-platform. No back-and-forth email chains.',
    },
  ];

  const communitySteps = [
    {
      icon: Globe,
      step: '01',
      title: 'List your community',
      description:
        'Tell us about your audience, niche, and engagement metrics. Set your partnership preferences.',
    },
    {
      icon: TrendingUp,
      step: '02',
      title: 'Receive matched deals',
      description:
        'Brands come to you. Every inbound opportunity is pre-qualified and relevant to your audience.',
    },
    {
      icon: CheckCircle2,
      step: '03',
      title: 'Accept, decline, or counter',
      description:
        'You control every deal. Accept immediately, send a counter-offer, or pass — all in one click.',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 px-5 md:px-10 bg-[#F3F4F6]">
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-[#0F0F1A] mb-4">
            How Sphere works
          </h2>
          <p className="text-lg text-[#4B5563] max-w-xl mx-auto">
            Whether you&apos;re a brand or a community, getting started takes minutes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* For Brands */}
          <div className="bg-white rounded-2xl p-8 border border-[#E5E7EB]">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-[#EEF2FF] flex items-center justify-center">
                <BarChart3 size={20} className="text-[#4F46E5]" />
              </div>
              <h3 className="text-xl font-semibold text-[#0F0F1A]">For Brands</h3>
            </div>
            <div className="space-y-8">
              {brandSteps.map((s, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-[#EEF2FF] flex items-center justify-center">
                      <s.icon size={20} className="text-[#4F46E5]" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#4F46E5] uppercase tracking-widest mb-1">
                      Step {s.step}
                    </div>
                    <h4 className="text-base font-semibold text-[#0F0F1A] mb-1">{s.title}</h4>
                    <p className="text-sm text-[#4B5563] leading-relaxed">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-[#E5E7EB]">
              <Link
                href="/brand/register"
                className="inline-flex items-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold px-6 py-3 rounded-lg text-sm transition-colors duration-200"
              >
                Start as a Brand
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* For Communities */}
          <div className="bg-white rounded-2xl p-8 border border-[#E5E7EB]">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-[#ECFEFF] flex items-center justify-center">
                <Users size={20} className="text-[#06B6D4]" />
              </div>
              <h3 className="text-xl font-semibold text-[#0F0F1A]">For Community Owners</h3>
            </div>
            <div className="space-y-8">
              {communitySteps.map((s, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-[#ECFEFF] flex items-center justify-center">
                      <s.icon size={20} className="text-[#06B6D4]" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#06B6D4] uppercase tracking-widest mb-1">
                      Step {s.step}
                    </div>
                    <h4 className="text-base font-semibold text-[#0F0F1A] mb-1">{s.title}</h4>
                    <p className="text-sm text-[#4B5563] leading-relaxed">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-[#E5E7EB]">
              <Link
                href="/community/register"
                className="inline-flex items-center gap-2 border-2 border-[#06B6D4] text-[#06B6D4] hover:bg-[#ECFEFF] font-semibold px-6 py-3 rounded-lg text-sm transition-colors duration-200"
              >
                List my community
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Social Proof / Why Sphere ────────────────────────────────────────────────
function SocialProof() {
  const stats = [
    { value: '500+', label: 'Communities in beta', color: 'text-[#4F46E5]' },
    { value: '120+', label: 'Brands onboarding', color: 'text-[#06B6D4]' },
    { value: '3 min', label: 'Avg. time to first match', color: 'text-[#FBBF24]' },
    { value: '94%', label: 'Deal acceptance rate', color: 'text-[#4F46E5]' },
  ];

  const testimonials = [
    {
      quote:
        'We spent weeks manually reaching out to communities. Sphere found us better fits in an afternoon.',
      name: 'Sarah K.',
      role: 'Head of Growth, early brand partner',
      accentColor: '#4F46E5',
    },
    {
      quote:
        "As a community owner I used to get spammy cold emails. Now I only hear from brands that actually fit our audience.",
      name: 'Marcus T.',
      role: 'Founder, 28k-member Discord community',
      accentColor: '#06B6D4',
    },
    {
      quote:
        'The AI matching is scarily good. First recommendation was a brand our members had been asking about organically.',
      name: 'Priya M.',
      role: 'Creator & community lead, beta tester',
      accentColor: '#FBBF24',
    },
  ];

  const features = [
    {
      icon: Zap,
      title: 'AI-powered matching',
      description: 'Our engine analyzes audience demographics, engagement patterns, and brand DNA to surface only relevant fits.',
    },
    {
      icon: Shield,
      title: 'Safe & compliant',
      description: 'Built-in disclosure requirements, contract templates, and payment escrow — partnerships done right.',
    },
    {
      icon: BarChart3,
      title: 'Real-time analytics',
      description: 'Track campaign performance, community metrics, and ROI in a unified dashboard.',
    },
    {
      icon: Globe,
      title: 'Any community type',
      description: 'Discord, Slack, newsletters, Telegram, forums, subreddits — if your community is engaged, Sphere works.',
    },
  ];

  return (
    <section id="social-proof" className="py-24 px-5 md:px-10 bg-white">
      <div className="max-w-screen-xl mx-auto">
        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-24">
          {stats.map((s, i) => (
            <div key={i} className="text-center p-6 rounded-2xl bg-[#F3F4F6] border border-[#E5E7EB]">
              <div className={`text-4xl font-bold mb-1 ${s.color}`}>{s.value}</div>
              <div className="text-sm text-[#4B5563]">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Features grid */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-[#0F0F1A] mb-4">
            Why Sphere
          </h2>
          <p className="text-lg text-[#4B5563] max-w-xl mx-auto">
            We built what the partnership market has been missing.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          {features.map((f, i) => (
            <div key={i} className="p-6 rounded-2xl border border-[#E5E7EB] hover:border-[#4F46E5]/30 hover:shadow-sm transition-all duration-200">
              <div className="w-10 h-10 rounded-lg bg-[#EEF2FF] flex items-center justify-center mb-4">
                <f.icon size={20} className="text-[#4F46E5]" />
              </div>
              <h3 className="text-base font-semibold text-[#0F0F1A] mb-2">{f.title}</h3>
              <p className="text-sm text-[#4B5563] leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} fill="#FBBF24" stroke="none" />
            ))}
          </div>
          <h2 className="text-3xl font-bold text-[#0F0F1A]">Early beta feedback</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="p-6 rounded-2xl bg-[#F3F4F6] border border-[#E5E7EB]">
              <div
                className="w-1 h-8 rounded-full mb-4"
                style={{ backgroundColor: t.accentColor }}
              />
              <p className="text-sm text-[#0F0F1A] leading-relaxed mb-4 italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div>
                <div className="text-sm font-semibold text-[#0F0F1A]">{t.name}</div>
                <div className="text-xs text-[#4B5563]">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section id="cta" className="py-24 px-5 md:px-10 bg-[#4F46E5]">
      <div className="max-w-3xl mx-auto text-center">
        <SphereLogo size={48} className="mx-auto mb-6 opacity-90 [&_circle:first-child]:fill-white [&_circle:last-child]:stroke-[rgba(79,70,229,0.6)]" />
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Your community. Your brands.
        </h2>
        <p className="text-lg text-indigo-200 mb-10 leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
          Join the waitlist and get early access to the marketplace that makes authentic partnerships effortless.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/brand/register"
            className="inline-flex items-center justify-center gap-2 bg-white text-[#4F46E5] hover:bg-[#EEF2FF] font-semibold px-8 py-4 rounded-lg text-base transition-colors duration-200"
          >
            I&apos;m a Brand
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/community/register"
            className="inline-flex items-center justify-center gap-2 border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-4 rounded-lg text-base transition-colors duration-200"
          >
            I own a community
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-[#0F0F1A] text-white py-12 px-5 md:px-10">
      <div className="max-w-screen-xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <SphereLogo size={28} />
              <span className="font-semibold text-lg tracking-wide">Sphere</span>
            </Link>
            <p className="text-sm text-[#9CA3AF] max-w-xs leading-relaxed">
              The marketplace that connects ambitious brands with engaged communities. Authentic partnerships, at scale.
            </p>
            <a
              href="mailto:hello@sphere.so"
              className="inline-flex items-center gap-2 mt-4 text-sm text-[#9CA3AF] hover:text-white transition-colors duration-200"
            >
              <Mail size={14} />
              hello@sphere.so
            </a>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-[#9CA3AF]">
              <li><Link href="/brand/register" className="hover:text-white transition-colors duration-200">For Brands</Link></li>
              <li><Link href="/community/register" className="hover:text-white transition-colors duration-200">For Communities</Link></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors duration-200">How it works</a></li>
              <li><Link href="/brand/login" className="hover:text-white transition-colors duration-200">Sign in</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-[#9CA3AF]">
              <li><a href="#" className="hover:text-white transition-colors duration-200">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Cookie Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#2A2A3C] flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#9CA3AF]">
          <p>© {new Date().getFullYear()} Sphere. All rights reserved.</p>
          <p>Built for the creator economy.</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <SocialProof />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
