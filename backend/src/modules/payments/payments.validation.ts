import { z } from "zod";

export const initiateCheckoutSchema = z.object({
  paymentMethodId: z.number().int().positive(),
  phone: z.string().min(10).max(15).optional(),
  address: z.string().min(1).max(200).optional(),
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
