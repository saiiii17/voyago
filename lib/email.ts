import { Resend } from "resend";

const FROM = process.env.RESEND_FROM_EMAIL ?? "Voyago <onboarding@resend.dev>";

function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

/** Email notifications are a nice-to-have, not core — any failure here is
 * logged and swallowed so it never blocks the join/approve flow itself. */
async function safeSend(params: { to: string; subject: string; html: string }) {
  const resend = getClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping email:", params.subject);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: params.to, subject: params.subject, html: params.html });
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}

export async function sendJoinRequestEmail(params: {
  to: string;
  tripName: string;
  requesterName: string;
  tripUrl: string;
}) {
  await safeSend({
    to: params.to,
    subject: `${params.requesterName} wants to join ${params.tripName}`,
    html: `
      <p><strong>${params.requesterName}</strong> requested to join <strong>${params.tripName}</strong>.</p>
      <p><a href="${params.tripUrl}">Review the request</a></p>
    `,
  });
}

export async function sendJoinApprovedEmail(params: { to: string; tripName: string; tripUrl: string }) {
  await safeSend({
    to: params.to,
    subject: `You're in! ${params.tripName}`,
    html: `
      <p>You've been approved to join <strong>${params.tripName}</strong>.</p>
      <p><a href="${params.tripUrl}">Open the trip</a></p>
    `,
  });
}
