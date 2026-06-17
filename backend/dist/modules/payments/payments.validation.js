"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expiredWebhookSchema = exports.paidWebhookSchema = exports.initiateCheckoutSchema = void 0;
const zod_1 = require("zod");
const fields_1 = require("../../utils/fields");
exports.initiateCheckoutSchema = zod_1.z.object({
    paymentMethodId: zod_1.z.coerce
        .number({ error: "Select a payment method" })
        .int("Select a payment method")
        .positive("Select a payment method"),
    phone: fields_1.phoneField.optional(),
    address: zod_1.z
        .string()
        .trim()
        .min(3, "Address must be at least 3 characters")
        .max(200, "Address must be at most 200 characters")
        .optional(),
});
exports.paidWebhookSchema = zod_1.z.object({
    hashKey: zod_1.z.string(),
    invoice_key: zod_1.z.string(),
    invoice_id: zod_1.z.number(),
    payment_method: zod_1.z.string(),
    invoice_status: zod_1.z.string(),
    pay_load: zod_1.z.unknown().optional().nullable(),
    referenceNumber: zod_1.z.string().optional(),
});
exports.expiredWebhookSchema = zod_1.z.object({
    hashKey: zod_1.z.string(),
    referenceId: zod_1.z.string(),
    status: zod_1.z.string(),
    paymentMethod: zod_1.z.string(),
    pay_load: zod_1.z.unknown().optional().nullable(),
    transactionId: zod_1.z.number().optional(),
    transactionKey: zod_1.z.string().optional(),
});
