import { getPublicClientUrl } from "../config/clientUrl";

const BRAND = {
  teal: "#196481",
  tealDark: "#145268",
  copper: "#C97A51",
  ice: "#F2F7F9",
  white: "#ffffff",
  text: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
} as const;

export const EMAIL_LOGO_CID = "clinka-logo@clinka";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function getLogoUrl(): string {
  return "https://res.cloudinary.com/dczhvcc0v/image/upload/v1782741323/brand/logo-09.png";
}

export function getEmailFrom(): string {
  const address = process.env.EMAIL_USER?.trim();
  if (!address) return "CLINKA";
  return `CLINKA <${address}>`;
}

function emailButton(label: string, href: string): string {
  const safeLabel = escapeHtml(label);
  const safeHref = escapeHtml(href);
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
      <tr>
        <td align="center" style="border-radius:8px;background-color:${BRAND.teal};">
          <a href="${safeHref}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;font-weight:600;color:${BRAND.white};text-decoration:none;border-radius:8px;">
            ${safeLabel}
          </a>
        </td>
      </tr>
    </table>`;
}

function emailOtpBox(otp: string): string {
  const safeOtp = escapeHtml(otp);
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td align="center" style="padding:24px;background-color:${BRAND.ice};border:2px dashed ${BRAND.teal};border-radius:12px;">
          <span style="font-family:Consolas,Monaco,monospace;font-size:36px;font-weight:700;letter-spacing:10px;color:${BRAND.teal};">
            ${safeOtp}
          </span>
        </td>
      </tr>
    </table>`;
}

type BuildEmailOptions = {
  title: string;
  preheader?: string;
  contentHtml: string;
  cta?: { label: string; href: string };
};

export function buildEmailHtml(options: BuildEmailOptions): string {
  const { title, preheader, contentHtml, cta } = options;
  const safeTitle = escapeHtml(title);
  const safePreheader = preheader ? escapeHtml(preheader) : safeTitle;
  const siteUrl = escapeHtml(getPublicClientUrl());
  const year = new Date().getFullYear();
  const ctaHtml = cta ? emailButton(cta.label, cta.href) : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${safeTitle}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .email-content { padding: 24px 20px !important; }
      .email-header { padding: 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.ice};font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${safePreheader}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.ice};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${BRAND.white};border-radius:12px;overflow:hidden;border:1px solid ${BRAND.border};">
          <tr>
            <td style="height:4px;background-color:${BRAND.teal};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td class="email-header" align="center" style="padding:28px 32px 20px;background-color:${BRAND.white};border-bottom:1px solid ${BRAND.border};">
              <a href="${siteUrl}" target="_blank" style="text-decoration:none;">
                <img src="cid:${EMAIL_LOGO_CID}" alt="CLINKA — Civil Link Architecture" width="200" style="display:block;margin:0 auto;max-width:200px;height:auto;border:0;" />
              </a>
            </td>
          </tr>
          <tr>
            <td class="email-content" style="padding:32px 40px;color:${BRAND.text};font-size:16px;line-height:1.6;">
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${BRAND.teal};line-height:1.3;">
                ${safeTitle}
              </h1>
              ${contentHtml}
              ${ctaHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background-color:${BRAND.ice};border-top:1px solid ${BRAND.border};text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:${BRAND.muted};">
                Civil Link Architecture
              </p>
              <p style="margin:0;font-size:12px;color:${BRAND.muted};">
                &copy; ${year} CLINKA. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function verificationEmailHtml(verifyUrl: string): string {
  return buildEmailHtml({
    title: "Verify your email",
    preheader: "Confirm your CLINKA account to get started.",
    contentHtml: `
      <p style="margin:0 0 16px;color:${BRAND.text};">
        Welcome to CLINKA! Please confirm your email address to activate your account and start connecting with engineers and clients.
      </p>
      <p style="margin:0;color:${BRAND.muted};font-size:14px;">
        This link expires in <strong style="color:${BRAND.text};">24 hours</strong>. If you did not create an account, you can safely ignore this email.
      </p>`,
    cta: { label: "Verify Email Address", href: verifyUrl },
  });
}

export function loginOtpEmailHtml(otp: string): string {
  return buildEmailHtml({
    title: "Your login code",
    preheader: `Your CLINKA login code is ${otp}`,
    contentHtml: `
      <p style="margin:0 0 8px;color:${BRAND.text};">
        Use the verification code below to sign in to your CLINKA account:
      </p>
      ${emailOtpBox(otp)}
      <p style="margin:0;color:${BRAND.muted};font-size:14px;">
        This code expires in <strong style="color:${BRAND.text};">10 minutes</strong>. Never share it with anyone.
      </p>`,
  });
}

export function passwordResetEmailHtml(resetUrl: string): string {
  return buildEmailHtml({
    title: "Reset your password",
    preheader: "Reset your CLINKA password securely.",
    contentHtml: `
      <p style="margin:0 0 16px;color:${BRAND.text};">
        We received a request to reset the password for your CLINKA account. Click the button below to choose a new password.
      </p>
      <p style="margin:0;color:${BRAND.muted};font-size:14px;">
        This link expires in <strong style="color:${BRAND.text};">15 minutes</strong>. If you did not request a reset, you can safely ignore this email.
      </p>`,
    cta: { label: "Reset Password", href: resetUrl },
  });
}

export function emailChangeOtpHtml(otp: string): string {
  return buildEmailHtml({
    title: "Confirm your new email",
    preheader: `Confirm your new CLINKA email with code ${otp}`,
    contentHtml: `
      <p style="margin:0 0 8px;color:${BRAND.text};">
        Enter this verification code in your account settings to confirm your new email address:
      </p>
      ${emailOtpBox(otp)}
      <p style="margin:0;color:${BRAND.muted};font-size:14px;">
        This code expires in <strong style="color:${BRAND.text};">10 minutes</strong>.
      </p>`,
  });
}

export function withdrawalNotificationEmailHtml(input: {
  engineerName: string;
  engineerEmail: string;
  amount: string;
  method: string;
  accountNumber: string;
  requestDate: string;
}): string {
  const row = (label: string, value: string) =>
    `<tr>
      <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.muted};font-size:14px;width:40%;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.text};font-size:14px;font-weight:600;vertical-align:top;">${escapeHtml(value)}</td>
    </tr>`;

  return buildEmailHtml({
    title: "New withdrawal request",
    preheader: `Withdrawal request for ${input.amount} from ${input.engineerName}`,
    contentHtml: `
      <p style="margin:0 0 20px;color:${BRAND.text};">
        An engineer has submitted a new withdrawal request. Review the details below in the admin dashboard.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0;">
        ${row("Engineer", input.engineerName)}
        ${row("Email", input.engineerEmail)}
        ${row("Amount", input.amount)}
        ${row("Method", input.method)}
        ${row("Account number", input.accountNumber)}
        ${row("Request date", input.requestDate)}
      </table>`,
  });
}
