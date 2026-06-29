import bcrypt from "bcryptjs";
import ApiError from "../../utils/ApiError";
import {
  clientRegisterInput,
  engineerRegisterInput,
  loginInput,
} from "./auth.validation";
import db from "../../config/db";
import generateToken from "../../utils/generateToken";
import { sendVerificationEmail } from "../../utils/sendVerificationEmail";
import jwt from "jsonwebtoken";
import {
  emailChangeOtpHtml,
  loginOtpEmailHtml,
  passwordResetEmailHtml,
} from "../../utils/emailTemplate";
import { getPublicClientUrl } from "../../config/clientUrl";
import { sendBrandedEmail } from "../../utils/sendEmail";
import { cacheDel, cacheGet, cacheSet } from "../../config/redis";

function stripPassword<T extends { password: string }>({ password: _, ...safe }: T) {
  return safe;
}

export async function checkRegistrationEmail(email: string) {
  const normalized = email.toLowerCase().trim();
  const user = await db.user.findUnique({
    where: { email: normalized },
    include: {
      profile: { include: { portfolio: { select: { id: true } } } },
    },
  });

  if (!user) {
    return { status: "available" as const };
  }

  if (
    user.role === "ENGINEER" &&
    user.profile?.verificationStatus === "PENDING" &&
    (user.profile.portfolio?.length ?? 0) < 3
  ) {
    return {
      status: "resume_engineer" as const,
      portfolioCount: user.profile.portfolio.length,
    };
  }

  return { status: "exists" as const, role: user.role };
}

export async function registerClient(data: clientRegisterInput) {
  const { name, email, password } = data;

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ApiError(400, "Email already in use");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "CLIENT",
      isVerified: false,
    },
  });

  void sendVerificationEmail(user.id, user.email).catch(() => undefined);
  return stripPassword(user);
}

export async function registerEngineer(
  data: engineerRegisterInput,
  fileUrl: string,
  documentType: "collegeIdUrl" | "certificateUrl" | "syndicateCardUrl",
  portfolioUrls: string[] = [],
) {
  const { name, email, password, specialty, bio, nationality } = data;

  if (portfolioUrls.length < 3) {
    throw new ApiError(400, "Upload at least 3 portfolio work samples");
  }

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ApiError(400, "Email already in use");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "ENGINEER",
      isVerified: false,
      profile: {
        create: {
          specialty,
          bio,
          nationality,
          [documentType]: fileUrl,
          portfolio: {
            create: portfolioUrls.map((imageUrl, index) => ({
              imageUrl,
              description: `Portfolio work ${index + 1}`,
            })),
          },
        },
      },
    },
    include: { profile: true },
  });

  void sendVerificationEmail(user.id, user.email).catch(() => undefined);
  return stripPassword(user);
}

export async function resumeEngineerRegistration(
  data: clientRegisterInput,
  portfolioUrls: string[],
) {
  const { email, password } = data;

  if (portfolioUrls.length < 3) {
    throw new ApiError(400, "Upload at least 3 portfolio work samples");
  }

  const user = await db.user.findUnique({
    where: { email },
    include: {
      profile: { include: { portfolio: { select: { id: true } } } },
    },
  });

  if (!user || user.role !== "ENGINEER" || !user.profile) {
    throw new ApiError(404, "No incomplete engineer registration found for this email");
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    throw new ApiError(400, "Incorrect password for this account");
  }

  const existingCount = user.profile.portfolio.length;
  if (existingCount >= 3) {
    throw new ApiError(400, "This engineer account is already complete. Sign in instead.");
  }

  const needed = 3 - existingCount;
  if (portfolioUrls.length < needed) {
    throw new ApiError(
      400,
      `Upload at least ${needed} more portfolio work sample${needed === 1 ? "" : "s"}`,
    );
  }

  await db.portfolioItem.createMany({
    data: portfolioUrls.slice(0, needed).map((imageUrl, index) => ({
      engineerId: user.profile!.id,
      imageUrl,
      description: `Portfolio work ${existingCount + index + 1}`,
    })),
  });

  const refreshed = await db.user.findUnique({
    where: { id: user.id },
    include: { profile: true },
  });
  if (!refreshed) throw new ApiError(404, "User not found");

  if (!refreshed.isVerified) {
    void sendVerificationEmail(refreshed.id, refreshed.email).catch(() => undefined);
  }

  return stripPassword(refreshed);
}

// Step 1 — validate credentials, send OTP
export async function login(data: loginInput) {
  const { email, password } = data;

  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(400, "Invalid email or password");

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new ApiError(400, "Invalid email or password");
  if (!user.isVerified) {
    throw new ApiError(403, "Please verify your email before logging in");
  }

  // generate 6 digit OTP
  // const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otp =
    process.env.FIXED_OTP ??
    Math.floor(100000 + Math.random() * 900000).toString();

  await cacheSet(`otp:${user.id}`, otp, 600);
  console.log(`OTP cached for user ${user.id} (10 min TTL)`);

  // send to email
  try {
    await sendBrandedEmail({
      to: email,
      subject: "Your CLINKA sign-in code",
      html: loginOtpEmailHtml(otp),
      text: [
        "Your CLINKA sign-in code",
        "",
        otp,
        "",
        "This code expires in 10 minutes. Never share it with anyone.",
        "",
        "— CLINKA",
      ].join("\n"),
    });
    console.log("OTP email sent to:", email);
  } catch (error) {
    // Log email error but don't fail the login
    console.warn(
      "Failed to send OTP email:",
      error instanceof Error ? error.message : "Unknown error",
    );
    console.warn(`OTP for ${email}: ${otp}`);
  }

  return { message: "OTP sent to your email", userId: user.id };
}

// Step 2 — verify OTP, set cookie
export async function verifyOtp(userId: number, otp: string) {
  const storedOtp = await cacheGet(`otp:${userId}`);

  if (!storedOtp) throw new ApiError(400, "OTP expired or not found");
  if (storedOtp !== otp) throw new ApiError(400, "Invalid OTP");

  await cacheDel(`otp:${userId}`);

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  const token = generateToken(user.id, user.role);
  const { password: _, ...userWithoutPassword } = user;

  return { token, user: userWithoutPassword };
}

export async function verifyEmail(token: string) {
  const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
    userId: number;
  };

  const user = await db.user.findUnique({ where: { id: payload.userId } });
  if (!user) throw new ApiError(404, "User not found");

  if (!user.isVerified) {
    await db.user.update({
      where: { id: payload.userId },
      data: { isVerified: true },
    });
  }

  const sessionToken = generateToken(user.id, user.role);
  return { token: sessionToken, userId: user.id };
}

export async function forgotPassword(email: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(404, "No account found with this email");

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET as string,
    { expiresIn: "15m" },
  );

  const resetUrl = `${getPublicClientUrl()}/reset-password?token=${token}`;

  try {
    await sendBrandedEmail({
      to: email,
      subject: "Reset your CLINKA password",
      html: passwordResetEmailHtml(resetUrl),
      text: [
        "We received a request to reset your CLINKA password.",
        "",
        resetUrl,
        "",
        "This link expires in 15 minutes.",
        "",
        "If you did not request this, you can ignore this email.",
        "",
        "— CLINKA",
      ].join("\n"),
    });
    console.log("Reset email sent to:", email);
  } catch (error) {
    // Log email error but don't fail the request
    console.warn(
      "Failed to send password reset email:",
      error instanceof Error ? error.message : "Unknown error",
    );
    console.warn(`Password reset link: ${resetUrl}`);
  }
}

export async function resetPassword(token: string, newPassword: string) {
  const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
    userId: number;
  };

  const hashed = await bcrypt.hash(newPassword, 10);

  await db.user.update({
    where: { id: payload.userId },
    data: { password: hashed },
  });
}

export async function resendVerificationEmail(userId: number, email: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");
  if (user.isVerified) throw new ApiError(400, "Email already verified");

  await sendVerificationEmail(userId, email);
}

export async function requestEmailChange(userId: number, newEmail: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");
  if (user.email === newEmail) {
    throw new ApiError(400, "New email is the same as your current email");
  }

  const taken = await db.user.findUnique({ where: { email: newEmail } });
  if (taken) throw new ApiError(400, "Email already in use");

  const otp =
    process.env.FIXED_OTP ??
    Math.floor(100000 + Math.random() * 900000).toString();

  await cacheSet(
    `email-change:${userId}`,
    JSON.stringify({ newEmail, otp }),
    600,
  );

  try {
    await sendBrandedEmail({
      to: newEmail,
      subject: "Confirm your new CLINKA email",
      html: emailChangeOtpHtml(otp),
      text: [
        "Confirm your new CLINKA email address with this code:",
        "",
        otp,
        "",
        "This code expires in 10 minutes.",
        "",
        "— CLINKA",
      ].join("\n"),
    });
  } catch (error) {
    console.warn("Failed to send email-change OTP:", error);
    console.warn(`OTP for ${newEmail}: ${otp}`);
  }

  return { message: "Verification code sent to your new email address" };
}

export async function confirmEmailChange(userId: number, otp: string) {
  const raw = await cacheGet(`email-change:${userId}`);
  if (!raw) throw new ApiError(400, "OTP expired or not found");

  const { newEmail, otp: storedOtp } = JSON.parse(raw) as {
    newEmail: string;
    otp: string;
  };
  if (storedOtp !== otp) throw new ApiError(400, "Invalid OTP");

  await cacheDel(`email-change:${userId}`);

  const updated = await db.user.update({
    where: { id: userId },
    data: { email: newEmail },
  });
  const { password: _, ...safe } = updated;
  return safe;
}

export async function changePassword(
  userId: number,
  oldPassword: string,
  newPassword: string,
) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) throw new ApiError(401, "Old password is incorrect");

  const hashed = await bcrypt.hash(newPassword, 10);
  await db.user.update({
    where: { id: userId },
    data: { password: hashed },
  });
}
