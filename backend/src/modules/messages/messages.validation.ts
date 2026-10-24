import { z } from "zod";

const optionalContentField = z
  .string()
  .trim()
  .max(5000, "Message must be at most 5000 characters")
  .optional()
  .default("");

const optionalDurationField = z.preprocess(
  (val) => (val === "" || val === undefined ? undefined : val),
  z.coerce
    .number()
    .int("Duration must be an integer")
    .min(1, "Duration must be at least 1 second")
    .max(300, "Duration cannot exceed 300 seconds")
    .nullable()
    .optional(),
);

export const sendMessageSchema = z.object({
  content: optionalContentField,
  attachmentDuration: optionalDurationField,
});

export type SendMessageInput = z.infer<typeof sendMessageSchema> & {
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentMime?: string;
  attachmentDuration?: number | null;
};

