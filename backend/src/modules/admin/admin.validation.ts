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
  status: z.enum(["OPEN", "IN_PROGRESS", "AWAITING_APPROVAL", "COMPLETED", "CANCELLED"]).optional(),
  isFlagged: z.boolean().optional(),
});

export const updateSettingsSchema = z.object({
  platformFeePercent: z.number().min(0).max(100),
});

export const updatePaymentOverrideSchema = z.object({
  status: z.enum(["RELEASED", "REFUNDED"]),
});
