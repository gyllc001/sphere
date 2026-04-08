import Link from 'next/link';
import {
  ArrowRight,
  Zap,
  Users,
  BarChart3,
  CheckCircle2,
  FileText,
  Handshake,
  Globe,
  TrendingUp,
  Shield,
  Star,
  ChevronRight,
  Mail,
  Sparkles,
  Target,
  MessageSquare,
  Activity,
} from 'lucide-react';

// ─── Sphere Logomark ──────────────────────────────────────────────────────────
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
      <circle cx="17.2" cy="15.6" r="9.6" stroke="rgba(255,255,255,0.55)" strokeWidth="2" fill="none" />
      <circle cx="16" cy="16" r="4" fill="rgba(255,255,255,0.3)" />
    </svg>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06]" style={{ background: 'rgba(11,11,20,0.85)', backdropFilter: 'blur(16px)' }}>
      <div className="max-w-screen-xl mx-auto px-5 md:px-10 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 text-white font-semibold text-lg tracking-wide">
          <SphereLogo size={28} />
          Sphere
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-white/60 font-medium">
          <a href="#how-it-works" className="hover:text-white transition-colors duration-200">How it works</a>
          <a href="#why-sphere" className="hover:text-white transition-colors duration-200">Why Sphere</a>
          <a href="#cta" className="hover:text-white transition-colors duration-200">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/brand/login"
            className="hidden md:inline-flex text-sm font-medium text-white/60 hover:text-white transition-colors duration-200"
          >
            Sign in
          </Link>
          <Link
            href="/brand/register"
            className="inline-flex items-center gap-1.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 animate-pulse-glow"
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
    <section className="hero-mesh pt-28 pb-0 px-5 md:px-10 overflow-hidden">
      <div className="max-w-screen-xl mx-auto text-center">
        {/* Animated badge */}
        <div className="inline-flex items-center gap-2 glow-badge text-indigo-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 tracking-wider uppercase animate-fade-in-up">
          <Sparkles size={12} />
          Now in private beta — 500+ communities joined
        </div>

        {/* Headline */}
        <h1 className="animate-fade-in-up delay-100 text-5xl md:text-6xl lg:text-[5rem] font-extrabold text-white leading-[1.08] tracking-tight mb-6 max-w-5xl mx-auto">
          The marketplace where{' '}
          <span className="gradient-text">brands meet communities</span>
        </h1>

        {/* Sub-headline */}
        <p className="animate-fade-in-up delay-200 text-lg md:text-xl text-white/55 max-w-2xl mx-auto mb-10 leading-relaxed">
          Sphere uses AI to match ambitious brands with engaged niche communities.
          Authentic partnerships — discovered in seconds, closed in minutes.
        </p>

        {/* Dual CTA */}
        <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row gap-4 justify-center items-center mb-4">
          <Link
            href="/brand/register"
            className="inline-flex items-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold px-8 py-4 rounded-xl text-base transition-all duration-200 w-full sm:w-auto justify-center shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:-translate-y-0.5"
          >
            I&apos;m a Brand
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/community/register"
            className="inline-flex items-center gap-2 bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.15] hover:border-white/30 text-white font-semibold px-8 py-4 rounded-xl text-base transition-all duration-200 w-full sm:w-auto justify-center hover:-translate-y-0.5"
          >
            I own a community
            <ArrowRight size={18} />
          </Link>
        </div>
        <p className="animate-fade-in-up delay-400 text-sm text-white/30 mb-20">
          No credit card required · Free during beta
        </p>

        {/* Hero dashboard mockup */}
        <div className="animate-fade-in-up delay-500 relative mx-auto max-w-4xl">
          {/* Ambient glow */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-indigo-600/20 blur-3xl rounded-full pointer-events-none" />

          <div
            className="relative animate-float rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60"
            style={{ background: 'rgba(19,19,31,0.95)', backdropFilter: 'blur(16px)' }}
          >
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/60" />
                <div className="w-3 h-3 rounded-full bg-amber-400/60" />
                <div className="w-3 h-3 rounded-full bg-green-400/60" />
              </div>
              <div className="flex-1 mx-3 bg-white/[0.05] rounded-md h-6 flex items-center px-3">
                <span className="text-white/25 text-xs">app.sphere.so/matches</span>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-white font-semibold text-sm">AI Match Results</div>
                  <div className="text-white/40 text-xs mt-0.5">Campaign: Summer Gear Drop 2025 · 3 top matches</div>
                </div>
                <div className="flex items-center gap-1.5 bg-green-500/15 text-green-400 text-xs font-semibold px-3 py-1 rounded-full">
                  <Activity size={10} />
                  Live
                </div>
              </div>

              {/* Match cards */}
              <div className="space-y-3">
                {[
                  { name: 'OutdoorHub Discord',    members: '28k members',     match: '97', tag: 'Outdoor & Adventure', color: '#4F46E5', active: true  },
                  { name: 'GearJunkies Newsletter', members: '41k subscribers', match: '94', tag: 'Gear Reviews',        color: '#06B6D4', active: false },
                  { name: 'TrailBlazers Slack',     members: '12k members',     match: '91', tag: 'Hiking & Camping',    color: '#FBBF24', active: false },
                ].map((c, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-4 p-3.5 rounded-xl border transition-all duration-200 ${
                      c.active
                        ? 'border-indigo-500/40 bg-indigo-600/10'
                        : 'border-white/[0.06] bg-white/[0.02]'
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                      style={{ background: c.color + '25', border: `1px solid ${c.color}40` }}
                    >
                      {c.name.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">{c.name}</div>
                      <div className="text-white/35 text-xs">{c.members} · {c.tag}</div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-xs text-white/35">Match</div>
                        <div className="text-sm font-bold" style={{ color: c.color }}>{c.match}%</div>
                      </div>
                      {c.active ? (
                        <div className="bg-[#4F46E5] text-white text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer">
                          Connect
                        </div>
                      ) : (
                        <div className="bg-white/[0.05] text-white/40 text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer">
                          View
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Logo bar ─────────────────────────────────────────────────────────────────
function LogoBar() {
  const logos = ['Nike', 'Shopify', 'HubSpot', 'Notion', 'Figma', 'Linear', 'Vercel', 'Stripe', 'Loom', 'Airtable'];
  const doubled = [...logos, ...logos];

  return (
    <section className="py-14 overflow-hidden border-y border-white/[0.05]" style={{ background: '#0D0D1A' }}>
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-white/20 mb-8 px-5">
        Trusted by growth teams at
      </p>
      <div className="relative flex">
        <div className="animate-marquee flex gap-16 whitespace-nowrap items-center">
          {doubled.map((name, i) => (
            <span key={i} className="text-white/20 font-semibold text-sm tracking-wide hover:text-white/45 transition-colors duration-300 flex-shrink-0 select-none">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Stats strip ──────────────────────────────────────────────────────────────
function StatsStrip() {
  const stats = [
    { value: '500+',  label: 'Communities in beta',      color: '#818CF8' },
    { value: '120+',  label: 'Brands onboarding',        color: '#22D3EE' },
    { value: '3 min', label: 'Avg. time to first match', color: '#FBBF24' },
    { value: '94%',   label: 'Deal acceptance rate',     color: '#818CF8' },
  ];

  return (
    <section className="py-20 px-5 md:px-10 bg-white">
      <div className="max-w-screen-xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-gray-100">
        {stats.map((s, i) => (
          <div key={i} className="flex flex-col items-center text-center md:px-8">
            <div className="text-4xl md:text-5xl font-extrabold mb-1 tracking-tight" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="text-sm text-gray-400 font-medium">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const brandSteps = [
    { icon: FileText,  step: '01', title: 'Submit your brief',         desc: 'Describe your campaign goals, target audience, and budget. Takes under 5 minutes.' },
    { icon: Zap,       step: '02', title: 'AI finds your communities', desc: 'Our engine surfaces the most relevant communities from thousands of options — ranked by fit score.' },
    { icon: Handshake, step: '03', title: 'Close deals fast',          desc: 'Review proposals, negotiate terms, and sign in-platform. No back-and-forth email chains.' },
  ];
  const communitySteps = [
    { icon: Globe,        step: '01', title: 'List your community',      desc: 'Tell us about your audience, niche, and engagement metrics. Set your partnership preferences.' },
    { icon: TrendingUp,   step: '02', title: 'Receive matched deals',    desc: 'Brands come to you. Every inbound opportunity is pre-qualified and relevant to your audience.' },
    { icon: CheckCircle2, step: '03', title: 'Accept, decline, counter', desc: 'You control every deal. Accept immediately, send a counter-offer, or pass — all in one click.' },
  ];

  return (
    <section id="how-it-works" className="py-28 px-5 md:px-10 bg-white">
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 tracking-widest uppercase">
            Simple by design
          </div>
          <h2 className="text-4xl md:text-[3rem] font-extrabold text-gray-950 tracking-tight mb-4">
            How Sphere works
          </h2>
          <p className="text-lg text-gray-400 max-w-lg mx-auto">
            Whether you&apos;re a brand or a community, getting started takes minutes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {[
            { label: 'For Brands',           steps: brandSteps,    accent: '#4F46E5', accentBg: '#EEF2FF', Icon: BarChart3, href: '/brand/register',     cta: 'Start as a Brand' },
            { label: 'For Community Owners', steps: communitySteps, accent: '#06B6D4', accentBg: '#ECFEFF', Icon: Users,    href: '/community/register', cta: 'List my community' },
          ].map((col) => (
            <div key={col.label} className="rounded-2xl border border-gray-100 p-8 hover:border-gray-200 hover:shadow-sm transition-all duration-300 bg-white">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: col.accentBg }}>
                  <col.Icon size={20} style={{ color: col.accent }} />
                </div>
                <h3 className="text-lg font-bold text-gray-950">{col.label}</h3>
              </div>

              <div className="relative">
                <div className="absolute left-5 top-10 bottom-10 w-px" style={{ background: `linear-gradient(to bottom, ${col.accent}30, transparent)` }} />
                <div className="space-y-8">
                  {col.steps.map((s) => (
                    <div key={s.step} className="flex gap-5">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold z-10" style={{ background: col.accentBg, color: col.accent }}>
                        {s.step}
                      </div>
                      <div className="pt-1.5">
                        <h4 className="text-[0.9375rem] font-semibold text-gray-950 mb-1">{s.title}</h4>
                        <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-gray-100">
                <Link
                  href={col.href}
                  className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                  style={{ background: col.accentBg, color: col.accent }}
                >
                  {col.cta}
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features / Why Sphere ────────────────────────────────────────────────────
function WhySphere() {
  const features = [
    {
      icon: Sparkles,
      title: 'AI-powered matching',
      description: 'Our engine analyses audience demographics, engagement patterns, and brand DNA — surfacing only the most relevant fits, ranked by compatibility score.',
      iconBg: 'rgba(79,70,229,0.12)',
      iconColor: '#818CF8',
    },
    {
      icon: Target,
      title: 'Precision targeting',
      description: 'Filter by community size, niche, platform, engagement rate, and audience demographics. No more spray-and-pray outreach.',
      iconBg: 'rgba(34,211,238,0.12)',
      iconColor: '#22D3EE',
    },
    {
      icon: Shield,
      title: 'Safe & compliant',
      description: 'Built-in disclosure requirements, contract templates, and payment escrow ensure every partnership meets FTC guidelines and protects both sides.',
      iconBg: 'rgba(251,191,36,0.12)',
      iconColor: '#FBBF24',
    },
    {
      icon: BarChart3,
      title: 'Real-time analytics',
      description: 'Track campaign performance, community reach, deal conversion, and ROI in a unified dashboard. Export reports for your stakeholders.',
      iconBg: 'rgba(79,70,229,0.12)',
      iconColor: '#818CF8',
    },
    {
      icon: Globe,
      title: 'Any community type',
      description: 'Discord, Slack, newsletters, Telegram, forums, subreddits — if your community is engaged, Sphere works. Platform-agnostic by design.',
      iconBg: 'rgba(74,222,128,0.12)',
      iconColor: '#4ADE80',
    },
    {
      icon: MessageSquare,
      title: 'In-platform negotiation',
      description: 'Built-in messaging, counter-offer flows, and contract signing means deals close entirely inside Sphere. No external tools required.',
      iconBg: 'rgba(167,139,250,0.12)',
      iconColor: '#A78BFA',
    },
  ];

  return (
    <section id="why-sphere" className="py-28 px-5 md:px-10" style={{ background: '#F7F8FC' }}>
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 tracking-widest uppercase">
            Built for the partnership economy
          </div>
          <h2 className="text-4xl md:text-[3rem] font-extrabold text-gray-950 tracking-tight mb-4">
            Why teams choose Sphere
          </h2>
          <p className="text-lg text-gray-400 max-w-lg mx-auto">
            We built what the partnership market has been missing for years.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div key={i} className="feature-card bg-white rounded-2xl border border-gray-100 p-7">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                style={{ background: f.iconBg }}
              >
                <f.icon size={20} style={{ color: f.iconColor }} />
              </div>
              <h3 className="text-[0.9375rem] font-bold text-gray-950 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function Testimonials() {
  const testimonials = [
    {
      quote: 'We spent weeks manually reaching out to communities. Sphere found us better fits in an afternoon. The AI match quality is genuinely impressive.',
      name: 'Sarah K.',
      role: 'Head of Growth',
      company: 'Early brand partner',
      initials: 'SK',
      color: '#4F46E5',
    },
    {
      quote: 'As a community owner I used to get spammy cold emails. Now I only hear from brands that actually fit our audience. Acceptance rate went from 10% to 80%.',
      name: 'Marcus T.',
      role: 'Founder',
      company: '28k-member Discord community',
      initials: 'MT',
      color: '#06B6D4',
    },
    {
      quote: 'The AI matching is scarily good. The first recommendation was a brand our members had been asking about organically. First deal closed same day.',
      name: 'Priya M.',
      role: 'Creator & community lead',
      company: 'Beta tester',
      initials: 'PM',
      color: '#FBBF24',
    },
  ];

  return (
    <section className="py-28 px-5 md:px-10 bg-white">
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} fill="#FBBF24" stroke="none" />
            ))}
            <span className="ml-2 text-sm font-semibold text-gray-400">4.9 / 5 from beta users</span>
          </div>
          <h2 className="text-4xl md:text-[3rem] font-extrabold text-gray-950 tracking-tight">
            What early users say
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="relative p-8 rounded-2xl border border-gray-100 bg-white hover:shadow-md hover:border-gray-200 transition-all duration-300">
              <div className="absolute top-5 right-6 text-6xl font-serif leading-none select-none pointer-events-none" style={{ color: t.color, opacity: 0.1 }}>
                &ldquo;
              </div>
              <p className="text-[0.9375rem] text-gray-600 leading-relaxed mb-6 relative z-10">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: t.color }}
                >
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-950">{t.name}</div>
                  <div className="text-xs text-gray-400">{t.role} · {t.company}</div>
                </div>
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
    <section id="cta" className="dark-section py-28 px-5 md:px-10 overflow-hidden">
      <div className="max-w-3xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-8 mx-auto" style={{ background: 'rgba(79,70,229,0.2)', border: '1px solid rgba(79,70,229,0.3)' }}>
          <SphereLogo size={32} />
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
          Start building authentic
          <br />
          <span className="gradient-text">community partnerships</span>
        </h2>
        <p className="text-lg text-white/45 mb-10 max-w-xl mx-auto leading-relaxed">
          Join the waitlist today and get early access to the marketplace that makes brand-community partnerships effortless and measurable.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
          <Link
            href="/brand/register"
            className="inline-flex items-center justify-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold px-8 py-4 rounded-xl text-base transition-all duration-200 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-0.5"
          >
            I&apos;m a Brand
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/community/register"
            className="inline-flex items-center justify-center gap-2 bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.15] hover:border-white/30 text-white font-semibold px-8 py-4 rounded-xl text-base transition-all duration-200 hover:-translate-y-0.5"
          >
            I own a community
            <ArrowRight size={18} />
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-white/30 font-medium">
          <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-green-400" />Free during beta</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-green-400" />No credit card required</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-green-400" />Cancel any time</span>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-[#080810] text-white py-14 px-5 md:px-10 border-t border-white/[0.05]">
      <div className="max-w-screen-xl mx-auto">
        <div className="grid md:grid-cols-4 gap-10 mb-10">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <SphereLogo size={26} />
              <span className="font-semibold text-base tracking-wide">Sphere</span>
            </Link>
            <p className="text-sm text-white/30 max-w-xs leading-relaxed">
              The marketplace that connects ambitious brands with engaged communities. Authentic partnerships, at scale.
            </p>
            <a
              href="mailto:hello@sphere.so"
              className="inline-flex items-center gap-2 mt-4 text-sm text-white/30 hover:text-white/60 transition-colors duration-200"
            >
              <Mail size={13} />
              hello@sphere.so
            </a>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/25 mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm text-white/30">
              <li><Link href="/brand/register" className="hover:text-white/70 transition-colors duration-200">For Brands</Link></li>
              <li><Link href="/community/register" className="hover:text-white/70 transition-colors duration-200">For Communities</Link></li>
              <li><a href="#how-it-works" className="hover:text-white/70 transition-colors duration-200">How it works</a></li>
              <li><Link href="/brand/login" className="hover:text-white/70 transition-colors duration-200">Sign in</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/25 mb-4">Legal</h4>
            <ul className="space-y-2.5 text-sm text-white/30">
              <li><a href="#" className="hover:text-white/70 transition-colors duration-200">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white/70 transition-colors duration-200">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white/70 transition-colors duration-200">Cookie Policy</a></li>
              <li><a href="#" className="hover:text-white/70 transition-colors duration-200">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/[0.05] flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/20">
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
        <LogoBar />
        <StatsStrip />
        <HowItWorks />
        <WhySphere />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
