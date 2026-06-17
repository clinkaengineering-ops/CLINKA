import { z } from "zod";

export const updateNotificationPrefsSchema = z.object({
  newBid: z.boolean().optional(),
  bidAccepted: z.boolean().optional(),
  fundsReleased: z.boolean().optional(),
  newMessage: z.boolean().optional(),
});
