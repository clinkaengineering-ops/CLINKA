import { z } from "zod";

export const emailField = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address");

export const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters");

export const nameField = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be at most 100 characters");

export const otpField = z
  .string()
  .trim()
  .length(6, "Enter the 6-digit verification code");

export const optionalBioField = z
  .string()
  .trim()
  .max(2000, "Bio must be at most 2000 characters")
  .optional();

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
  .positive("Bid amount must be greater than 0");

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
  .optional();

export const phoneField = z
  .string()
  .trim()
  .min(10, "Phone number must be at least 10 digits")
  .max(15, "Phone number must be at most 15 digits")
  .regex(/^[0-9+\-\s()]+$/, "Enter a valid phone number");

export const portfolioDescriptionField = z
  .string()
  .trim()
  .min(3, "Description must be at least 3 characters")
  .max(500, "Description must be at most 500 characters");
