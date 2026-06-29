import transporter from "../config/mailer";
import { getEmailFrom, getLogoUrl, EMAIL_LOGO_CID } from "./emailTemplate";

let logoBuffer: Buffer | null = null;

async function getLogoAttachment() {
  if (!logoBuffer) {
    const res = await fetch(getLogoUrl());
    if (!res.ok) {
      throw new Error(`Failed to load email logo (${res.status})`);
    }
    logoBuffer = Buffer.from(await res.arrayBuffer());
  }

  return {
    filename: "clinka-logo.png",
    content: logoBuffer,
    cid: EMAIL_LOGO_CID,
  };
}

export async function sendBrandedEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}) {
  const replyTo =
    process.env.SUPPORT_EMAIL?.trim() || process.env.EMAIL_USER?.trim();

  await transporter.sendMail({
    from: getEmailFrom(),
    to: options.to,
    replyTo: replyTo || undefined,
    subject: options.subject,
    html: options.html,
    text: options.text,
    attachments: [await getLogoAttachment()],
    headers: {
      "X-Auto-Response-Suppress": "All",
      "X-Entity-Ref-ID": `clinka-${Date.now()}`,
    },
  });
}
