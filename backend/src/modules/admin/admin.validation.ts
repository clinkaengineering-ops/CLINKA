import { z } from "zod";

export const updateVerificationSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export type UpdateVerificationInput = z.infer<typeof updateVerificationSchema>;
