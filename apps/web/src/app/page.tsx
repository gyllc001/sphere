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
  ChevronRight,
  Mail,
  Sparkles,
  Lock,
  AlertTriangle,
  Activity,
  MessageSquare,
} from 'lucide-react';

// ─── Sphere Logomark ──────────────────────────────────────────────────────────
function SphereLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="#00F078" />
      <circle cx="17.2" cy="15.6" r="9.6" stroke="rgba(255,255,255,0.55)" strokeWidth="2" fill="none" />
      <circle cx="16" cy="16" r="4" fill="rgba(255,255,255,0.3)" />
    </svg>
  );
}

// ─── Shared CTA strip ─────────────────────────────────────────────────────────
function CTAButtons({ size = 'lg', className = '' }: { size?: 'lg' | 'sm'; className?: string }) {
  const pad = size === 'lg' ? 'px-8 py-4 text-base' : 'px-6 py-3 text-sm';
  return (
    <div className={`flex flex-col sm:flex-row gap-3 items-center ${className}`}>
      <Link href="/brand/register" className={`inline-flex items-center justify-center gap-2 bg-[#00F078] hover:bg-[#00D966] text-black font-semibold ${pad} rounded-xl transition-all duration-200 w-full sm:w-auto shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:-translate-y-0.5`}>
        I&apos;m a Brand <ArrowRight size={size === 'lg' ? 18 : 15} />
      </Link>
      <Link href="/community/register" className={`inline-flex items-center justify-center gap-2 bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.18] hover:border-white/30 text-white font-semibold ${pad} rounded-xl transition-all duration-200 w-full sm:w-auto hover:-translate-y-0.5`}>
        I own a community <ArrowRight size={size === 'lg' ? 18 : 15} />
      </Link>
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06]" style={{ background: 'rgba(11,11,20,0.88)', backdropFilter: 'blur(16px)' }}>
      <div className="max-w-screen-xl mx-auto px-5 md:px-10 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 text-white font-semibold text-lg tracking-wide">
          <SphereLogo size={28} />
          Sphere
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-white/55 font-medium">
          <a href="#why-gated" className="hover:text-white transition-colors duration-200">Why gated?</a>
          <a href="#how-it-works" className="hover:text-white transition-colors duration-200">How it works</a>
          <a href="#proof" className="hover:text-white transition-colors duration-200">Results</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/brand/login" className="hidden md:inline-flex text-sm font-medium text-white/55 hover:text-white transition-colors duration-200">Sign in</Link>
          <Link href="/brand/register" className="inline-flex items-center gap-1.5 bg-[#00F078] hover:bg-[#00D966] text-black text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 animate-green-glow">
            Get access <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="hero-mesh pt-24 pb-8 px-5 md:px-10 overflow-hidden relative">
      {/* Animated orbs */}
      <div className="bg-orb-1" />
      <div className="bg-orb-2" />

      <div className="max-w-screen-xl mx-auto text-center relative z-10">

        {/* Urgency badge */}
        <div className="inline-flex items-center gap-2 glow-badge text-green-300 text-xs font-bold px-4 py-1.5 rounded-full mb-6 tracking-wider uppercase animate-fade-in-up">
          <Sparkles size={11} />
          Beta access — limited spots remaining
        </div>

        {/* Headline — USP-first */}
        <h1 className="animate-fade-in-up delay-100 text-5xl md:text-6xl lg:text-[5.5rem] font-extrabold text-white leading-[1.06] tracking-tight mb-5 max-w-5xl mx-auto">
          Brand deals inside{' '}
          <span className="gradient-text">gated communities</span>
          {' '}— finally possible
        </h1>

        {/* Sub — name the channels */}
        <p className="animate-fade-in-up delay-200 text-lg md:text-xl text-white/55 max-w-2xl mx-auto mb-4 leading-relaxed">
          Sphere is the <strong className="text-white/80 font-semibold">only platform</strong> connecting brands with private Facebook Groups, Discord servers, Reddit communities, Telegram channels, and newsletters — the gated audiences that have been impossible to reach, until now.
        </p>

        {/* Urgency line */}
        <p className="animate-fade-in-up delay-200 text-sm text-amber-400/90 font-semibold mb-8">
          🔒 These communities aren&apos;t tired of ads. They&apos;re untouched. Be first.
        </p>

        {/* CTAs */}
        <div className="animate-fade-in-up delay-300">
          <CTAButtons size="lg" className="justify-center mb-4" />
        </div>

        {/* Social proof nudge */}
        <p className="animate-fade-in-up delay-400 text-sm text-white/35 mb-12">
          Join <span className="text-white/60 font-semibold">120+ brands</span> already on Sphere · <span className="text-white/60 font-semibold">500+ gated communities</span> listed
        </p>

        {/* Hero dashboard mockup */}
        <div className="animate-fade-in-up delay-500 relative mx-auto max-w-4xl">
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-green-500/15 blur-3xl rounded-full pointer-events-none" />
          <div className="relative animate-float rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60" style={{ background: 'rgba(17,17,28,0.96)' }}>
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
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-white font-semibold text-sm">AI Match Results</div>
                  <div className="text-white/40 text-xs mt-0.5">Campaign: Summer Gear Drop · 3 gated community matches</div>
                </div>
                <div className="flex items-center gap-1.5 bg-green-500/15 text-green-400 text-xs font-bold px-3 py-1 rounded-full">
                  <Activity size={10} /> Live
                </div>
              </div>
              <div className="space-y-2.5">
                {[
                  { name: 'OutdoorGear Facebook Group', members: '34k members', match: '97', tag: 'Private · Facebook Group', color: '#00F078', active: true },
                  { name: 'r/GearJunkies (private)',    members: '89k members', match: '94', tag: 'Gated · Reddit',           color: '#00A8FF', active: false },
                  { name: 'TrailBlazers Discord',        members: '12k members', match: '91', tag: 'Private · Discord Server', color: '#00F078', active: false },
                ].map((c, i) => (
                  <div key={i} className={`flex items-center gap-3.5 p-3 rounded-xl border ${c.active ? 'border-green-500/40 bg-green-500/10' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white" style={{ background: c.color + '22', border: `1px solid ${c.color}40` }}>
                      {c.name.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">{c.name}</div>
                      <div className="text-white/35 text-xs">{c.members} · {c.tag}</div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs text-white/30">Match</div>
                        <div className="text-sm font-bold" style={{ color: c.color }}>{c.match}%</div>
                      </div>
                      <div className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${c.active ? 'bg-[#00F078] text-black' : 'bg-white/[0.05] text-white/35'}`}>
                        {c.active ? 'Connect' : 'View'}
                      </div>
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
    <section className="py-10 overflow-hidden border-y border-white/[0.05]" style={{ background: '#0D0D1A' }}>
      <p className="text-center text-xs font-bold uppercase tracking-widest text-white/18 mb-6 px-5">Brands already on Sphere</p>
      <div className="flex">
        <div className="animate-marquee flex gap-14 whitespace-nowrap items-center">
          {doubled.map((name, i) => (
            <span key={i} className="text-white/18 font-semibold text-sm tracking-wide hover:text-white/45 transition-colors duration-300 flex-shrink-0 select-none">{name}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Stats strip ──────────────────────────────────────────────────────────────
function StatsStrip() {
  const stats = [
    { value: '500+',  label: 'Gated communities listed',  color: '#818CF8' },
    { value: '120+',  label: 'Brands onboarding',         color: '#22D3EE' },
    { value: '3 min', label: 'Avg. time to first match',  color: '#FBBF24' },
    { value: '94%',   label: 'Deal acceptance rate',      color: '#818CF8' },
  ];
  return (
    <section className="py-14 px-5 md:px-10 bg-white">
      <div className="max-w-screen-xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0 md:divide-x md:divide-gray-100">
        {stats.map((s, i) => (
          <div key={i} className="flex flex-col items-center text-center md:px-8">
            <div className="text-4xl md:text-[2.75rem] font-extrabold mb-1 tracking-tight" style={{ color: s.color }}>{s.value}</div>
            <div className="text-sm text-gray-400 font-medium">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Why Gated Communities ────────────────────────────────────────────────────
function WhyGated() {
  return (
    <section id="why-gated" className="py-20 px-5 md:px-10 bg-white">
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-600 text-xs font-bold px-3 py-1.5 rounded-full mb-5 tracking-widest uppercase">
            The untapped golden opportunity
          </div>
          <h2 className="text-4xl md:text-[3rem] font-extrabold text-gray-950 tracking-tight mb-4 leading-tight">
            Why gated communities beat<br className="hidden md:block" /> influencer marketing
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Traditional influencer channels are saturated. Gated communities are the next frontier — and Sphere is the only door in.
          </p>
        </div>

        {/* Comparison table */}
        <div className="grid md:grid-cols-2 gap-6 mb-14 max-w-4xl mx-auto">
          {/* Tired channels */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-7">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-red-400" />
              </div>
              <h3 className="font-bold text-gray-950">Traditional influencer channels</h3>
            </div>
            <ul className="space-y-3">
              {[
                'Audience is numb — bombarded with #sponsored posts daily',
                'Influencers push brands their audience never asked for',
                'Trust has collapsed as AI influencers flood every platform',
                'CPM rising, ROI falling — brands fighting over the same eyeballs',
                'Zero community admin endorsement — just a face and a fee',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-500">
                  <span className="text-red-400 mt-0.5 flex-shrink-0">✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Gated communities */}
          <div className="rounded-2xl border border-green-200 bg-green-50/40 p-7">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <Lock size={18} className="text-[#00C662]" />
              </div>
              <h3 className="font-bold text-gray-950">Gated communities via Sphere</h3>
            </div>
            <ul className="space-y-3">
              {[
                'Members joined by choice — they\'re passionate, not passive scrollers',
                'Community admin endorsement carries the trust of the whole group',
                'Zero ad fatigue — most have never seen a brand deal before',
                'Closed membership filters the audience to exactly who you want',
                'Access to Facebook Groups, Discord, Reddit, Telegram, newsletters — all in one place',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <span className="text-[#00C662] mt-0.5 flex-shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Channel icons */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {[
            { label: 'Facebook Groups', bg: 'rgba(0,240,120,0.10)', color: '#00F078' },
            { label: 'Discord Servers',  bg: 'rgba(88,101,242,0.10)', color: '#5865F2' },
            { label: 'Reddit Communities', bg: 'rgba(255,86,0,0.10)', color: '#FF4500' },
            { label: 'Telegram Channels', bg: 'rgba(0,136,204,0.10)', color: '#0088cc' },
            { label: 'Newsletters',      bg: 'rgba(0,240,120,0.10)', color: '#00F078' },
          ].map((c) => (
            <div key={c.label} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border" style={{ background: c.bg, color: c.color, borderColor: c.color + '30' }}>
              <Lock size={12} />
              {c.label}
            </div>
          ))}
        </div>

        {/* Mid-page CTA */}
        <div className="rounded-2xl bg-[#0B0B14] p-8 md:p-10 text-center" style={{ background: 'linear-gradient(135deg, #0B0B14 0%, #13102A 100%)' }}>
          <p className="text-white/45 text-sm font-semibold uppercase tracking-widest mb-3">Limited beta access</p>
          <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-3 tracking-tight">
            Be first to reach the <span className="gradient-text">untouched audiences</span>
          </h3>
          <p className="text-white/45 text-sm mb-6 max-w-sm mx-auto">Spots are limited during beta. Brands joining now get priority matching and lower platform fees.</p>
          <CTAButtons size="sm" className="justify-center" />
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const brandSteps = [
    { icon: FileText,  step: '01', title: 'Submit your brief',        desc: 'Describe your campaign goals, target audience, and budget. Takes under 5 minutes.' },
    { icon: Zap,       step: '02', title: 'AI finds gated matches',   desc: 'Our engine surfaces private communities — Facebook groups, Discord servers, subreddits, Telegram channels — ranked by audience fit.' },
    { icon: Handshake, step: '03', title: 'Close deals in-platform',  desc: 'Message community admins, negotiate terms, and sign directly in Sphere. No cold emails, no spreadsheets.' },
  ];
  const communitySteps = [
    { icon: Globe,        step: '01', title: 'List your community',    desc: 'Connect your Facebook Group, Discord, Reddit, Telegram channel, or newsletter. Set your deal preferences and floor price.' },
    { icon: TrendingUp,   step: '02', title: 'Receive vetted brands',  desc: 'Brands come to you — pre-screened for audience relevance. No cold pitches from brands that don\'t fit.' },
    { icon: CheckCircle2, step: '03', title: 'Accept, counter, or pass', desc: 'Every deal is your call. One-click accept, counter-offer, or decline. Payments are escrowed and released automatically.' },
  ];

  return (
    <section id="how-it-works" className="py-20 px-5 md:px-10" style={{ background: '#F7F8FC' }}>
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4 tracking-widest uppercase">Simple by design</div>
          <h2 className="text-4xl md:text-[3rem] font-extrabold text-gray-950 tracking-tight mb-3">How Sphere works</h2>
          <p className="text-lg text-gray-400 max-w-lg mx-auto">Get your first gated community deal live in under an hour.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { label: 'For Brands',           steps: brandSteps,    accent: '#00F078', accentBg: 'rgba(0,240,120,0.10)', Icon: BarChart3, href: '/brand/register',     cta: 'Start as a Brand' },
            { label: 'For Community Owners', steps: communitySteps, accent: '#00A8FF', accentBg: 'rgba(0,168,255,0.10)', Icon: Users,    href: '/community/register', cta: 'List my community' },
          ].map((col) => (
            <div key={col.label} className="bg-white rounded-2xl border border-gray-100 p-7 hover:shadow-sm transition-all duration-300">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: col.accentBg }}>
                  <col.Icon size={20} style={{ color: col.accent }} />
                </div>
                <h3 className="text-lg font-bold text-gray-950">{col.label}</h3>
              </div>
              <div className="relative">
                <div className="absolute left-5 top-10 bottom-10 w-px" style={{ background: `linear-gradient(to bottom, ${col.accent}28, transparent)` }} />
                <div className="space-y-7">
                  {col.steps.map((s) => (
                    <div key={s.step} className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold z-10" style={{ background: col.accentBg, color: col.accent }}>{s.step}</div>
                      <div className="pt-1.5">
                        <h4 className="text-[0.9375rem] font-semibold text-gray-950 mb-1">{s.title}</h4>
                        <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-8 pt-5 border-t border-gray-100">
                <Link href={col.href} className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5" style={{ background: col.accentBg, color: col.accent }}>
                  {col.cta} <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
function Features() {
  const features = [
    { icon: Sparkles, title: 'AI-powered matching',       desc: 'Ranks gated communities by audience fit score, engagement rate, and campaign brief alignment — not just follower count.', iconBg: 'rgba(79,70,229,0.1)',  iconColor: '#818CF8' },
    { icon: Lock,     title: 'Access the inaccessible',   desc: 'Sphere holds partnerships with admins of private groups across every major platform — communities you could never cold-reach.', iconBg: 'rgba(34,211,238,0.1)', iconColor: '#22D3EE' },
    { icon: Shield,   title: 'Safe & compliant',          desc: 'Built-in FTC disclosure, contract templates, and payment escrow. Fully documented for your legal and finance teams.', iconBg: 'rgba(251,191,36,0.1)', iconColor: '#FBBF24' },
    { icon: BarChart3, title: 'Real-time ROI dashboard',  desc: 'Track reach, engagement, clicks, and conversions per deal — in one dashboard built for performance marketers.', iconBg: 'rgba(79,70,229,0.1)',  iconColor: '#818CF8' },
    { icon: MessageSquare, title: 'In-platform negotiation', desc: 'No back-and-forth emails. Message admins, counter-offer, and close deals entirely inside Sphere.', iconBg: 'rgba(167,139,250,0.1)', iconColor: '#A78BFA' },
    { icon: TrendingUp, title: 'First-mover advantage',  desc: 'These communities have never been approached for brand deals. Early brands get the best rates before this market matures.', iconBg: 'rgba(74,222,128,0.1)', iconColor: '#4ADE80' },
  ];
  return (
    <section className="py-20 px-5 md:px-10 bg-white">
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4 tracking-widest uppercase">Built for the partnership economy</div>
          <h2 className="text-4xl md:text-[3rem] font-extrabold text-gray-950 tracking-tight mb-3">Everything you need to win</h2>
          <p className="text-lg text-gray-400 max-w-lg mx-auto">The infrastructure for gated community partnerships — from discovery to payment.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i} className="feature-card bg-white rounded-2xl border border-gray-100 p-6">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: f.iconBg }}>
                <f.icon size={20} style={{ color: f.iconColor }} />
              </div>
              <h3 className="text-[0.9375rem] font-bold text-gray-950 mb-1.5">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Social Proof ─────────────────────────────────────────────────────────────
function SocialProof() {
  const testimonials = [
    { quote: 'We\'d been trying to reach niche outdoor communities for months. Sphere connected us to a private Facebook group of 34k passionate hikers in one afternoon. First deal closed within 48 hours.', name: 'Sarah K.', role: 'Head of Growth', company: 'Early brand partner', initials: 'SK', color: '#00F078' },
    { quote: 'My Discord server has never done brand deals — I didn\'t even know how to approach brands. Sphere handled everything. First deal was $3,200 and my members actually thanked me for it.', name: 'Marcus T.', role: 'Founder', company: '28k-member Discord community', initials: 'MT', color: '#00A8FF' },
    { quote: 'The AI match quality is genuinely impressive. Every recommended brand felt organic to my newsletter audience. Open rates on sponsored issues are actually higher than my editorial.', name: 'Priya M.', role: 'Newsletter creator', company: '12k subscriber Telegram channel', initials: 'PM', color: '#00F078' },
  ];

  return (
    <section id="proof" className="py-20 px-5 md:px-10" style={{ background: '#F7F8FC' }}>
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Real results from beta users</p>
          <h2 className="text-4xl md:text-[3rem] font-extrabold text-gray-950 tracking-tight">What they&apos;re saying</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5 mb-12">
          {testimonials.map((t, i) => (
            <div key={i} className="relative p-7 rounded-2xl border border-gray-100 bg-white hover:shadow-md hover:border-gray-200 transition-all duration-300">
              <div className="absolute top-4 right-5 text-5xl font-serif leading-none select-none pointer-events-none" style={{ color: t.color, opacity: 0.09 }}>&ldquo;</div>
              <p className="text-[0.9375rem] text-gray-600 leading-relaxed mb-5 relative z-10">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: t.color }}>{t.initials}</div>
                <div>
                  <div className="text-sm font-semibold text-gray-950">{t.name}</div>
                  <div className="text-xs text-gray-400">{t.role} · {t.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust signals row */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
          {[
            { icon: Shield, label: 'SOC 2 compliant' },
            { icon: Lock, label: 'Payments escrowed' },
            { icon: CheckCircle2, label: 'FTC-compliant contracts' },
            { icon: Zap, label: 'First match in minutes' },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-2 font-medium">
              <t.icon size={15} className="text-green-500" />
              {t.label}
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
    <section id="cta" className="dark-section py-20 px-5 md:px-10 overflow-hidden">
      <div className="max-w-3xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 bg-amber-400/15 text-amber-400 text-xs font-bold px-4 py-1.5 rounded-full mb-6 tracking-wider uppercase border border-amber-400/25">
          <Sparkles size={11} /> Beta — limited spots remaining
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
          Open the door to<br />
          <span className="gradient-text">gated audiences</span>
        </h2>
        <p className="text-lg text-white/45 mb-8 max-w-xl mx-auto leading-relaxed">
          Sphere is the only platform with access to private Facebook Groups, Discord servers, Reddit communities, Telegram channels, and newsletters. Join now before the market catches on.
        </p>
        <CTAButtons size="lg" className="justify-center mb-8" />
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
    <footer className="bg-[#080810] text-white py-12 px-5 md:px-10 border-t border-white/[0.05]">
      <div className="max-w-screen-xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4"><SphereLogo size={26} /><span className="font-semibold text-base tracking-wide">Sphere</span></Link>
            <p className="text-sm text-white/30 max-w-xs leading-relaxed">The only platform connecting brands with private Facebook Groups, Discord servers, Reddit communities, Telegram channels, and newsletters.</p>
            <a href="mailto:hello@sphere.so" className="inline-flex items-center gap-2 mt-4 text-sm text-white/30 hover:text-white/60 transition-colors duration-200"><Mail size={13} />hello@sphere.so</a>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/25 mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm text-white/30">
              <li><Link href="/brand/register" className="hover:text-white/65 transition-colors">For Brands</Link></li>
              <li><Link href="/community/register" className="hover:text-white/65 transition-colors">For Communities</Link></li>
              <li><a href="#how-it-works" className="hover:text-white/65 transition-colors">How it works</a></li>
              <li><Link href="/brand/login" className="hover:text-white/65 transition-colors">Sign in</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/25 mb-4">Legal</h4>
            <ul className="space-y-2.5 text-sm text-white/30">
              <li><Link href="/privacy" className="hover:text-white/65 transition-colors">Privacy Policy</Link></li>
              <li><a href="#" className="hover:text-white/65 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white/65 transition-colors">Cookie Policy</a></li>
              <li><a href="#" className="hover:text-white/65 transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-6 border-t border-white/[0.05] flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-white/20">
          <p>© {new Date().getFullYear()} Sphere. All rights reserved.</p>
          <p>The category leader for gated community partnerships.</p>
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
        <WhyGated />
        <HowItWorks />
        <Features />
        <SocialProof />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
