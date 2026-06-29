import { z } from "zod";
import { emailField, nameField } from "../../utils/fields";

export const createSupportTicketSchema = z.object({
  name: nameField,
  email: emailField,
  subject: z.string().trim().min(3).max(200),
  message: z.string().trim().min(10).max(5000),
});

export type CreateSupportTicketInput = z.infer<typeof createSupportTicketSchema>;
