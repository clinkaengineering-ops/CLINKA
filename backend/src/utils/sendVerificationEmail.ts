import jwt from "jsonwebtoken";
import { getPublicClientUrl } from "../config/clientUrl";
import { sendBrandedEmail } from "./sendEmail";
import { verificationEmailHtml } from "./emailTemplate";

export async function sendVerificationEmail(userId: number, email: string) {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: "1d" });

  const verifyUrl = `${getPublicClientUrl()}/verify-email?token=${token}`;

  try {
    await sendBrandedEmail({
      to: email,
      subject: "Confirm your CLINKA account",
      html: verificationEmailHtml(verifyUrl),
      text: [
        "Welcome to CLINKA!",
        "",
        "Please confirm your email address to activate your account:",
        verifyUrl,
        "",
        "This link expires in 24 hours.",
        "",
        "If you did not create an account, you can ignore this email.",
        "",
        "— CLINKA",
      ].join("\n"),
    });
    console.log("Verification email sent to:", email);
  } catch (error) {
    console.warn(
      "Failed to send verification email:",
      error instanceof Error ? error.message : "Unknown error",
    );
    console.warn(`Verification link: ${verifyUrl}`);
  }
}
