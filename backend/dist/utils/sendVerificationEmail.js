"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationEmail = sendVerificationEmail;
const mailer_1 = __importDefault(require("../config/mailer"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
async function sendVerificationEmail(userId, email) {
    const token = jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1d" });
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
    try {
        const info = await mailer_1.default.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Verify your email",
            html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email. Link expires in 24 hours.</p>`,
        });
        console.log("Verification email sent:", info.messageId, info.accepted);
    }
    catch (error) {
        // Log email error but don't fail the registration
        console.warn("Failed to send verification email:", error instanceof Error ? error.message : "Unknown error");
        console.warn(`Verification link: ${verifyUrl}`);
    }
}
