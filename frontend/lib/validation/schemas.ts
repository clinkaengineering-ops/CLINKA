import { z } from "zod";
import {
  bidDescriptionField,
  bidPriceField,
  bidWeeksField,
  budgetField,
  emailField,
  messageContentField,
  nameField,
  optionalBioField,
  otpField,
  passwordField,
  phoneField,
  portfolioDescriptionField,
  projectDescriptionField,
  projectTitleField,
  reviewCommentField,
  reviewRatingField,
  serviceTypeField,
} from "./fields";

export const loginFormSchema = z.object({
  email: emailField,
  password: passwordField,
});

export const clientRegisterFormSchema = z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
});

export const engineerRegisterStep2Schema = clientRegisterFormSchema.extend({
  specialty: z.enum(["CIVIL", "ARCHITECTURAL"], {
    error: "Select your specialty",
  }),
  bio: optionalBioField,
  nationality: z.string().min(1, "Select your nationality"),
});

export const engineerRegisterStep3Schema = engineerRegisterStep2Schema;

const uploadFileSchema = z
  .custom<File>((v) => v instanceof File, "Upload a file")
  .refine((f) => f.size <= 10 * 1024 * 1024, "File must be 10 MB or smaller")
  .refine(
    (f) =>
      ["image/jpeg", "image/png", "image/jpg", "application/pdf"].includes(
        f.type,
      ),
    "File must be JPG, PNG, or PDF",
  );

const portfolioImageSchema = z
  .custom<File>((v) => v instanceof File, "Upload a portfolio image")
  .refine((f) => f.size <= 10 * 1024 * 1024, "File must be 10 MB or smaller")
  .refine(
    (f) => ["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(f.type),
    "Image must be JPG, PNG, or WEBP",
  );

export const engineerRegisterStep4Schema = z.object({
  documentType: z.enum(["collegeIdUrl", "certificateUrl", "syndicateCardUrl"], {
    error: "Select a document type",
  }),
  file: uploadFileSchema,
  portfolioFiles: z
    .array(portfolioImageSchema)
    .min(3, "Upload at least 3 portfolio work samples"),
});

export const engineerResumePortfolioSchema = z.object({
  email: emailField,
  password: passwordField,
  portfolioFiles: z
    .array(portfolioImageSchema)
    .min(3, "Upload at least 3 portfolio work samples"),
});

export const forgotPasswordFormSchema = z.object({
  email: emailField,
});

export const resetPasswordFormSchema = z
  .object({
    password: passwordField,
    confirm: z.string().min(1, "Confirm your password"),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

export const verifyOtpFormSchema = z.object({
  otp: otpField,
});

export const changePasswordFormSchema = z
  .object({
    oldPassword: passwordField,
    newPassword: passwordField,
  })
  .refine((d) => d.oldPassword !== d.newPassword, {
    message: "New password must be different from your current password",
    path: ["newPassword"],
  });

export const updateProfileFormSchema = z.object({
  name: nameField,
  bio: optionalBioField,
  nationality: z.string().optional(),
});

export const requestEmailChangeFormSchema = z.object({
  newEmail: emailField,
});

export const confirmEmailChangeFormSchema = z.object({
  otp: otpField,
});

export const createProjectFormSchema = z.object({
  title: projectTitleField,
  description: projectDescriptionField,
  budget: budgetField,
  serviceType: serviceTypeField,
});

export const createBidFormSchema = z.object({
  price: bidPriceField,
  weeks: bidWeeksField,
  description: bidDescriptionField,
});

export const sendMessageFormSchema = z.object({
  content: messageContentField,
});

export const createReviewFormSchema = z.object({
  rating: reviewRatingField,
  comment: reviewCommentField,
});

export const fundPaymentFormSchema = z.object({
  paymentMethodId: z.coerce
    .number()
    .refine((n) => Number.isFinite(n) && n > 0, "Select a payment method"),
  phone: phoneField,
  address: z
    .string()
    .trim()
    .min(3, "Address must be at least 3 characters")
    .max(200, "Address must be at most 200 characters")
    .optional(),
});

export const portfolioItemFormSchema = z.object({
  description: portfolioDescriptionField,
  file: z
    .custom<File>((v) => v instanceof File, "Select an image")
    .refine((f) => f.size <= 5 * 1024 * 1024, "Image must be 5 MB or smaller")
    .refine(
      (f) =>
        ["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(f.type),
      "Image must be JPG, PNG, or WebP",
    ),
});
