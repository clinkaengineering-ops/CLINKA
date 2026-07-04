"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRegistrationEmail = checkRegistrationEmail;
exports.registerClient = registerClient;
exports.registerEngineer = registerEngineer;
exports.resumeEngineerRegistration = resumeEngineerRegistration;
exports.applyClientAsEngineer = applyClientAsEngineer;
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
const clientUrl_1 = require("../../config/clientUrl");
const generateToken_1 = __importDefault(require("../../utils/generateToken"));
const sendVerificationEmail_1 = require("../../utils/sendVerificationEmail");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mailer_1 = __importDefault(require("../../config/mailer"));
const emailTemplate_1 = require("../../utils/emailTemplate");
const redis_1 = require("../../config/redis");
function stripPassword({ password: _, ...safe }) {
    return safe;
}
function issueRegistrationSession(user) {
    const token = (0, generateToken_1.default)(user.id, user.role);
    return { user: stripPassword(user), token };
}
async function checkRegistrationEmail(email) {
    const normalized = email.toLowerCase().trim();
    const user = await db_1.default.user.findUnique({
        where: { email: normalized },
        include: {
            profile: { include: { portfolio: { select: { id: true } } } },
        },
    });
    if (!user) {
        return { status: "available" };
    }
    if (user.role === "ENGINEER" &&
        user.profile?.verificationStatus === "PENDING" &&
        (user.profile.portfolio?.length ?? 0) < 3) {
        return {
            status: "resume_engineer",
            portfolioCount: user.profile.portfolio.length,
        };
    }
    return { status: "exists", role: user.role };
}
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
            isVerified: true,
        },
    });
    void (0, sendVerificationEmail_1.sendVerificationEmail)(user.id, user.email).catch(() => undefined);
    return issueRegistrationSession(user);
}
async function registerEngineer(data, fileUrl, documentType, portfolioUrls = []) {
    const { name, email, password, specialty, bio, nationality } = data;
    if (portfolioUrls.length < 3) {
        throw new ApiError_1.default(400, "Upload at least 3 portfolio work samples");
    }
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
            role: "ENGINEER",
            isVerified: true,
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
    void (0, sendVerificationEmail_1.sendVerificationEmail)(user.id, user.email).catch(() => undefined);
    return issueRegistrationSession(user);
}
async function resumeEngineerRegistration(data, portfolioUrls) {
    const { email, password } = data;
    if (portfolioUrls.length < 3) {
        throw new ApiError_1.default(400, "Upload at least 3 portfolio work samples");
    }
    const user = await db_1.default.user.findUnique({
        where: { email },
        include: {
            profile: { include: { portfolio: { select: { id: true } } } },
        },
    });
    if (!user || user.role !== "ENGINEER" || !user.profile) {
        throw new ApiError_1.default(404, "No incomplete engineer registration found for this email");
    }
    const validPassword = await bcryptjs_1.default.compare(password, user.password);
    if (!validPassword) {
        throw new ApiError_1.default(400, "Incorrect password for this account");
    }
    const existingCount = user.profile.portfolio.length;
    if (existingCount >= 3) {
        throw new ApiError_1.default(400, "This engineer account is already complete. Sign in instead.");
    }
    const needed = 3 - existingCount;
    if (portfolioUrls.length < needed) {
        throw new ApiError_1.default(400, `Upload at least ${needed} more portfolio work sample${needed === 1 ? "" : "s"}`);
    }
    await db_1.default.portfolioItem.createMany({
        data: portfolioUrls.slice(0, needed).map((imageUrl, index) => ({
            engineerId: user.profile.id,
            imageUrl,
            description: `Portfolio work ${existingCount + index + 1}`,
        })),
    });
    const refreshed = await db_1.default.user.update({
        where: { id: user.id },
        data: { isVerified: true },
        include: { profile: true },
    });
    return issueRegistrationSession(refreshed);
}
async function applyClientAsEngineer(userId, data, fileUrl, documentType, portfolioUrls = []) {
    const { specialty, bio, nationality } = data;
    if (portfolioUrls.length < 3) {
        throw new ApiError_1.default(400, "Upload at least 3 portfolio work samples");
    }
    const user = await db_1.default.user.findUnique({
        where: { id: userId },
        include: { profile: { include: { portfolio: true } } },
    });
    if (!user)
        throw new ApiError_1.default(404, "User not found");
    if (user.role === "ENGINEER") {
        throw new ApiError_1.default(400, "You are already an engineer");
    }
    if (user.role === "ADMIN") {
        throw new ApiError_1.default(403, "Admins cannot apply as engineers");
    }
    if (user.profile?.verificationStatus === "PENDING") {
        throw new ApiError_1.default(400, "Your engineer application is already under review");
    }
    const portfolioCreate = portfolioUrls.map((imageUrl, index) => ({
        imageUrl,
        description: `Portfolio work ${index + 1}`,
    }));
    if (user.profile) {
        await db_1.default.portfolioItem.deleteMany({ where: { engineerId: user.profile.id } });
        await db_1.default.engineerProfile.update({
            where: { id: user.profile.id },
            data: {
                specialty,
                bio,
                nationality,
                verificationStatus: "PENDING",
                collegeIdUrl: null,
                certificateUrl: null,
                syndicateCardUrl: null,
                [documentType]: fileUrl,
                portfolio: { create: portfolioCreate },
            },
        });
    }
    else {
        await db_1.default.engineerProfile.create({
            data: {
                userId,
                specialty,
                bio,
                nationality,
                verificationStatus: "PENDING",
                [documentType]: fileUrl,
                portfolio: { create: portfolioCreate },
            },
        });
    }
    const { createNotification } = await Promise.resolve().then(() => __importStar(require("../../utils/notifications")));
    await createNotification(userId, "ENGINEER_APPLICATION_RECEIVED", "Engineer application received", "We are reviewing your documents and portfolio. We will notify you when you are accepted.", "/settings", { force: true });
    const refreshed = await db_1.default.user.findUnique({
        where: { id: userId },
        include: { profile: { include: { portfolio: true } } },
    });
    return stripPassword(refreshed);
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
    const resetUrl = `${(0, clientUrl_1.getPublicClientUrl)()}/reset-password?token=${token}`;
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
