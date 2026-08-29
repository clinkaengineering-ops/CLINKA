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
  status: z.enum([
    "PENDING",
    "PENDING_REVIEW",
    "APPROVED",
    "TRANSFER_INITIATED",
    "SUBMITTED",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
    "CANCELLED",
    "REJECTED",
    "FAILED_NEEDS_MANUAL_REVIEW",
  ]),
  adminNotes: z.string().trim().max(1000).optional(),
});

export const resolveWithdrawalSchema = z.object({
  action: z.enum(["release_funds", "mark_completed", "cancel"]),
  reason: z.string().trim().max(1000).optional(),
});

export const cancelWithdrawalSchema = z.object({
  reason: z.string().trim().max(1000).optional(),
});

export const withdrawalListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum([
      "PENDING",
      "PENDING_REVIEW",
      "APPROVED",
      "TRANSFER_INITIATED",
      "SUBMITTED",
      "PROCESSING",
      "COMPLETED",
      "FAILED",
      "CANCELLED",
      "REVERSED",
      "REJECTED",
      "FAILED_NEEDS_MANUAL_REVIEW",
    ])
    .optional(),
  payoutType: z.enum(["PAYMOB", "IBAN"]).optional(),
});

export type UpdateSupportTicketInput = z.infer<typeof updateSupportTicketSchema>;
export type UpdateWithdrawalRequestInput = z.infer<
  typeof updateWithdrawalRequestSchema
>;
export type ResolveWithdrawalInput = z.infer<typeof resolveWithdrawalSchema>;
export type CancelWithdrawalInput = z.infer<typeof cancelWithdrawalSchema>;

export const approveWithdrawalSchema = z.object({
  notes: z.string().trim().max(1000).optional(),
});
export const rejectWithdrawalSchema = z.object({
  reason: z.string().trim().min(3).max(1000),
  notes: z.string().trim().max(1000).optional(),
});
export const initiateTransferSchema = z.object({
  externalReference: z.string().trim().min(3).max(255),
  notes: z.string().trim().max(1000).optional(),
});
export const recordCompletionSchema = z.object({
  notes: z.string().trim().max(1000).optional(),
});
