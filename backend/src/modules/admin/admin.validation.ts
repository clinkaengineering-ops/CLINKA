import { z } from "zod";

export const updateVerificationSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"], {
    error: "Status must be APPROVED or REJECTED",
  }),
});

export type UpdateVerificationInput = z.infer<typeof updateVerificationSchema>;

export const banUserSchema = z.object({
  note: z.string().trim().max(500).optional(),
});

export type BanUserInput = z.infer<typeof banUserSchema>;

export const updateProfileSchema = z.object({
  specialty: z.enum(["CIVIL", "ARCHITECTURAL"]).optional(),
  bio: z.string().trim().max(1000).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const updateProjectSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "AWAITING_APPROVAL", "SUBMITTED_FOR_REVIEW", "REVISION_REQUESTED", "COMPLETED", "CANCELLED"]).optional(),
  isFlagged: z.boolean().optional(),
});

export const updateSettingsSchema = z.object({
  platformFeePercent: z.number().min(0).max(100),
});

export const updatePaymentOverrideSchema = z.object({
  status: z.enum(["RELEASED", "REFUNDED"]),
});

export const updateSupportTicketSchema = z.object({
  status: z.enum(["SOLVED", "UNRESOLVED"]),
  solution: z.string().trim().min(1).max(2000),
});

export const updateWithdrawalRequestSchema = z.object({
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "REJECTED"]),
  adminNotes: z.string().trim().max(1000).optional(),
});

export type UpdateSupportTicketInput = z.infer<typeof updateSupportTicketSchema>;
export type UpdateWithdrawalRequestInput = z.infer<
  typeof updateWithdrawalRequestSchema
>;
