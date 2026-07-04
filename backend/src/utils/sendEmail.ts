import fs from "fs";
import path from "path";
import transporter from "../config/mailer";
import { getEmailFrom, getLogoUrl, EMAIL_LOGO_CID } from "./emailTemplate";

let logoBuffer: Buffer | null = null;

function resolveLogoPath(): string | null {
  const candidates = [
    process.env.EMAIL_LOGO_PATH,
    path.resolve(process.cwd(), "assets/clinka-logo.png"),
    path.resolve(process.cwd(), "../frontend/public/brand/logo/PNG/logo-09.png"),
    path.resolve(process.cwd(), "frontend/public/brand/logo/PNG/logo-09.png"),
    path.resolve(__dirname, "../../assets/clinka-logo.png"),
    path.resolve(__dirname, "../../../frontend/public/brand/logo/PNG/logo-09.png"),
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

async function getLogoAttachment() {
  if (!logoBuffer) {
    const logoPath = resolveLogoPath();
    if (!logoPath) {
      return null;
    }
    logoBuffer = fs.readFileSync(logoPath);
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

  const logoAttachment = await getLogoAttachment();
  const html = logoAttachment
    ? options.html.split(getLogoUrl()).join(`cid:${EMAIL_LOGO_CID}`)
    : options.html;

  await transporter.sendMail({
    from: getEmailFrom(),
    to: options.to,
    replyTo: replyTo || undefined,
    subject: options.subject,
    html,
    text: options.text,
    attachments: logoAttachment ? [logoAttachment] : undefined,
    headers: {
      "X-Auto-Response-Suppress": "All",
      "X-Entity-Ref-ID": `clinka-${Date.now()}`,
    },
  });
}
