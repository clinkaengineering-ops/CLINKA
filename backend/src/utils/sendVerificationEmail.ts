import transporter from "../config/mailer";
import jwt from "jsonwebtoken";
import { getPublicClientUrl } from "../config/clientUrl";
import { getEmailFrom, verificationEmailHtml } from "./emailTemplate";

export async function sendVerificationEmail(userId: number, email: string) {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: "1d" });

  const verifyUrl = `${getPublicClientUrl()}/verify-email?token=${token}`;

  try {
    const info = await transporter.sendMail({
      from: getEmailFrom(),
      to: email,
      subject: "Verify your CLINKA email",
      html: verificationEmailHtml(verifyUrl),
    });
    console.log("Verification email sent:", info.messageId, info.accepted);
  } catch (error) {
    // Log email error but don't fail the registration
    console.warn("Failed to send verification email:", error instanceof Error ? error.message : "Unknown error");
    console.warn(`Verification link: ${verifyUrl}`);
  }
}