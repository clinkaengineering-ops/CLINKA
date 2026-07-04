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

export const verifyCheckoutReturnSchema = z.object({
  projectId: z.coerce.number().int().positive().optional(),
  paymentId: z.coerce.number().int().positive().optional(),
  orderId: z.coerce.number().int().positive().optional(),
  transactionId: z.coerce.number().int().positive().optional(),
  specialReference: z.string().trim().min(1).optional(),
  merchantOrderId: z.string().trim().min(1).optional(),
  returnQuery: z.string().trim().min(1).optional(),
});

export type VerifyCheckoutReturnInput = z.infer<typeof verifyCheckoutReturnSchema>;

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

/* OLD_WITHDRAWAL_START — Manual withdrawal validation (commented out for auto-withdrawal via Paymob)
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
OLD_WITHDRAWAL_END */

export const autoWithdrawalSchema = z.discriminatedUnion("channel", [
  z.object({
    amount: z.coerce
      .number({ error: "Amount is required" })
      .positive("Amount must be greater than zero"),
    channel: z.literal("mobile_wallet"),
    msisdn: z
      .string()
      .trim()
      .min(10, "Enter a valid mobile wallet number")
      .max(15, "Mobile wallet number is too long"),
    nationalId: z
      .string()
      .trim()
      .regex(/^\d{14}$/, "National ID must be exactly 14 digits")
      .optional(),
  }),
  z.object({
    amount: z.coerce
      .number({ error: "Amount is required" })
      .positive("Amount must be greater than zero"),
    channel: z.literal("bank_transfer"),
    accountNumber: z
      .string()
      .trim()
      .min(6, "Account number or IBAN is too short")
      .max(34, "Account number or IBAN is too long"),
    bankCode: z
      .string()
      .trim()
      .min(2, "Bank code is required")
      .max(10, "Bank code is too long"),
    fullName: z
      .string()
      .trim()
      .min(3, "Full name is required for bank transfers")
      .max(100, "Full name is too long"),
    nationalId: z
      .string()
      .trim()
      .regex(/^\d{14}$/, "National ID must be exactly 14 digits")
      .optional(),
    bankTransactionType: z.enum(["cash_transfer", "salary"]).default("cash_transfer"),
  }),
]);

export type AutoWithdrawalInput = z.infer<typeof autoWithdrawalSchema>;
