import { z } from "zod";

export const inviteEngineerSchema = z.object({
  engineerId: z.string().uuid({ message: "Invalid engineer id" }),
});

export const respondInvitationSchema = z.object({
  action: z.enum(["ACCEPT", "DECLINE"]),
});
