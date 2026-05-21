"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmEmailChangeSchema = exports.requestEmailChangeSchema = exports.changePasswordSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.engineerRegisterSchema = exports.clientRegisterSchema = void 0;
const zod_1 = require("zod");
exports.clientRegisterSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required"),
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters long"),
});
exports.engineerRegisterSchema = exports.clientRegisterSchema.extend({
    specialty: zod_1.z.enum(["CIVIL", "ARCHITECTURAL"]),
    bio: zod_1.z.string().optional(),
    documentType: zod_1.z.enum(["collegeIdUrl", "certificateUrl", "syndicateCardUrl"]),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters long"),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, "Token is required"),
    newPassword: zod_1.z.string().min(8, "Password must be at least 8 characters long"),
});
exports.changePasswordSchema = zod_1.z.object({
    oldPassword: zod_1.z.string().min(8),
    newPassword: zod_1.z.string().min(8),
});
exports.requestEmailChangeSchema = zod_1.z.object({
    newEmail: zod_1.z.string().email("Invalid email address"),
});
exports.confirmEmailChangeSchema = zod_1.z.object({
    otp: zod_1.z.string().length(6, "OTP must be 6 digits"),
});
