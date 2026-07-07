"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nationalIdField = exports.revisionNoteField = exports.supportMessageField = exports.subjectField = exports.addressField = exports.phoneField = exports.reviewCommentField = exports.reviewRatingField = exports.messageContentField = exports.bidDescriptionField = exports.bidDurationField = exports.bidPriceField = exports.serviceTypeField = exports.budgetField = exports.projectDescriptionField = exports.projectTitleField = exports.nationalityField = exports.optionalBioField = exports.otpField = exports.nameField = exports.passwordField = exports.loginPasswordField = exports.emailField = void 0;
const zod_1 = require("zod");
const COMMON_PASSWORDS = new Set([
    "password",
    "password1",
    "password123",
    "12345678",
    "123456789",
    "qwerty123",
    "letmein1",
]);
exports.emailField = zod_1.z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address")
    .transform((v) => v.toLowerCase());
exports.loginPasswordField = zod_1.z
    .string()
    .min(1, "Password is required")
    .max(128, "Password must be at most 128 characters");
exports.passwordField = zod_1.z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/[a-z]/, "Include at least one lowercase letter")
    .regex(/[0-9]/, "Include at least one number")
    .regex(/[^A-Za-z0-9]/, "Include at least one special character")
    .refine((v) => !COMMON_PASSWORDS.has(v.toLowerCase()), "Choose a less common password");
exports.nameField = zod_1.z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .regex(/^[\p{L}\p{M}'\-\s.]+$/u, "Name can only contain letters, spaces, hyphens, and apostrophes");
exports.otpField = zod_1.z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit verification code");
exports.optionalBioField = zod_1.z
    .string()
    .trim()
    .max(2000, "Bio must be at most 2000 characters")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));
exports.nationalityField = zod_1.z
    .string()
    .trim()
    .min(1, "Nationality is required");
exports.projectTitleField = zod_1.z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be at most 100 characters");
exports.projectDescriptionField = zod_1.z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be at most 500 characters");
exports.budgetField = zod_1.z
    .number({ error: "Budget must be a number" })
    .positive("Budget must be greater than 0")
    .max(100000000, "Budget is too large");
exports.serviceTypeField = zod_1.z.enum(["DESIGN", "SUPERVISION", "REVIEW"], {
    error: "Select a valid service type",
});
exports.bidPriceField = zod_1.z
    .number({ error: "Price must be a number" })
    .positive("Bid amount must be greater than 0")
    .max(100000000, "Bid amount is too large");
exports.bidDurationField = zod_1.z
    .string()
    .trim()
    .min(1, "Delivery time is required")
    .max(20, "Delivery time label is too long");
exports.bidDescriptionField = zod_1.z
    .string()
    .trim()
    .min(10, "Cover letter must be at least 10 characters")
    .max(500, "Cover letter must be at most 500 characters");
exports.messageContentField = zod_1.z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(5000, "Message must be at most 5000 characters");
exports.reviewRatingField = zod_1.z
    .number()
    .int("Rating must be a whole number")
    .min(1, "Select a rating from 1 to 5")
    .max(5, "Select a rating from 1 to 5");
exports.reviewCommentField = zod_1.z
    .string()
    .trim()
    .max(1000, "Review must be at most 1000 characters")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));
exports.phoneField = zod_1.z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s\-()]/g, ""))
    .pipe(zod_1.z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be at most 15 digits")
    .regex(/^\+?[0-9]+$/, "Enter a valid phone number"));
exports.addressField = zod_1.z
    .string()
    .trim()
    .min(3, "Address must be at least 3 characters")
    .max(200, "Address must be at most 200 characters");
exports.subjectField = zod_1.z
    .string()
    .trim()
    .min(3, "Subject must be at least 3 characters")
    .max(200, "Subject must be at most 200 characters");
exports.supportMessageField = zod_1.z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message must be at most 5000 characters");
exports.revisionNoteField = zod_1.z
    .string()
    .trim()
    .min(10, "Revision note must be at least 10 characters")
    .max(2000, "Revision note must be at most 2000 characters");
exports.nationalIdField = zod_1.z
    .string()
    .trim()
    .regex(/^\d{14}$/, "National ID must be exactly 14 digits");
