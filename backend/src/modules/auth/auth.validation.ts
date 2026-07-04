import { z } from "zod";
import {
  emailField,
  nameField,
  otpField,
  optionalBioField,
  passwordField,
} from "../../utils/fields";

export const clientRegisterSchema = z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
});

export const engineerRegisterSchema = clientRegisterSchema.extend({
  specialty: z.enum(["CIVIL", "ARCHITECTURAL"], {
    error: "Select civil or architectural specialty",
  }),
  bio: optionalBioField,
  nationality: z.string().min(1, "Nationality is required"),
  documentType: z.enum(["collegeIdUrl", "certificateUrl", "syndicateCardUrl"], {
    error: "Select a document type to upload",
  }),
});

export const loginSchema = z.object({
  email: emailField,
  password: passwordField,
});

export const verifyOtpSchema = z.object({
  userId: z.coerce
    .number({ error: "Invalid session" })
    .int("Invalid session")
    .positive("Invalid session"),
  otp: otpField,
});

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset link is invalid or expired"),
  newPassword: passwordField,
});

export const changePasswordSchema = z
  .object({
    oldPassword: passwordField,
    newPassword: passwordField,
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: "New password must be different from your current password",
    path: ["newPassword"],
  });

export const requestEmailChangeSchema = z.object({
  newEmail: emailField,
});

export const confirmEmailChangeSchema = z.object({
  otp: otpField,
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type clientRegisterInput = z.infer<typeof clientRegisterSchema>;
export type engineerRegisterInput = z.infer<typeof engineerRegisterSchema>;
export type loginInput = z.infer<typeof loginSchema>;
export type forgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type resetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type RequestEmailChangeInput = z.infer<typeof requestEmailChangeSchema>;
export type ConfirmEmailChangeInput = z.infer<typeof confirmEmailChangeSchema>;
export const clientApplyEngineerSchema = z.object({
  specialty: z.enum(["CIVIL", "ARCHITECTURAL"], {
    error: "Select civil or architectural specialty",
  }),
  bio: optionalBioField,
  nationality: z.string().min(1, "Nationality is required"),
  documentType: z.enum(["collegeIdUrl", "certificateUrl", "syndicateCardUrl"], {
    error: "Select a document type to upload",
  }),
});

export type ClientApplyEngineerInput = z.infer<typeof clientApplyEngineerSchema>;
