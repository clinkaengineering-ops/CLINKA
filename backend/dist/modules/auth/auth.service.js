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
exports.requestEmailChange = requestEmailChange;
exports.confirmEmailChange = confirmEmailChange;
exports.changePassword = changePassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const db_1 = __importDefault(require("../../config/db"));
const generateToken_1 = __importDefault(require("../../utils/generateToken"));
const sendVerificationEmail_1 = require("../../utils/sendVerificationEmail");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mailer_1 = __importDefault(require("../../config/mailer"));
const emailTemplate_1 = require("../../utils/emailTemplate");
const redis_1 = require("../../config/redis");
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
    const { name, email, password, specialty, bio, nationality } = data;
    const existingUser = await db_1.default.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new ApiError_1.default(400, "Email already in use");
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const profileData = {
        specialty,
        bio,
        nationality,
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
    // const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp = process.env.FIXED_OTP ??
        Math.floor(100000 + Math.random() * 900000).toString();
    await (0, redis_1.cacheSet)(`otp:${user.id}`, otp, 600);
    console.log(`OTP cached for user ${user.id} (10 min TTL)`);
    // send to email
    try {
        const info = await mailer_1.default.sendMail({
            from: (0, emailTemplate_1.getEmailFrom)(),
            to: email,
            subject: "Your CLINKA login code",
            html: (0, emailTemplate_1.loginOtpEmailHtml)(otp),
        });
        console.log("OTP email sent:", info.messageId, info.accepted);
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
    const storedOtp = await (0, redis_1.cacheGet)(`otp:${userId}`);
    if (!storedOtp)
        throw new ApiError_1.default(400, "OTP expired or not found");
    if (storedOtp !== otp)
        throw new ApiError_1.default(400, "Invalid OTP");
    await (0, redis_1.cacheDel)(`otp:${userId}`);
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
        const info = await mailer_1.default.sendMail({
            from: (0, emailTemplate_1.getEmailFrom)(),
            to: email,
            subject: "Reset your CLINKA password",
            html: (0, emailTemplate_1.passwordResetEmailHtml)(resetUrl),
        });
        console.log("Reset email sent:", info.messageId, info.accepted);
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
async function requestEmailChange(userId, newEmail) {
    const user = await db_1.default.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new ApiError_1.default(404, "User not found");
    if (user.email === newEmail) {
        throw new ApiError_1.default(400, "New email is the same as your current email");
    }
    const taken = await db_1.default.user.findUnique({ where: { email: newEmail } });
    if (taken)
        throw new ApiError_1.default(400, "Email already in use");
    const otp = process.env.FIXED_OTP ??
        Math.floor(100000 + Math.random() * 900000).toString();
    await (0, redis_1.cacheSet)(`email-change:${userId}`, JSON.stringify({ newEmail, otp }), 600);
    try {
        await mailer_1.default.sendMail({
            from: (0, emailTemplate_1.getEmailFrom)(),
            to: newEmail,
            subject: "Confirm your new CLINKA email",
            html: (0, emailTemplate_1.emailChangeOtpHtml)(otp),
        });
    }
    catch (error) {
        console.warn("Failed to send email-change OTP:", error);
        console.warn(`OTP for ${newEmail}: ${otp}`);
    }
    return { message: "Verification code sent to your new email address" };
}
async function confirmEmailChange(userId, otp) {
    const raw = await (0, redis_1.cacheGet)(`email-change:${userId}`);
    if (!raw)
        throw new ApiError_1.default(400, "OTP expired or not found");
    const { newEmail, otp: storedOtp } = JSON.parse(raw);
    if (storedOtp !== otp)
        throw new ApiError_1.default(400, "Invalid OTP");
    await (0, redis_1.cacheDel)(`email-change:${userId}`);
    const updated = await db_1.default.user.update({
        where: { id: userId },
        data: { email: newEmail },
    });
    const { password: _, ...safe } = updated;
    return safe;
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
