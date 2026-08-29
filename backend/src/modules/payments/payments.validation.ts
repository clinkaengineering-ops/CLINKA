import { z } from "zod";
import { phoneField, addressField } from "../../utils/fields";
import {
  isValidCountryCode,
  normalizeCountryCode,
} from "../../utils/countryCodes";
import {
  ACCOUNT_HOLDER_NAME_MESSAGE,
  isValidAccountHolderName,
  normalizeAccountHolderName,
} from "../../utils/accountHolderName";

function accountHolderNameField(label = "Account holder name") {
  return z
    .string()
    .trim()
    .max(100, `${label} is too long`)
    .transform(normalizeAccountHolderName)
    .refine(isValidAccountHolderName, ACCOUNT_HOLDER_NAME_MESSAGE);
}

export const initiateCheckoutSchema = z.object({
  paymentMethodId: z.coerce
    .number({ error: "Select a payment method" })
    .int("Select a payment method")
    .positive("Select a payment method")
    .optional(),
  phone: phoneField.optional(),
  address: addressField.optional(),
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
      .transform((value) => value.replace(/\s+/g, "").toUpperCase())
      .refine(
        (value) => value.length >= 15 && value.length <= 34,
        "IBAN must be between 15 and 34 characters",
      )
      .refine(isValidIban, "Enter a valid IBAN for this bank account")
      .refine(
        (value) => value.startsWith("EG"),
        "Egyptian bank transfers require an IBAN starting with EG",
      ),
    bankCode: z
      .string()
      .trim()
      .min(2, "Bank code is required")
      .max(10, "Bank code is too long"),
    fullName: accountHolderNameField("Account holder name"),
    nationalId: z
      .string()
      .trim()
      .regex(/^\d{14}$/, "National ID must be exactly 14 digits")
      .optional(),
    bankTransactionType: z.enum(["cash_transfer", "salary"]).default("cash_transfer"),
  }),
]);

export type AutoWithdrawalInput = z.infer<typeof autoWithdrawalSchema>;



function normalizeIban(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}

function isValidIban(iban: string) {
  const normalized = normalizeIban(iban);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(normalized)) return false;
  const rearranged = normalized.slice(4) + normalized.slice(0, 4);
  const numeric = rearranged
    .split("")
    .map((ch) => (ch >= "A" && ch <= "Z" ? (ch.charCodeAt(0) - 55).toString() : ch))
    .join("");
  let remainder = numeric;
  while (remainder.length > 2) {
    const block = remainder.slice(0, 9);
    remainder = (Number(block) % 97).toString() + remainder.slice(block.length);
  }
  return Number(remainder) % 97 === 1;
}

export const internationalWithdrawalSchema = z.object({
  amount: z.coerce
    .number({ error: "Amount is required" })
    .positive("Amount must be greater than zero"),
  iban: z
    .string()
    .trim()
    .min(15, "IBAN is too short")
    .max(34, "IBAN is too long")
    .refine((value) => isValidIban(value), "Enter a valid IBAN"),
  accountHolderName: accountHolderNameField("Account holder name"),
  bankName: z
    .string()
    .trim()
    .min(2, "Bank name is required")
    .max(120, "Bank name is too long"),
  country: z
    .string()
    .trim()
    .min(2, "Country is required")
    .transform((value) => normalizeCountryCode(value))
    .refine(
      (value) => isValidCountryCode(value),
      "Country must be a 2-letter ISO code (e.g. GB, DE, US). Common names like UK are accepted.",
    ),
  swiftBic: z
    .string()
    .trim()
    .regex(/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/i, "Invalid SWIFT/BIC code")
    .optional()
    .or(z.literal("")),
  bankAddress: z.string().trim().max(200, "Bank address is too long").optional(),
});

export type InternationalWithdrawalInput = z.infer<
  typeof internationalWithdrawalSchema
>;

export const instapayWithdrawalSchema = z.object({
  amount: z.coerce.number().positive(),
  instapayAccount: z.string().trim().min(2, "InstaPay account is required"),
  accountHolderName: accountHolderNameField("Account holder name"),
});

export type InstapayWithdrawalInput = z.infer<typeof instapayWithdrawalSchema>;

export const ewalletWithdrawalSchema = z.object({
  amount: z.coerce.number().positive(),
  walletProvider: z.string().trim().min(2, "Wallet provider is required"),
  walletNumber: z.string().trim().min(5, "Wallet number is required"),
  accountHolderName: accountHolderNameField("Account holder name"),
});

export type EWalletWithdrawalInput = z.infer<typeof ewalletWithdrawalSchema>;

export const submitManualPaymentSchema = z.object({
  paymentMethod: z.enum(["bank_transfer", "instapay", "ewallet"]),
  transactionReference: z.string().trim().min(2, "Transaction reference is required"),
  amount: z.coerce.number().positive(),
  currency: z.string().trim().toUpperCase(),
  proofUrl: z.string().url("Must be a valid URL").optional(),
  proofPublicId: z.string().optional(),
  note: z.string().optional(),
});

export type SubmitManualPaymentInput = z.infer<typeof submitManualPaymentSchema>;
