/**
 * Email Service
 *
 * Sends transactional emails via SMTP (nodemailer) when SMTP_HOST is configured.
 * Falls back to structured console.log output for local dev / CI.
 *
 * Required env vars for live delivery:
 *   SMTP_HOST, SMTP_PORT (default 587), SMTP_USER, SMTP_PASS
 *   EMAIL_FROM (default noreply@sphereapp.co)
 *   APP_BASE_URL (default http://localhost:3000)
 */

import nodemailer from 'nodemailer';

const FROM = process.env.EMAIL_FROM ?? 'Sphere <noreply@sphereapp.co>';
const BASE_URL = process.env.APP_BASE_URL ?? 'http://localhost:3000';

function createTransport() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const transport = createTransport();
  if (transport) {
    await transport.sendMail({ from: FROM, to, subject, html });
  } else {
    // Dev fallback — log to console so email content is visible in test/dev logs
    console.log('[email:stub]', JSON.stringify({ to, subject, preview: html.slice(0, 200) }));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification templates
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Notify a brand that their campaign has received its first community match.
 */
export async function sendBrandFirstMatchEmail(opts: {
  brandEmail: string;
  brandName: string;
  campaignTitle: string;
  campaignId: string;
  matchCount: number;
}): Promise<void> {
  const { brandEmail, brandName, campaignTitle, campaignId, matchCount } = opts;
  const url = `${BASE_URL}/brand/campaigns/${campaignId}`;
  const subject = `Your campaign "${campaignTitle}" has its first community match!`;
  const html = `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
  <h2 style="color:#6366f1">You have a match, ${brandName}! 🎉</h2>
  <p>Your campaign <strong>${campaignTitle}</strong> has been matched with
  <strong>${matchCount} communit${matchCount === 1 ? 'y' : 'ies'}</strong> on Sphere.</p>
  <p>Community owners are ready to partner with your brand. Review the matches and start
  your first collaboration.</p>
  <p style="margin:32px 0">
    <a href="${url}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
      View Matches
    </a>
  </p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
  <p style="color:#6b7280;font-size:12px">
    You're receiving this because you signed up as a brand on Sphere.
    <a href="${BASE_URL}/brand/settings">Manage notifications</a>
  </p>
</div>`;
  await sendEmail(brandEmail, subject, html);
}

/**
 * Notify a registered community owner that a new brand is looking for community partners
 * matching their niche. Sent to all matches when a new brand posts their first campaign.
 */
export async function sendBrandAcquisitionNotificationEmail(opts: {
  ownerEmail: string;
  ownerName: string;
  communityName: string;
  brandName: string;
  niche: string | null;
  campaignId: string;
}): Promise<void> {
  const { ownerEmail, ownerName, communityName, brandName, niche, campaignId } = opts;
  const url = `${BASE_URL}/community/opportunities`;
  const nicheLabel = niche ? ` in ${niche}` : '';
  const subject = `${brandName} is looking for community partners${nicheLabel} — is ${communityName} a fit?`;
  const html = `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
  <h2 style="color:#6366f1">New brand on Sphere — potential match for ${communityName}</h2>
  <p>Hi ${ownerName},</p>
  <p><strong>${brandName}</strong> just joined Sphere and is looking for community partners${nicheLabel}.</p>
  <p>They've identified <strong>${communityName}</strong> as a strong match for their campaign.
  View the campaign brief and decide whether you'd like to collaborate.</p>
  <p style="margin:32px 0">
    <a href="${url}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
      View Campaign Opportunity
    </a>
  </p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
  <p style="color:#6b7280;font-size:12px">
    You're receiving this because your community is listed on Sphere.
    <a href="${BASE_URL}/community/settings">Manage notifications</a>
  </p>
</div>`;
  await sendEmail(ownerEmail, subject, html);
}

/**
 * Notify a community owner that they have their first inbound deal opportunity.
 */
export async function sendCommunityOwnerFirstOpportunityEmail(opts: {
  ownerEmail: string;
  ownerName: string;
  communityName: string;
  campaignTitle: string;
  brandName: string;
  requestId: string;
}): Promise<void> {
  const { ownerEmail, ownerName, communityName, campaignTitle, brandName, requestId } = opts;
  const url = `${BASE_URL}/community/opportunities`;
  const subject = `${brandName} wants to collaborate with ${communityName}!`;
  const html = `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
  <h2 style="color:#6366f1">New opportunity for ${communityName}!</h2>
  <p>Hi ${ownerName},</p>
  <p><strong>${brandName}</strong> is running a campaign called <strong>"${campaignTitle}"</strong>
  and has identified your community as a great fit.</p>
  <p>This is your first inbound collaboration opportunity on Sphere. Review the campaign brief
  and decide whether to accept, decline, or send a counter-offer.</p>
  <p style="margin:32px 0">
    <a href="${url}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
      View Opportunity
    </a>
  </p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
  <p style="color:#6b7280;font-size:12px">
    You're receiving this because you registered your community on Sphere.
    <a href="${BASE_URL}/community/settings">Manage notifications</a>
  </p>
</div>`;
  await sendEmail(ownerEmail, subject, html);
}
