import { z } from "zod";

const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "12345678",
  "123456789",
  "qwerty123",
  "letmein1",
]);

export const emailField = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address")
  .transform((v) => v.toLowerCase());

/** Login — only ensure something was entered. */
export const loginPasswordField = z
  .string()
  .min(1, "Password is required")
  .max(128, "Password must be at most 128 characters");

export const PASSWORD_RULES = {
  MIN_LENGTH: 8,
  UPPERCASE: /[A-Z]/,
  LOWERCASE: /[a-z]/,
  NUMBER: /[0-9]/,
  SPECIAL: /[^A-Za-z0-9]/,
};

export const passwordField = z
  .string()
  .min(PASSWORD_RULES.MIN_LENGTH, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(PASSWORD_RULES.UPPERCASE, "Include at least one uppercase letter")
  .regex(PASSWORD_RULES.LOWERCASE, "Include at least one lowercase letter")
  .regex(PASSWORD_RULES.NUMBER, "Include at least one number")
  .regex(PASSWORD_RULES.SPECIAL, "Include at least one special character")
  .refine(
    (v) => !COMMON_PASSWORDS.has(v.toLowerCase()),
    "Choose a less common password",
  );

export const nameField = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be at most 100 characters")
  .regex(
    /^[\p{L}\p{M}'\-\s.]+$/u,
    "Name can only contain letters, spaces, hyphens, and apostrophes",
  );

export const otpField = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit verification code");

export const optionalBioField = z
  .string()
  .trim()
  .max(2000, "Bio must be at most 2000 characters")
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

export const nationalityField = z
  .string()
  .trim()
  .min(1, "Select your nationality");

export const projectTitleField = z
  .string()
  .trim()
  .min(3, "Title must be at least 3 characters")
  .max(100, "Title must be at most 100 characters");

export const projectDescriptionField = z
  .string()
  .trim()
  .min(10, "Description must be at least 10 characters")
  .max(500, "Description must be at most 500 characters");

export const budgetField = z.coerce
  .number({ error: "Budget must be a number" })
  .positive("Budget must be greater than 0")
  .max(100_000_000, "Budget is too large");

export const serviceTypeField = z.enum(["DESIGN", "SUPERVISION", "REVIEW"], {
  error: "Select a valid service type",
});

export const bidPriceField = z.coerce
  .number({ error: "Price must be a number" })
  .positive("Bid amount must be greater than 0")
  .max(100_000_000, "Bid amount is too large");

export const bidWeeksField = z.coerce
  .number({ error: "Enter delivery weeks as a number" })
  .int("Weeks must be a whole number")
  .min(1, "Delivery must be at least 1 week")
  .max(52, "Delivery cannot exceed 52 weeks");

export const bidDescriptionField = z
  .string()
  .trim()
  .min(10, "Cover letter must be at least 10 characters")
  .max(500, "Cover letter must be at most 500 characters");

export const messageContentField = z
  .string()
  .trim()
  .min(1, "Message cannot be empty")
  .max(5000, "Message must be at most 5000 characters");

export const reviewRatingField = z.coerce
  .number()
  .int("Rating must be a whole number")
  .min(1, "Select a rating from 1 to 5")
  .max(5, "Select a rating from 1 to 5");

export const reviewCommentField = z
  .string()
  .trim()
  .max(1000, "Review must be at most 1000 characters")
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

export const phoneField = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s\-()]/g, ""))
  .pipe(
    z
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .max(15, "Phone number must be at most 15 digits")
      .regex(/^\+?[0-9]+$/, "Enter a valid phone number"),
  );

export const addressField = z
  .string()
  .trim()
  .min(3, "Address must be at least 3 characters")
  .max(200, "Address must be at most 200 characters");

export const portfolioDescriptionField = z
  .string()
  .trim()
  .min(3, "Description must be at least 3 characters")
  .max(500, "Description must be at most 500 characters");

export const subjectField = z
  .string()
  .trim()
  .min(3, "Subject must be at least 3 characters")
  .max(200, "Subject must be at most 200 characters");

export const supportMessageField = z
  .string()
  .trim()
  .min(10, "Message must be at least 10 characters")
  .max(5000, "Message must be at most 5000 characters");

export const revisionNoteField = z
  .string()
  .trim()
  .min(10, "Revision note must be at least 10 characters")
  .max(2000, "Revision note must be at most 2000 characters");

export const urlField = z
  .string()
  .trim()
  .url("Enter a valid URL")
  .max(2048, "URL is too long");

export const optionalUrlField = z
  .string()
  .trim()
  .max(2048, "URL is too long")
  .optional()
  .refine((v) => !v || /^https?:\/\/.+/i.test(v), "Enter a valid URL starting with http:// or https://")
  .transform((v) => (v && v.length > 0 ? v : undefined));

export const linkNameField = z
  .string()
  .trim()
  .min(1, "Link label is required")
  .max(100, "Link label must be at most 100 characters");

export const nationalIdField = z
  .string()
  .trim()
  .regex(/^\d{14}$/, "National ID must be exactly 14 digits");

export const adminIdentifierField = z
  .string()
  .trim()
  .min(1, "Enter a user ID or email address");

export const adminSolutionField = z
  .string()
  .trim()
  .min(10, "Solution must be at least 10 characters")
  .max(5000, "Solution must be at most 5000 characters");

export const feePercentField = z.coerce
  .number({ error: "Enter a valid percentage" })
  .min(0, "Fee cannot be negative")
  .max(100, "Fee cannot exceed 100%");
