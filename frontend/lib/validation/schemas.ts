import { z } from "zod";
import {
  addressField,
  adminIdentifierField,
  adminSolutionField,
  bidDescriptionField,
  bidPriceField,
  bidWeeksField,
  budgetField,
  emailField,
  feePercentField,
  linkNameField,
  loginPasswordField,
  messageContentField,
  nameField,
  nationalIdField,
  nationalityField,
  optionalBioField,
  optionalUrlField,
  otpField,
  passwordField,
  phoneField,
  portfolioDescriptionField,
  projectDescriptionField,
  projectTitleField,
  revisionNoteField,
  reviewCommentField,
  reviewRatingField,
  serviceTypeField,
  subjectField,
  supportMessageField,
  urlField,
} from "./fields";

export const loginFormSchema = z.object({
  email: emailField,
  password: loginPasswordField,
});

export const clientRegisterFormSchema = z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
});

const engineerSpecialtyField = z.enum(["CIVIL", "ARCHITECTURAL"], {
  error: "Select your specialty",
});

const documentTypeField = z.enum(
  ["collegeIdUrl", "certificateUrl", "syndicateCardUrl"],
  { error: "Select a document type" },
);

export const engineerRegisterStep2Schema = clientRegisterFormSchema.extend({
  specialty: engineerSpecialtyField,
  bio: optionalBioField,
  nationality: nationalityField,
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
  documentType: documentTypeField,
  file: uploadFileSchema,
  portfolioFiles: z
    .array(portfolioImageSchema)
    .min(3, "Upload at least 3 portfolio work samples")
    .max(10, "Upload at most 10 portfolio images"),
});

export const engineerResumePortfolioSchema = z.object({
  email: emailField,
  password: loginPasswordField,
  portfolioFiles: z
    .array(portfolioImageSchema)
    .min(3, "Upload at least 3 portfolio work samples")
    .max(10, "Upload at most 10 portfolio images"),
});

export const joinEngineerFormSchema = z.object({
  specialty: engineerSpecialtyField,
  nationality: nationalityField,
  bio: optionalBioField,
  documentType: documentTypeField,
  file: uploadFileSchema,
  portfolioFiles: z
    .array(portfolioImageSchema)
    .min(3, "Upload at least 3 portfolio work samples")
    .max(10, "Upload at most 10 portfolio images"),
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
    oldPassword: loginPasswordField,
    newPassword: passwordField,
  })
  .refine((d) => d.oldPassword !== d.newPassword, {
    message: "New password must be different from your current password",
    path: ["newPassword"],
  });

export const updateProfileFormSchema = z.object({
  name: nameField,
  bio: optionalBioField,
  nationality: z.string().trim().optional(),
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
  address: addressField.optional(),
});

export const checkoutContactFormSchema = z.object({
  phone: phoneField,
  address: addressField,
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

export const supportFormSchema = z.object({
  name: nameField,
  email: emailField,
  subject: subjectField,
  message: supportMessageField,
});

export const requestRevisionFormSchema = z.object({
  revisionNote: revisionNoteField,
});

export const submitWorkLinkSchema = z.object({
  url: urlField,
  name: linkNameField,
});

export const submitWorkFormSchema = z
  .object({
    notes: z
      .string()
      .trim()
      .max(5000, "Notes must be at most 5000 characters")
      .optional()
      .transform((v) => (v && v.length > 0 ? v : undefined)),
    links: z.array(submitWorkLinkSchema).max(20, "Add at most 20 links"),
    files: z.array(z.custom<File>((v) => v instanceof File)).max(10),
  })
  .refine(
    (d) =>
      Boolean(d.notes) ||
      d.links.length > 0 ||
      d.files.length > 0,
    { message: "Add notes, a link, or at least one file", path: ["_form"] },
  );

export const banUserFormSchema = z.object({
  identifier: adminIdentifierField,
  note: z
    .string()
    .trim()
    .max(500, "Note must be at most 500 characters")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

export const adminUserSearchSchema = z.object({
  identifier: adminIdentifierField,
});

export const adminSolutionFormSchema = z.object({
  solution: adminSolutionField,
});

export const adminFeeFormSchema = z.object({
  feePercent: feePercentField,
});

export const walletWithdrawalFormSchema = z.object({
  amount: z.coerce
    .number({ error: "Enter a valid amount" })
    .positive("Amount must be greater than zero"),
  channel: z.enum(["wallet", "bank"]),
  nationalId: nationalIdField,
  msisdn: phoneField.optional(),
  fullName: nameField.optional(),
  bankCode: z.string().trim().optional(),
  accountNumber: z
    .string()
    .trim()
    .min(4, "Account number is required")
    .max(34, "Account number is too long")
    .optional(),
}).superRefine((data, ctx) => {
  if (data.channel === "wallet") {
    if (!data.msisdn) {
      ctx.addIssue({
        code: "custom",
        message: "Mobile wallet number is required",
        path: ["msisdn"],
      });
    }
  } else {
    if (!data.fullName) {
      ctx.addIssue({
        code: "custom",
        message: "Account holder name is required",
        path: ["fullName"],
      });
    }
    if (!data.bankCode?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Select a bank",
        path: ["bankCode"],
      });
    }
    if (!data.accountNumber?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Account number is required",
        path: ["accountNumber"],
      });
    }
  }
});

export { optionalUrlField, uploadFileSchema, portfolioImageSchema };
