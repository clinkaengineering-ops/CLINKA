import { z } from "zod";

const optionalContentField = z
  .string()
  .trim()
  .max(5000, "Message must be at most 5000 characters")
  .optional()
  .default("");

export const sendMessageSchema = z.object({
  content: optionalContentField,
});

export type SendMessageInput = z.infer<typeof sendMessageSchema> & {
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentMime?: string;
};
