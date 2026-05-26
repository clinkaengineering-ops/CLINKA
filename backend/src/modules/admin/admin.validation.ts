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
