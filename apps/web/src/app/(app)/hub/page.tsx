export const metadata = {
  title: 'Sphere Design Hub',
  robots: { index: false, follow: false },
};

const designs = [
  {
    href: '/hub/sphere-redesign-v6.html',
    badge: 'Design',
    badgeClass: 'badge-design',
    title: 'Platform Redesign v6',
    description:
      'Latest full-platform UI redesign covering brand portal, community owner flow, and campaign management.',
  },
  {
    href: '/hub/sphere-prototype.html',
    badge: 'Prototype',
    badgeClass: 'badge-prototype',
    title: 'Marketplace Prototype',
    description:
      '9-screen interactive walkthrough of the core brand–community matching and deal flow.',
  },
  {
    href: '/hub/dashboard.html',
    badge: 'Dashboard',
    badgeClass: 'badge-dashboard',
    title: 'Growth Dashboard',
    description:
      'Ops and growth metrics: user signups, campaign activity, and funnel performance.',
  },
];

export default function HubPage() {
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0f; }
        .hub-page {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #0a0a0f;
          color: #e8e8f0;
          min-height: 100vh;
          padding: 48px 24px;
        }
        .hub-container { max-width: 800px; margin: 0 auto; }
        .hub-logo {
          font-size: 13px; font-weight: 600; letter-spacing: 0.12em;
          text-transform: uppercase; color: #6b6bff; margin-bottom: 12px;
        }
        .hub-title {
          font-size: 32px; font-weight: 700; letter-spacing: -0.02em;
          color: #fff; margin-bottom: 10px;
        }
        .hub-subtitle { font-size: 15px; color: #888; line-height: 1.5; margin-bottom: 48px; }
        .hub-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 16px;
        }
        .hub-card {
          background: #13131a; border: 1px solid #1e1e2e; border-radius: 12px;
          padding: 24px; text-decoration: none; color: inherit; display: block;
          transition: border-color 0.15s, background 0.15s; position: relative;
        }
        .hub-card:hover { border-color: #6b6bff; background: #16161f; }
        .hub-card.coming-soon { opacity: 0.45; cursor: default; pointer-events: none; }
        .hub-badge {
          display: inline-block; font-size: 10px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase; padding: 3px 8px;
          border-radius: 4px; margin-bottom: 14px;
        }
        .badge-design { background: #1a1a3a; color: #8888ff; }
        .badge-prototype { background: #1a2a1a; color: #66bb77; }
        .badge-dashboard { background: #2a1a1a; color: #ff8866; }
        .badge-soon { background: #1e1e1e; color: #555; }
        .hub-card h2 {
          font-size: 17px; font-weight: 600; color: #fff;
          margin-bottom: 8px; letter-spacing: -0.01em;
        }
        .hub-card p { font-size: 13px; color: #666; line-height: 1.55; }
        .hub-arrow {
          position: absolute; top: 24px; right: 24px; color: #333;
          font-size: 18px; transition: color 0.15s, transform 0.15s;
        }
        .hub-card:hover .hub-arrow { color: #6b6bff; transform: translate(2px, -2px); }
        .hub-footer {
          margin-top: 56px; padding-top: 24px; border-top: 1px solid #1a1a1a;
          font-size: 12px; color: #333;
        }
      `}</style>
      <div className="hub-page">
        <div className="hub-container">
          <header>
            <div className="hub-logo">Sphere</div>
            <h1 className="hub-title">Design Hub</h1>
            <p className="hub-subtitle">All design files, prototypes, and dashboards in one place.</p>
          </header>

          <div className="hub-grid">
            {designs.map((d) => (
              <a key={d.href} className="hub-card" href={d.href} target="_blank" rel="noopener noreferrer">
                <span className="hub-arrow">↗</span>
                <span className={`hub-badge ${d.badgeClass}`}>{d.badge}</span>
                <h2>{d.title}</h2>
                <p>{d.description}</p>
              </a>
            ))}

            <div className="hub-card coming-soon">
              <span className="hub-badge badge-soon">Coming Soon</span>
              <h2>Platform Mockups</h2>
              <p>Early platform concept mocks for the brand and community owner interfaces.</p>
            </div>

            <div className="hub-card coming-soon">
              <span className="hub-badge badge-soon">Coming Soon</span>
              <h2>Creator Mockups</h2>
              <p>Early creator-side interface concepts for community owner onboarding and listing.</p>
            </div>
          </div>

          <footer className="hub-footer">
            Sphere &mdash; Internal Design Hub &mdash; Last updated April 2026
          </footer>
        </div>
      </div>
    </>
  );
}
