/**
 * Email Service
 *
 * Sends transactional emails via Resend when RESEND_API_KEY is configured.
 * Falls back to nodemailer SMTP when SMTP_HOST is configured.
 * Falls back to structured console.log for local dev / CI.
 *
 * Required env vars for Resend delivery:
 *   RESEND_API_KEY
 *   EMAIL_FROM (default noreply@sphereapp.co)
 *   APP_BASE_URL (default http://localhost:3000)
 *
 * Required env vars for SMTP fallback:
 *   SMTP_HOST, SMTP_PORT (default 587), SMTP_USER, SMTP_PASS
 */

import { Resend } from 'resend';
import nodemailer from 'nodemailer';

const FROM = process.env.EMAIL_FROM ?? 'Sphere <noreply@sphereapp.co>';
const BASE_URL = process.env.APP_BASE_URL ?? 'http://localhost:3000';

// ─────────────────────────────────────────────────────────────────────────────
// Transport abstraction
// ─────────────────────────────────────────────────────────────────────────────

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) throw new Error(`Resend error: ${error.message}`);
    return;
  }

  if (process.env.SMTP_HOST) {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transport.sendMail({ from: FROM, to, subject, html });
    return;
  }

  // Dev fallback — log to console
  console.log('[email:stub]', JSON.stringify({ to, subject, preview: html.slice(0, 200) }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared layout wrapper
// ─────────────────────────────────────────────────────────────────────────────

function layout(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <tr>
          <td style="background:#6366f1;padding:24px 32px">
            <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px">Sphere</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            ${body}
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 20px"/>
            <p style="color:#9ca3af;font-size:12px;line-height:1.5;margin:0">
              You're receiving this email because of your Sphere account.
              Visit <a href="${BASE_URL}/settings" style="color:#6366f1">settings</a> to manage notifications.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(href: string, label: string): string {
  return `<p style="margin:28px 0">
    <a href="${href}" style="background:#6366f1;color:#ffffff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">${label}</a>
  </p>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Template 1: Signup confirmation / email verification
// ─────────────────────────────────────────────────────────────────────────────

export async function sendSignupConfirmationEmail(opts: {
  to: string;
  name: string;
  role: 'brand' | 'community_owner';
  verificationToken: string;
}): Promise<void> {
  const { to, name, role, verificationToken } = opts;
  const path = role === 'brand' ? '/brand/verify-email' : '/community/verify-email';
  const url = `${BASE_URL}${path}?token=${verificationToken}`;
  const roleLabel = role === 'brand' ? 'brand' : 'community';
  const subject = 'Confirm your Sphere email address';
  const html = layout(`
    <h2 style="color:#111827;margin:0 0 16px;font-size:22px">Welcome to Sphere, ${name}!</h2>
    <p style="color:#374151;line-height:1.6">Thanks for signing up as a ${roleLabel} on Sphere — the marketplace that connects brands with engaged online communities.</p>
    <p style="color:#374151;line-height:1.6">Please confirm your email address to activate your account:</p>
    ${btn(url, 'Confirm email address')}
    <p style="color:#6b7280;font-size:13px">This link expires in 24 hours. If you didn't create a Sphere account, you can safely ignore this email.</p>
  `);
  await sendEmail(to, subject, html);
}

// ─────────────────────────────────────────────────────────────────────────────
// Template 2: Beta invite
// ─────────────────────────────────────────────────────────────────────────────

export async function sendBetaInviteEmail(opts: {
  to: string;
  name: string;
  role: 'brand' | 'community_owner';
  inviteCode?: string;
  personalNote?: string;
}): Promise<void> {
  const { to, name, role, inviteCode, personalNote } = opts;
  const path = role === 'brand' ? '/brand/register' : '/community/register';
  const url = inviteCode
    ? `${BASE_URL}${path}?invite=${inviteCode}`
    : `${BASE_URL}${path}`;
  const roleLabel = role === 'brand' ? 'brand' : 'community owner';
  const subject = `You're invited to Sphere Beta — exclusive early access`;
  const html = layout(`
    <h2 style="color:#111827;margin:0 0 16px;font-size:22px">You're invited to Sphere 🎉</h2>
    <p style="color:#374151;line-height:1.6">Hi ${name},</p>
    ${personalNote ? `<p style="color:#374151;line-height:1.6">${personalNote}</p>` : ''}
    <p style="color:#374151;line-height:1.6">
      We've selected you as one of our Wave 1 ${roleLabel}s on <strong>Sphere</strong> — the AI-powered marketplace
      that connects brands with high-engagement online communities.
    </p>
    <p style="color:#374151;line-height:1.6">
      As a beta participant you'll get:
    </p>
    <ul style="color:#374151;line-height:1.8;padding-left:20px">
      <li>Early access before public launch</li>
      <li>Direct input on product direction</li>
      <li>Preferred rates locked for life</li>
    </ul>
    ${inviteCode ? `<p style="color:#374151;line-height:1.6">Your invite code: <strong style="background:#f3f4f6;padding:4px 8px;border-radius:4px;font-family:monospace">${inviteCode}</strong></p>` : ''}
    ${btn(url, 'Claim your beta spot')}
    <p style="color:#6b7280;font-size:13px">Spots are limited. This invite expires in 7 days.</p>
  `);
  await sendEmail(to, subject, html);
}

// ─────────────────────────────────────────────────────────────────────────────
// Template 3a: Match notification — brand
// ─────────────────────────────────────────────────────────────────────────────

export async function sendBrandMatchNotificationEmail(opts: {
  brandEmail: string;
  brandName: string;
  campaignTitle: string;
  campaignId: string;
  matchCount: number;
}): Promise<void> {
  const { brandEmail, brandName, campaignTitle, campaignId, matchCount } = opts;
  const url = `${BASE_URL}/brand/campaigns/${campaignId}`;
  const subject = `Your campaign "${campaignTitle}" has ${matchCount} new communit${matchCount === 1 ? 'y' : 'ies'} ready to partner`;
  const html = layout(`
    <h2 style="color:#111827;margin:0 0 16px;font-size:22px">You have a match, ${brandName}! 🎉</h2>
    <p style="color:#374151;line-height:1.6">
      Your campaign <strong>${campaignTitle}</strong> has been matched with
      <strong>${matchCount} communit${matchCount === 1 ? 'y' : 'ies'}</strong> on Sphere.
    </p>
    <p style="color:#374151;line-height:1.6">Community owners are ready to partner with your brand. Review the matches and start your first collaboration.</p>
    ${btn(url, 'View matches')}
  `);
  await sendEmail(brandEmail, subject, html);
}

// ─────────────────────────────────────────────────────────────────────────────
// Template 3b: Match notification — community owner
// ─────────────────────────────────────────────────────────────────────────────

export async function sendCommunityMatchNotificationEmail(opts: {
  ownerEmail: string;
  ownerName: string;
  communityName: string;
  brandName: string;
  campaignTitle: string;
  campaignId: string;
}): Promise<void> {
  const { ownerEmail, ownerName, communityName, brandName, campaignTitle, campaignId } = opts;
  const url = `${BASE_URL}/community/opportunities`;
  const subject = `${brandName} matched with ${communityName} on Sphere`;
  const html = layout(`
    <h2 style="color:#111827;margin:0 0 16px;font-size:22px">New match for ${communityName}!</h2>
    <p style="color:#374151;line-height:1.6">Hi ${ownerName},</p>
    <p style="color:#374151;line-height:1.6">
      <strong>${brandName}</strong> is running a campaign called <strong>"${campaignTitle}"</strong>
      and Sphere's AI has matched your community as a top fit.
    </p>
    <p style="color:#374151;line-height:1.6">Review their campaign brief and decide whether to express interest.</p>
    ${btn(url, 'View opportunity')}
  `);
  await sendEmail(ownerEmail, subject, html);
}

// ─────────────────────────────────────────────────────────────────────────────
// Template 4: Deal accepted / declined
// ─────────────────────────────────────────────────────────────────────────────

export async function sendDealStatusEmail(opts: {
  to: string;
  recipientName: string;
  role: 'brand' | 'community_owner';
  campaignTitle: string;
  communityName: string;
  dealId: string;
  status: 'accepted' | 'declined';
  note?: string;
}): Promise<void> {
  const { to, recipientName, role, campaignTitle, communityName, dealId, status, note } = opts;
  const path = role === 'brand' ? `/brand/deals/${dealId}` : `/community/deals/${dealId}`;
  const url = `${BASE_URL}${path}`;
  const accepted = status === 'accepted';
  const subject = accepted
    ? `Deal accepted: ${communityName} × ${campaignTitle}`
    : `Deal declined: ${communityName} × ${campaignTitle}`;
  const html = layout(`
    <h2 style="color:#111827;margin:0 0 16px;font-size:22px">
      ${accepted ? '✅ Deal accepted' : '❌ Deal declined'}
    </h2>
    <p style="color:#374151;line-height:1.6">Hi ${recipientName},</p>
    <p style="color:#374151;line-height:1.6">
      The deal between <strong>${communityName}</strong> and the campaign <strong>"${campaignTitle}"</strong>
      has been <strong>${status}</strong>.
    </p>
    ${note ? `<p style="color:#374151;line-height:1.6;background:#f9fafb;padding:12px 16px;border-radius:6px;border-left:3px solid #6366f1">${note}</p>` : ''}
    ${accepted ? btn(url, 'View deal') : ''}
    ${!accepted ? `<p style="color:#6b7280;font-size:13px">You can browse other opportunities on Sphere at any time.</p>` : ''}
  `);
  await sendEmail(to, subject, html);
}

// ─────────────────────────────────────────────────────────────────────────────
// Template 5: Content submission — brand notified when community submits content
// ─────────────────────────────────────────────────────────────────────────────

export async function sendContentSubmissionEmail(opts: {
  brandEmail: string;
  brandName: string;
  communityName: string;
  campaignTitle: string;
  dealId: string;
  submissionId: string;
}): Promise<void> {
  const { brandEmail, brandName, communityName, campaignTitle, dealId, submissionId } = opts;
  const url = `${BASE_URL}/brand/deals/${dealId}/content/${submissionId}`;
  const subject = `${communityName} submitted content for "${campaignTitle}"`;
  const html = layout(`
    <h2 style="color:#111827;margin:0 0 16px;font-size:22px">Content submitted for review</h2>
    <p style="color:#374151;line-height:1.6">Hi ${brandName},</p>
    <p style="color:#374151;line-height:1.6">
      <strong>${communityName}</strong> has submitted content for your campaign <strong>"${campaignTitle}"</strong>.
      Please review it and either approve it or request changes.
    </p>
    ${btn(url, 'Review content')}
    <p style="color:#6b7280;font-size:13px">Content must be approved before it can be posted to the community's channel.</p>
  `);
  await sendEmail(brandEmail, subject, html);
}

// ─────────────────────────────────────────────────────────────────────────────
// Template 6: Content approved — community notified, payout triggered
// ─────────────────────────────────────────────────────────────────────────────

export async function sendContentApprovedEmail(opts: {
  ownerEmail: string;
  ownerName: string;
  communityName: string;
  campaignTitle: string;
  dealId: string;
  autoApproved?: boolean;
}): Promise<void> {
  const { ownerEmail, ownerName, communityName, campaignTitle, dealId, autoApproved = false } = opts;
  const url = `${BASE_URL}/community/deals/${dealId}`;
  const subject = autoApproved
    ? `Content auto-approved for "${campaignTitle}" — you're good to post!`
    : `Content approved for "${campaignTitle}" — you're good to post!`;
  const html = layout(`
    <h2 style="color:#111827;margin:0 0 16px;font-size:22px">
      Content ${autoApproved ? 'auto-' : ''}approved ✅
    </h2>
    <p style="color:#374151;line-height:1.6">Hi ${ownerName},</p>
    <p style="color:#374151;line-height:1.6">
      ${autoApproved
        ? `Your content for the <strong>"${campaignTitle}"</strong> campaign has been <strong>automatically approved</strong> — no further review needed.`
        : `The brand has approved your content for the <strong>"${campaignTitle}"</strong> campaign.`
      }
    </p>
    <p style="color:#374151;line-height:1.6">
      You can now post it to <strong>${communityName}</strong>. Once posted and confirmed by the brand, your payout will be released.
    </p>
    ${btn(url, 'View deal & post content')}
  `);
  await sendEmail(ownerEmail, subject, html);
}

// ─────────────────────────────────────────────────────────────────────────────
// Template 7: Payout sent — community owner notified
// ─────────────────────────────────────────────────────────────────────────────

export async function sendPayoutSentEmail(opts: {
  ownerEmail: string;
  ownerName: string;
  communityName: string;
  campaignTitle: string;
  payoutCents: number;
  dealId: string;
  transferId?: string;
}): Promise<void> {
  const { ownerEmail, ownerName, communityName, campaignTitle, payoutCents, dealId, transferId } = opts;
  const url = `${BASE_URL}/community/deals/${dealId}`;
  const payoutFormatted = (payoutCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const subject = `Your payout of ${payoutFormatted} has been sent`;
  const html = layout(`
    <h2 style="color:#111827;margin:0 0 16px;font-size:22px">Payout sent 💸</h2>
    <p style="color:#374151;line-height:1.6">Hi ${ownerName},</p>
    <p style="color:#374151;line-height:1.6">
      Great work! Your payout for the <strong>"${campaignTitle}"</strong> collaboration with <strong>${communityName}</strong> has been dispatched.
    </p>
    <table style="background:#f3f4f6;border-radius:6px;padding:16px 20px;width:100%;border-collapse:collapse;margin:16px 0">
      <tr>
        <td style="color:#374151;font-size:14px;padding:4px 0">Amount</td>
        <td style="color:#111827;font-weight:700;font-size:18px;text-align:right">${payoutFormatted}</td>
      </tr>
      ${transferId ? `<tr><td style="color:#6b7280;font-size:12px;padding:4px 0">Transfer ID</td><td style="color:#6b7280;font-size:12px;text-align:right;font-family:monospace">${transferId}</td></tr>` : ''}
    </table>
    <p style="color:#374151;line-height:1.6">Funds are transferred via Stripe and typically arrive within 2–5 business days depending on your bank.</p>
    ${btn(url, 'View deal summary')}
  `);
  await sendEmail(ownerEmail, subject, html);
}

// ─────────────────────────────────────────────────────────────────────────────
// Template 8: Password reset
// ─────────────────────────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(opts: {
  to: string;
  name: string;
  role: 'brand' | 'community_owner';
  resetToken: string;
}): Promise<void> {
  const { to, name, role, resetToken } = opts;
  const path = role === 'brand' ? '/brand/reset-password' : '/community/reset-password';
  const url = `${BASE_URL}${path}?token=${resetToken}`;
  const subject = 'Reset your Sphere password';
  const html = layout(`
    <h2 style="color:#111827;margin:0 0 16px;font-size:22px">Reset your password</h2>
    <p style="color:#374151;line-height:1.6">Hi ${name},</p>
    <p style="color:#374151;line-height:1.6">
      We received a request to reset the password for your Sphere account. Click the button below to choose a new password:
    </p>
    ${btn(url, 'Reset password')}
    <p style="color:#6b7280;font-size:13px">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password will not change.</p>
  `);
  await sendEmail(to, subject, html);
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy compatibility helpers (kept for existing call sites)
// ─────────────────────────────────────────────────────────────────────────────

/** @deprecated Use sendBrandMatchNotificationEmail */
export async function sendBrandFirstMatchEmail(opts: {
  brandEmail: string;
  brandName: string;
  campaignTitle: string;
  campaignId: string;
  matchCount: number;
}): Promise<void> {
  return sendBrandMatchNotificationEmail(opts);
}

/** @deprecated Use sendCommunityMatchNotificationEmail */
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
  const html = layout(`
    <h2 style="color:#111827;margin:0 0 16px;font-size:22px">New brand on Sphere — potential match for ${communityName}</h2>
    <p style="color:#374151;line-height:1.6">Hi ${ownerName},</p>
    <p style="color:#374151;line-height:1.6">
      <strong>${brandName}</strong> just joined Sphere and is looking for community partners${nicheLabel}.
      They've identified <strong>${communityName}</strong> as a strong match for their campaign.
    </p>
    ${btn(url, 'View Campaign Opportunity')}
  `);
  await sendEmail(ownerEmail, subject, html);
}

/** @deprecated Use sendCommunityMatchNotificationEmail */
export async function sendCommunityOwnerFirstOpportunityEmail(opts: {
  ownerEmail: string;
  ownerName: string;
  communityName: string;
  campaignTitle: string;
  brandName: string;
  requestId: string;
}): Promise<void> {
  const { ownerEmail, ownerName, communityName, campaignTitle, brandName } = opts;
  const url = `${BASE_URL}/community/opportunities`;
  const subject = `${brandName} wants to collaborate with ${communityName}!`;
  const html = layout(`
    <h2 style="color:#111827;margin:0 0 16px;font-size:22px">New opportunity for ${communityName}!</h2>
    <p style="color:#374151;line-height:1.6">Hi ${ownerName},</p>
    <p style="color:#374151;line-height:1.6">
      <strong>${brandName}</strong> is running a campaign called <strong>"${campaignTitle}"</strong>
      and has identified your community as a great fit.
    </p>
    ${btn(url, 'View Opportunity')}
  `);
  await sendEmail(ownerEmail, subject, html);
}
