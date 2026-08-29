import { z } from "zod";
import { emailField, nameField, subjectField, supportMessageField } from "../../utils/fields";

export const createSupportTicketSchema = z.object({
  name: nameField,
  email: emailField,
  subject: subjectField,
  message: supportMessageField,
});

export type CreateSupportTicketInput = z.infer<typeof createSupportTicketSchema>;
