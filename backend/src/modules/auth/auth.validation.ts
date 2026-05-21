import { z } from "zod";

export const clientRegisterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const engineerRegisterSchema = clientRegisterSchema.extend({
  specialty: z.enum(["CIVIL", "ARCHITECTURAL"]),
  bio: z.string().optional(),
  documentType: z.enum(["collegeIdUrl", "certificateUrl", "syndicateCardUrl"]),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters long"),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type clientRegisterInput = z.infer<typeof clientRegisterSchema>;
export type engineerRegisterInput = z.infer<typeof engineerRegisterSchema>;
export type loginInput = z.infer<typeof loginSchema>;
export type forgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export const requestEmailChangeSchema = z.object({
  newEmail: z.string().email("Invalid email address"),
});

export const confirmEmailChangeSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export type resetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type RequestEmailChangeInput = z.infer<typeof requestEmailChangeSchema>;
export type ConfirmEmailChangeInput = z.infer<typeof confirmEmailChangeSchema>;
