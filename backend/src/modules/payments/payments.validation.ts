import { z } from "zod";
import { phoneField } from "../../utils/fields";

export const initiateCheckoutSchema = z.object({
  paymentMethodId: z.coerce
    .number({ error: "Select a payment method" })
    .int("Select a payment method")
    .positive("Select a payment method"),
  phone: phoneField.optional(),
  address: z
    .string()
    .trim()
    .min(3, "Address must be at least 3 characters")
    .max(200, "Address must be at most 200 characters")
    .optional(),
});

export type InitiateCheckoutInput = z.infer<typeof initiateCheckoutSchema>;

export const paidWebhookSchema = z.object({
  hashKey: z.string(),
  invoice_key: z.string(),
  invoice_id: z.number(),
  payment_method: z.string(),
  invoice_status: z.string(),
  pay_load: z.unknown().optional().nullable(),
  referenceNumber: z.string().optional(),
});

export const expiredWebhookSchema = z.object({
  hashKey: z.string(),
  referenceId: z.string(),
  status: z.string(),
  paymentMethod: z.string(),
  pay_load: z.unknown().optional().nullable(),
  transactionId: z.number().optional(),
  transactionKey: z.string().optional(),
});
