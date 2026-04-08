import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Sphere',
  description: 'How Sphere collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 py-4 px-5 md:px-10">
        <Link href="/" className="text-indigo-600 font-semibold text-base hover:underline">
          ← Sphere
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-5 md:px-10 py-12">
        <h1 className="text-3xl font-bold mb-2">Sphere Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-8">
          <strong>Effective Date:</strong> [TO BE SET ON LAUNCH] &nbsp;|&nbsp;{' '}
          <strong>Last Updated:</strong> April 2026
        </p>

        <div className="prose prose-gray max-w-none text-sm leading-relaxed space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p>
              Sphere operates a two-sided marketplace platform that connects community organizers
              and contributors. This Privacy Policy explains how we collect, use, disclose, and
              protect your personal information when you use our platform (the &ldquo;Service&rdquo;).
            </p>
            <p className="mt-2">
              By creating an account or using the Service, you agree to the collection and use of
              information described in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>

            <h3 className="text-base font-semibold mb-2">2.1 Information You Provide</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li><strong>Account information:</strong> Name, email address, username, and password when you register.</li>
              <li><strong>Profile information:</strong> Bio, profile photo, community affiliations, and skills.</li>
              <li><strong>Payment information:</strong> Bank account or payout details provided to our payment processor (Stripe). We do not store raw payment card data — Stripe handles all payment data per PCI-DSS standards.</li>
              <li><strong>Community and contribution data:</strong> Posts, tasks, contributions, reputation scores, and community membership details.</li>
              <li><strong>Communications:</strong> Messages, support requests, and feedback you send to us.</li>
            </ul>

            <h3 className="text-base font-semibold mt-4 mb-2">2.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li><strong>Usage data:</strong> Pages visited, features used, clicks, and session duration.</li>
              <li><strong>Device and browser information:</strong> IP address, browser type, operating system, device identifiers.</li>
              <li><strong>Analytics data:</strong> Collected via PostHog (see Section 5 and our cookie consent notice).</li>
              <li><strong>Log data:</strong> Server logs, error reports, and performance metrics.</li>
            </ul>

            <h3 className="text-base font-semibold mt-4 mb-2">2.3 Information from Third Parties</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li><strong>OAuth providers:</strong> If you sign in via a third-party provider (e.g., GitHub, Google), we receive basic profile data (name, email) from that provider per your permissions.</li>
              <li><strong>Payment processors:</strong> Stripe may share transaction confirmation and fraud-signal data with us.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li><strong>Provide the Service:</strong> Create and maintain your account, process contributions, calculate payouts, and facilitate community matching.</li>
              <li><strong>Process payments:</strong> Calculate and execute earnings payouts via Stripe. Processing fees apply as described in our Terms of Service.</li>
              <li><strong>Send communications:</strong> Transactional emails (payout confirmations, account alerts), product updates, and marketing communications (with your consent).</li>
              <li><strong>Improve the platform:</strong> Analyze usage patterns, debug issues, and develop new features.</li>
              <li><strong>Ensure safety and compliance:</strong> Detect fraud, enforce our Terms of Service, and comply with legal obligations.</li>
              <li><strong>Community matching:</strong> Use profile and contribution data to surface relevant communities and contributors.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Legal Basis for Processing (GDPR)</h2>
            <p className="mb-3">For users in the European Economic Area (EEA) and United Kingdom, we process your personal data under the following legal bases:</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Purpose</th>
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Legal Basis</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2">Providing the Service, processing payments</td>
                    <td className="border border-gray-200 px-3 py-2">Performance of a contract (Art. 6(1)(b))</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2">Analytics and product improvement</td>
                    <td className="border border-gray-200 px-3 py-2">Legitimate interests (Art. 6(1)(f)) — or consent where required</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2">Marketing communications</td>
                    <td className="border border-gray-200 px-3 py-2">Consent (Art. 6(1)(a))</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2">Fraud detection, legal compliance</td>
                    <td className="border border-gray-200 px-3 py-2">Legal obligation / Legitimate interests</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Cookies and Tracking</h2>
            <p className="mb-3">We use cookies and similar technologies to operate the Service and understand how you use it.</p>

            <h3 className="text-base font-semibold mb-2">Cookie Types</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Type</th>
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Purpose</th>
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Examples</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2 font-medium">Strictly Necessary</td>
                    <td className="border border-gray-200 px-3 py-2">Authentication, security, session state</td>
                    <td className="border border-gray-200 px-3 py-2">Session cookies, CSRF tokens</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2 font-medium">Analytics</td>
                    <td className="border border-gray-200 px-3 py-2">Usage analytics, error tracking</td>
                    <td className="border border-gray-200 px-3 py-2">PostHog</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-gray-700"><strong>Strictly necessary cookies</strong> are required for the Service to function and cannot be declined.</p>
            <p className="mt-2 text-gray-700"><strong>Analytics cookies</strong> are only set after you accept via our cookie consent banner. You can withdraw consent at any time by clicking &ldquo;Cookie Preferences&rdquo; in the site footer.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Third-Party Processors</h2>
            <p className="mb-3">We share data with the following trusted processors:</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Processor</th>
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Purpose</th>
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Data Shared</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Stripe', 'Payment processing and payouts', 'Name, bank/payout details, transaction data'],
                    ['Railway', 'Infrastructure hosting', 'All user data (hosted environment)'],
                    ['Vercel', 'Frontend hosting and CDN', 'IP addresses, request logs'],
                    ['PostHog', 'Product analytics (with your consent)', 'Usage events, device info'],
                    ['Email provider', 'Transactional and product emails', 'Name, email address'],
                  ].map(([processor, purpose, data]) => (
                    <tr key={processor}>
                      <td className="border border-gray-200 px-3 py-2 font-medium">{processor}</td>
                      <td className="border border-gray-200 px-3 py-2">{purpose}</td>
                      <td className="border border-gray-200 px-3 py-2">{data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-gray-700">We do not sell your personal data to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Data Retention</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Data Category</th>
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Retention Period</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Account and profile data', 'Active account lifetime + 90 days after deletion'],
                    ['Transaction and payout records', '7 years (tax/legal compliance)'],
                    ['Analytics data', '12 months rolling window'],
                    ['Support communications', '2 years'],
                    ['Server logs', '30 days'],
                  ].map(([cat, period]) => (
                    <tr key={cat}>
                      <td className="border border-gray-200 px-3 py-2">{cat}</td>
                      <td className="border border-gray-200 px-3 py-2">{period}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-gray-700">After retention periods expire, data is deleted or anonymized.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Your Rights</h2>

            <h3 className="text-base font-semibold mb-2">GDPR Rights (EEA/UK Users)</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Rectification:</strong> Correct inaccurate or incomplete data.</li>
              <li><strong>Erasure:</strong> Request deletion of your personal data, subject to our legal retention obligations.</li>
              <li><strong>Restriction:</strong> Ask us to limit processing of your data in certain circumstances.</li>
              <li><strong>Data Portability:</strong> Receive your data in a structured, machine-readable format.</li>
              <li><strong>Object:</strong> Object to processing based on legitimate interests, including direct marketing.</li>
              <li><strong>Withdraw Consent:</strong> Withdraw analytics or marketing consent at any time.</li>
            </ul>
            <p className="mt-3 text-gray-700">To exercise these rights, email us at <a href="mailto:privacy@sphere.app" className="text-indigo-600 hover:underline">privacy@sphere.app</a>. We will respond within 30 days.</p>

            <h3 className="text-base font-semibold mt-4 mb-2">CCPA Rights (California Residents)</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li><strong>Know:</strong> What categories of personal information we collect, use, disclose, and sell.</li>
              <li><strong>Delete:</strong> Request deletion of personal information we have collected.</li>
              <li><strong>Opt-Out:</strong> We do not sell personal information.</li>
              <li><strong>Non-Discrimination:</strong> We will not discriminate against you for exercising your privacy rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Data Security</h2>
            <p className="text-gray-700">We implement industry-standard security measures including encryption in transit (TLS) and at rest, access controls and least-privilege principles, regular security reviews, and incident response procedures.</p>
            <p className="mt-2 text-gray-700">If you believe your account has been compromised, contact us immediately at <a href="mailto:security@sphere.app" className="text-indigo-600 hover:underline">security@sphere.app</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Children&apos;s Privacy</h2>
            <p className="text-gray-700">The Service is not directed to individuals under 16. We do not knowingly collect personal data from children under 16. If you become aware that a child has provided us with personal information, contact us and we will delete it.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. International Data Transfers</h2>
            <p className="text-gray-700">Your data may be processed in the United States and other countries. For EEA/UK users, transfers outside the EEA/UK are made under appropriate safeguards (EU Standard Contractual Clauses or equivalent).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Changes to This Policy</h2>
            <p className="text-gray-700">We may update this Privacy Policy periodically. We will notify you of material changes via email or a prominent notice on the platform. Continued use after the effective date constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">13. Contact Us</h2>
            <p className="text-gray-700">For privacy questions, rights requests, or complaints:</p>
            <ul className="mt-2 space-y-1 text-gray-700">
              <li><strong>Privacy Contact:</strong> <a href="mailto:privacy@sphere.app" className="text-indigo-600 hover:underline">privacy@sphere.app</a></li>
              <li><strong>Mailing Address:</strong> [Company Legal Name, Address]</li>
            </ul>
          </section>

          <p className="text-xs text-gray-400 border-t border-gray-100 pt-6">
            This document is a draft prepared by the Sphere Product team. It should be reviewed by qualified legal counsel before publication.
          </p>
        </div>
      </main>

      <footer className="border-t border-gray-100 py-6 px-5 md:px-10 mt-12">
        <div className="max-w-3xl mx-auto flex gap-4 text-sm text-gray-400">
          <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
          <Link href="/privacy" className="text-gray-700 font-medium">Privacy Policy</Link>
          <a href="mailto:privacy@sphere.app" className="hover:text-gray-600 transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );
}
