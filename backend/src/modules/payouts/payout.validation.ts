import { z } from "zod";

export const paymobPayoutWebhookSchema = z
  .object({
    transaction_id: z.union([z.string(), z.number()]).optional(),
    client_reference: z.string().optional(),
    reference: z.string().optional(),
    issuer: z.string().optional(),
    amount: z.union([z.string(), z.number()]).optional(),
    disbursement_status: z.string().optional(),
    status: z.string().optional(),
    status_code: z.union([z.string(), z.number()]).optional(),
    status_description: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
  })
  .passthrough();

export type PaymobPayoutWebhookPayload = z.infer<
  typeof paymobPayoutWebhookSchema
>;
