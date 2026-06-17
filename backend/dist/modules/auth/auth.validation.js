"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmEmailChangeSchema = exports.requestEmailChangeSchema = exports.changePasswordSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.verifyOtpSchema = exports.loginSchema = exports.engineerRegisterSchema = exports.clientRegisterSchema = void 0;
const zod_1 = require("zod");
const fields_1 = require("../../utils/fields");
exports.clientRegisterSchema = zod_1.z.object({
    name: fields_1.nameField,
    email: fields_1.emailField,
    password: fields_1.passwordField,
});
exports.engineerRegisterSchema = exports.clientRegisterSchema.extend({
    specialty: zod_1.z.enum(["CIVIL", "ARCHITECTURAL"], {
        error: "Select civil or architectural specialty",
    }),
    bio: fields_1.optionalBioField,
    nationality: zod_1.z.string().min(1, "Nationality is required"),
    documentType: zod_1.z.enum(["collegeIdUrl", "certificateUrl", "syndicateCardUrl"], {
        error: "Select a document type to upload",
    }),
});
exports.loginSchema = zod_1.z.object({
    email: fields_1.emailField,
    password: fields_1.passwordField,
});
exports.verifyOtpSchema = zod_1.z.object({
    userId: zod_1.z.coerce
        .number({ error: "Invalid session" })
        .int("Invalid session")
        .positive("Invalid session"),
    otp: fields_1.otpField,
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: fields_1.emailField,
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, "Reset link is invalid or expired"),
    newPassword: fields_1.passwordField,
});
exports.changePasswordSchema = zod_1.z
    .object({
    oldPassword: fields_1.passwordField,
    newPassword: fields_1.passwordField,
})
    .refine((data) => data.oldPassword !== data.newPassword, {
    message: "New password must be different from your current password",
    path: ["newPassword"],
});
exports.requestEmailChangeSchema = zod_1.z.object({
    newEmail: fields_1.emailField,
});
exports.confirmEmailChangeSchema = zod_1.z.object({
    otp: fields_1.otpField,
});
