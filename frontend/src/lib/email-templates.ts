/**
 * Email templates for SuvrenHOA transactional emails.
 * All templates return { subject, html, text } for use with sendEmail().
 */

const BRAND_COLOR = '#B09B71';
const BG_COLOR = '#0C0C0E';
const CARD_BG = '#151518';
const TEXT_COLOR = '#F5F0E8';
const MUTED_COLOR = '#999';

function layout(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:${BG_COLOR};font-family:'Inter',system-ui,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <!-- Logo -->
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-family:Georgia,serif;font-size:24px;color:${BRAND_COLOR};letter-spacing:1px;">SuvrenHOA</span>
    </div>
    <!-- Content card -->
    <div style="background-color:${CARD_BG};border-radius:16px;padding:32px;border:1px solid rgba(245,240,232,0.06);">
      ${content}
    </div>
    <!-- Footer -->
    <div style="text-align:center;margin-top:24px;padding:16px;">
      <p style="font-size:12px;color:${MUTED_COLOR};margin:0;">
        &copy; ${new Date().getFullYear()} Suvren LLC &middot; Patent Pending &middot; Built on Base
      </p>
      <p style="font-size:11px;color:${MUTED_COLOR};margin:8px 0 0;">
        You received this email because you are a member of a SuvrenHOA community.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function button(text: string, href: string): string {
  return `<div style="text-align:center;margin:24px 0;">
    <a href="${href}" style="display:inline-block;background-color:${BRAND_COLOR};color:${BG_COLOR};text-decoration:none;padding:12px 32px;border-radius:12px;font-size:14px;font-weight:600;">${text}</a>
  </div>`;
}

// ── Welcome Email ───────────────────────────────────────────────────────────

export function welcomeEmail(params: {
  recipientName: string;
  communityName: string;
  dashboardUrl: string;
}) {
  const { recipientName, communityName, dashboardUrl } = params;

  const html = layout(`
    <h1 style="font-family:Georgia,serif;font-size:22px;color:${TEXT_COLOR};margin:0 0 8px;">Welcome to ${communityName}</h1>
    <p style="font-size:14px;color:${MUTED_COLOR};line-height:1.6;margin:0 0 20px;">
      Hi ${recipientName}, your account has been set up and you're ready to participate in your community's governance.
    </p>
    <div style="background-color:rgba(176,155,113,0.08);border-radius:12px;padding:20px;margin:0 0 20px;">
      <p style="font-size:13px;color:${TEXT_COLOR};margin:0 0 12px;font-weight:600;">Here's what you can do:</p>
      <ul style="font-size:13px;color:${MUTED_COLOR};line-height:2;margin:0;padding-left:20px;">
        <li>Complete your profile</li>
        <li>Connect your governance wallet</li>
        <li>Vote on community proposals</li>
        <li>View the transparent treasury</li>
      </ul>
    </div>
    ${button('Go to Dashboard', dashboardUrl)}
    <p style="font-size:12px;color:${MUTED_COLOR};text-align:center;margin:0;">
      If you didn't expect this invitation, you can safely ignore this email.
    </p>
  `);

  return {
    subject: `Welcome to ${communityName} on SuvrenHOA`,
    html,
    text: `Welcome to ${communityName}, ${recipientName}! Visit your dashboard: ${dashboardUrl}`,
  };
}

// ── NFT Assignment Notification ─────────────────────────────────────────────

export function nftAssignmentEmail(params: {
  recipientName: string;
  communityName: string;
  lotNumber: number;
  dashboardUrl: string;
}) {
  const { recipientName, communityName, lotNumber, dashboardUrl } = params;

  const html = layout(`
    <h1 style="font-family:Georgia,serif;font-size:22px;color:${TEXT_COLOR};margin:0 0 8px;">Property Assigned</h1>
    <p style="font-size:14px;color:${MUTED_COLOR};line-height:1.6;margin:0 0 20px;">
      Hi ${recipientName}, your property has been assigned to your account in ${communityName}.
    </p>
    <div style="background-color:rgba(42,93,79,0.10);border:1px solid rgba(42,93,79,0.20);border-radius:12px;padding:20px;text-align:center;margin:0 0 20px;">
      <p style="font-size:12px;color:${MUTED_COLOR};text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Your Property</p>
      <p style="font-family:Georgia,serif;font-size:28px;color:${BRAND_COLOR};margin:0;">Lot #${lotNumber}</p>
      <p style="font-size:12px;color:#3A7D6F;margin:8px 0 0;">Property NFT Minted</p>
    </div>
    <p style="font-size:13px;color:${MUTED_COLOR};line-height:1.6;margin:0 0 16px;">
      Your property NFT has been minted to your wallet. This soulbound token represents your ownership
      and grants you voting rights in community governance.
    </p>
    ${button('View Your Property', dashboardUrl)}
  `);

  return {
    subject: `Property Lot #${lotNumber} assigned — ${communityName}`,
    html,
    text: `Hi ${recipientName}, Lot #${lotNumber} has been assigned to your account in ${communityName}. View it at: ${dashboardUrl}`,
  };
}

// ── New Proposal Notification ───────────────────────────────────────────────

export function newProposalEmail(params: {
  recipientName: string;
  communityName: string;
  proposalTitle: string;
  proposalDescription: string;
  proposalUrl: string;
  votingDeadline?: string;
}) {
  const { recipientName, communityName, proposalTitle, proposalDescription, proposalUrl, votingDeadline } = params;

  const deadlineHtml = votingDeadline
    ? `<p style="font-size:12px;color:${BRAND_COLOR};margin:12px 0 0;">Voting ends: ${votingDeadline}</p>`
    : '';

  const html = layout(`
    <h1 style="font-family:Georgia,serif;font-size:22px;color:${TEXT_COLOR};margin:0 0 8px;">New Proposal</h1>
    <p style="font-size:14px;color:${MUTED_COLOR};line-height:1.6;margin:0 0 20px;">
      Hi ${recipientName}, a new proposal has been submitted in ${communityName} that needs your vote.
    </p>
    <div style="background-color:rgba(90,122,154,0.08);border:1px solid rgba(90,122,154,0.15);border-radius:12px;padding:20px;margin:0 0 20px;">
      <p style="font-size:16px;color:${TEXT_COLOR};font-weight:600;margin:0 0 8px;">${proposalTitle}</p>
      <p style="font-size:13px;color:${MUTED_COLOR};line-height:1.5;margin:0;">
        ${proposalDescription.slice(0, 200)}${proposalDescription.length > 200 ? '...' : ''}
      </p>
      ${deadlineHtml}
    </div>
    ${button('Review & Vote', proposalUrl)}
    <p style="font-size:12px;color:${MUTED_COLOR};text-align:center;margin:0;">
      Every vote matters. Your voice shapes the community.
    </p>
  `);

  return {
    subject: `New Proposal: ${proposalTitle} — ${communityName}`,
    html,
    text: `New proposal in ${communityName}: "${proposalTitle}" — ${proposalDescription.slice(0, 200)}. Vote now: ${proposalUrl}`,
  };
}
