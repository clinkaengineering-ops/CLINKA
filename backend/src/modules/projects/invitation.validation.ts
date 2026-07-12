import { z } from "zod";

export const inviteEngineerSchema = z.object({
  engineerId: z.number().int().positive(),
});

export const respondInvitationSchema = z.object({
  action: z.enum(["ACCEPT", "DECLINE"]),
});
