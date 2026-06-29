import { z } from "zod";
import { phoneField } from "../../utils/fields";

export const initiateCheckoutSchema = z.object({
  paymentMethodId: z.coerce
    .number({ error: "Select a payment method" })
    .int("Select a payment method")
    .positive("Select a payment method")
    .optional(),
  phone: phoneField.optional(),
  address: z
    .string()
    .trim()
    .min(3, "Address must be at least 3 characters")
    .max(200, "Address must be at most 200 characters")
    .optional(),
});

export type InitiateCheckoutInput = z.infer<typeof initiateCheckoutSchema>;

export const paymobWebhookSchema = z.object({
  type: z.string().optional(),
  obj: z.object({
    id: z.number(),
    success: z.boolean(),
    amount_cents: z.number(),
    created_at: z.string(),
    currency: z.string(),
    error_occured: z.boolean(),
    has_parent_transaction: z.boolean(),
    integration_id: z.number(),
    is_3d_secure: z.boolean(),
    is_auth: z.boolean(),
    is_capture: z.boolean(),
    is_refunded: z.boolean(),
    is_standalone_payment: z.boolean(),
    is_voided: z.boolean(),
    owner: z.number(),
    pending: z.boolean(),
    order: z
      .object({
        id: z.number().optional(),
        merchant_order_id: z.string().nullable().optional(),
      })
      .optional(),
    source_data: z
      .object({
        pan: z.string().optional(),
        sub_type: z.string().optional(),
        type: z.string().optional(),
      })
      .optional(),
  }),
  merchant_order_id: z.string().nullable().optional(),
});

export const createWithdrawalRequestSchema = z.object({
  amount: z.coerce
    .number({ error: "Amount is required" })
    .positive("Amount must be greater than zero"),
  method: z
    .string()
    .trim()
    .min(2, "Withdrawal method is required")
    .max(50, "Withdrawal method is too long"),
  accountNumber: z
    .string()
    .trim()
    .min(6, "Account number is too short")
    .max(60, "Account number is too long"),
});

export type CreateWithdrawalRequestInput = z.infer<
  typeof createWithdrawalRequestSchema
>;
