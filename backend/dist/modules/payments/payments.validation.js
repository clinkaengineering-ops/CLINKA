"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoWithdrawalSchema = exports.paymobWebhookSchema = exports.verifyCheckoutReturnSchema = exports.initiateCheckoutSchema = void 0;
const zod_1 = require("zod");
const fields_1 = require("../../utils/fields");
exports.initiateCheckoutSchema = zod_1.z.object({
    paymentMethodId: zod_1.z.coerce
        .number({ error: "Select a payment method" })
        .int("Select a payment method")
        .positive("Select a payment method")
        .optional(),
    phone: fields_1.phoneField.optional(),
    address: zod_1.z
        .string()
        .trim()
        .min(3, "Address must be at least 3 characters")
        .max(200, "Address must be at most 200 characters")
        .optional(),
});
exports.verifyCheckoutReturnSchema = zod_1.z.object({
    projectId: zod_1.z.coerce.number().int().positive().optional(),
    paymentId: zod_1.z.coerce.number().int().positive().optional(),
    orderId: zod_1.z.coerce.number().int().positive().optional(),
    transactionId: zod_1.z.coerce.number().int().positive().optional(),
    specialReference: zod_1.z.string().trim().min(1).optional(),
    merchantOrderId: zod_1.z.string().trim().min(1).optional(),
    returnQuery: zod_1.z.string().trim().min(1).optional(),
});
exports.paymobWebhookSchema = zod_1.z.object({
    type: zod_1.z.string().optional(),
    obj: zod_1.z.object({
        id: zod_1.z.number(),
        success: zod_1.z.boolean(),
        amount_cents: zod_1.z.number(),
        created_at: zod_1.z.string(),
        currency: zod_1.z.string(),
        error_occured: zod_1.z.boolean(),
        has_parent_transaction: zod_1.z.boolean(),
        integration_id: zod_1.z.number(),
        is_3d_secure: zod_1.z.boolean(),
        is_auth: zod_1.z.boolean(),
        is_capture: zod_1.z.boolean(),
        is_refunded: zod_1.z.boolean(),
        is_standalone_payment: zod_1.z.boolean(),
        is_voided: zod_1.z.boolean(),
        owner: zod_1.z.number(),
        pending: zod_1.z.boolean(),
        order: zod_1.z
            .object({
            id: zod_1.z.number().optional(),
            merchant_order_id: zod_1.z.string().nullable().optional(),
        })
            .optional(),
        source_data: zod_1.z
            .object({
            pan: zod_1.z.string().optional(),
            sub_type: zod_1.z.string().optional(),
            type: zod_1.z.string().optional(),
        })
            .optional(),
    }),
    merchant_order_id: zod_1.z.string().nullable().optional(),
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
exports.autoWithdrawalSchema = zod_1.z.discriminatedUnion("channel", [
    zod_1.z.object({
        amount: zod_1.z.coerce
            .number({ error: "Amount is required" })
            .positive("Amount must be greater than zero"),
        channel: zod_1.z.literal("mobile_wallet"),
        msisdn: zod_1.z
            .string()
            .trim()
            .min(10, "Enter a valid mobile wallet number")
            .max(15, "Mobile wallet number is too long"),
        nationalId: zod_1.z
            .string()
            .trim()
            .regex(/^\d{14}$/, "National ID must be exactly 14 digits")
            .optional(),
    }),
    zod_1.z.object({
        amount: zod_1.z.coerce
            .number({ error: "Amount is required" })
            .positive("Amount must be greater than zero"),
        channel: zod_1.z.literal("bank_transfer"),
        accountNumber: zod_1.z
            .string()
            .trim()
            .min(6, "Account number or IBAN is too short")
            .max(34, "Account number or IBAN is too long"),
        bankCode: zod_1.z
            .string()
            .trim()
            .min(2, "Bank code is required")
            .max(10, "Bank code is too long"),
        fullName: zod_1.z
            .string()
            .trim()
            .min(3, "Full name is required for bank transfers")
            .max(100, "Full name is too long"),
        nationalId: zod_1.z
            .string()
            .trim()
            .regex(/^\d{14}$/, "National ID must be exactly 14 digits")
            .optional(),
        bankTransactionType: zod_1.z.enum(["cash_transfer", "salary"]).default("cash_transfer"),
    }),
]);
