"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerClient = registerClient;
exports.registerEngineer = registerEngineer;
exports.login = login;
exports.verifyOtp = verifyOtp;
exports.verifyEmail = verifyEmail;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
exports.resendVerificationEmail = resendVerificationEmail;
exports.changePassword = changePassword;
exports.getMe = getMe;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const db_1 = __importDefault(require("../../config/db"));
const generateToken_1 = __importDefault(require("../../utils/generateToken"));
const sendVerificationEmail_1 = require("../../utils/sendVerificationEmail");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mailer_1 = __importDefault(require("../../config/mailer"));
const redis_1 = __importDefault(require("../../config/redis"));
async function registerClient(data) {
    const { name, email, password } = data;
    const existingUser = await db_1.default.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new ApiError_1.default(400, "Email already in use");
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const user = await db_1.default.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: "CLIENT",
        },
    });
    const { password: _, ...userWithoutPassword } = user;
    await (0, sendVerificationEmail_1.sendVerificationEmail)(user.id, user.email);
    return userWithoutPassword;
}
async function registerEngineer(data, fileUrl, documentType) {
    const { name, email, password, specialty, bio } = data;
    const existingUser = await db_1.default.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new ApiError_1.default(400, "Email already in use");
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const profileData = {
        specialty,
        bio,
        [documentType]: fileUrl,
    };
    const user = await db_1.default.user.create({
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
    await (0, sendVerificationEmail_1.sendVerificationEmail)(user.id, user.email);
    return userWithoutPassword;
}
// Step 1 — validate credentials, send OTP
async function login(data) {
    const { email, password } = data;
    const user = await db_1.default.user.findUnique({ where: { email } });
    if (!user)
        throw new ApiError_1.default(400, "Invalid email or password");
    const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
    if (!isPasswordValid)
        throw new ApiError_1.default(400, "Invalid email or password");
    if (!user.isVerified) {
        throw new ApiError_1.default(403, "Please verify your email before logging in");
    }
    // generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // store in Redis with 10 min expiry
    await redis_1.default.set(`otp:${user.id}`, otp, "EX", 600);
    const otpTtl = await redis_1.default.ttl(`otp:${user.id}`);
    console.log(`OTP cached in Redis for user ${user.id} with TTL ${otpTtl}s`);
    // send to email
    try {
        await mailer_1.default.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your login verification code",
            html: `<p>Your verification code is: <strong>${otp}</strong>. Expires in 10 minutes.</p>`,
        });
    }
    catch (error) {
        // Log email error but don't fail the login
        console.warn("Failed to send OTP email:", error instanceof Error ? error.message : "Unknown error");
        console.warn(`OTP for ${email}: ${otp}`);
    }
    return { message: "OTP sent to your email", userId: user.id };
}
// Step 2 — verify OTP, set cookie
async function verifyOtp(userId, otp) {
    const storedOtp = await redis_1.default.get(`otp:${userId}`);
    if (!storedOtp)
        throw new ApiError_1.default(400, "OTP expired or not found");
    if (storedOtp !== otp)
        throw new ApiError_1.default(400, "Invalid OTP");
    // delete OTP after use — one time only
    await redis_1.default.del(`otp:${userId}`);
    const user = await db_1.default.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new ApiError_1.default(404, "User not found");
    const token = (0, generateToken_1.default)(user.id, user.role);
    const { password: _, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
}
async function verifyEmail(token) {
    const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    await db_1.default.user.update({
        where: { id: payload.userId },
        data: { isVerified: true },
    });
}
async function forgotPassword(email) {
    const user = await db_1.default.user.findUnique({ where: { email } });
    if (!user)
        throw new ApiError_1.default(404, "No account found with this email");
    const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    try {
        await mailer_1.default.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Reset your password",
            html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 15 minutes.</p>`,
        });
    }
    catch (error) {
        // Log email error but don't fail the request
        console.warn("Failed to send password reset email:", error instanceof Error ? error.message : "Unknown error");
        console.warn(`Password reset link: ${resetUrl}`);
    }
}
async function resetPassword(token, newPassword) {
    const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    const hashed = await bcryptjs_1.default.hash(newPassword, 10);
    await db_1.default.user.update({
        where: { id: payload.userId },
        data: { password: hashed },
    });
}
async function resendVerificationEmail(userId, email) {
    const user = await db_1.default.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new ApiError_1.default(404, "User not found");
    if (user.isVerified)
        throw new ApiError_1.default(400, "Email already verified");
    await (0, sendVerificationEmail_1.sendVerificationEmail)(userId, email);
}
async function changePassword(userId, oldPassword, newPassword) {
    const user = await db_1.default.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new ApiError_1.default(404, "User not found");
    const isMatch = await bcryptjs_1.default.compare(oldPassword, user.password);
    if (!isMatch)
        throw new ApiError_1.default(401, "Old password is incorrect");
    const hashed = await bcryptjs_1.default.hash(newPassword, 10);
    await db_1.default.user.update({
        where: { id: userId },
        data: { password: hashed },
    });
}
async function getMe(userId) {
    const user = await db_1.default.user.findUnique({
        where: { id: userId },
        include: { profile: true },
    });
    if (!user)
        throw new ApiError_1.default(404, "User not found");
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
}
