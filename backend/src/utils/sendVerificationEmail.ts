import transporter from "../config/mailer";
import jwt from "jsonwebtoken";

export async function sendVerificationEmail(userId: number, email: string) {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: "1d" });

  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify your email",
      html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email. Link expires in 24 hours.</p>`,
    });
    console.log("Verification email sent:", info.messageId, info.accepted);
  } catch (error) {
    // Log email error but don't fail the registration
    console.warn("Failed to send verification email:", error instanceof Error ? error.message : "Unknown error");
    console.warn(`Verification link: ${verifyUrl}`);
  }
}