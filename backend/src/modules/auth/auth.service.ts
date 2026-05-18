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
import transporter from "../../config/mailer";
import redis from "../../config/redis";

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
    },
  });

  const { password: _, ...userWithoutPassword } = user;
  await sendVerificationEmail(user.id, user.email);
  return userWithoutPassword;
}

export async function registerEngineer(
  data: engineerRegisterInput,
  fileUrl: string,
  documentType: "collegeIdUrl" | "certificateUrl" | "syndicateCardUrl",
) {
  const { name, email, password, specialty, bio } = data;

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ApiError(400, "Email already in use");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const profileData: any = {
    specialty,
    bio,
    [documentType]: fileUrl,
  };

  const user = await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "ENGINEER",
      profile: {
        create: profileData,
      },
    },
    include: { profile: true },
  });

  const { password: _, ...userWithoutPassword } = user;
  await sendVerificationEmail(user.id, user.email);
  return userWithoutPassword;
}


// Step 1 — validate credentials, send OTP
export async function login(data: loginInput) {
  const { email, password } = data;

  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(400, "Invalid email or password");

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new ApiError(400, "Invalid email or password");
  if (!user.isVerified) {
  throw new ApiError(403, "Please verify your email before logging in")
}

  // generate 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // store in Redis with 10 min expiry
  await redis.set(`otp:${user.id}`, otp, "EX", 600);
  const otpTtl = await redis.ttl(`otp:${user.id}`);
  console.log(`OTP cached in Redis for user ${user.id} with TTL ${otpTtl}s`);

  // send to email
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your login verification code",
      html: `<p>Your verification code is: <strong>${otp}</strong>. Expires in 10 minutes.</p>`,
    });
    console.log("OTP email sent:", info.messageId, info.accepted);
  } catch (error) {
    // Log email error but don't fail the login
    console.warn("Failed to send OTP email:", error instanceof Error ? error.message : "Unknown error");
    console.warn(`OTP for ${email}: ${otp}`);
  }

  return { message: "OTP sent to your email", userId: user.id };
}

// Step 2 — verify OTP, set cookie
export async function verifyOtp(userId: number, otp: string) {
  const storedOtp = await redis.get(`otp:${userId}`);

  if (!storedOtp) throw new ApiError(400, "OTP expired or not found");
  if (storedOtp !== otp) throw new ApiError(400, "Invalid OTP");

  // delete OTP after use — one time only
  await redis.del(`otp:${userId}`);

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

  await db.user.update({
    where: { id: payload.userId },
    data: { isVerified: true },
  });
}

export async function forgotPassword(email: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(404, "No account found with this email");

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET as string,
    { expiresIn: "15m" },
  );

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset your password",
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 15 minutes.</p>`,
    });
    console.log("Reset email sent:", info.messageId, info.accepted);
  } catch (error) {
    // Log email error but don't fail the request
    console.warn("Failed to send password reset email:", error instanceof Error ? error.message : "Unknown error");
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