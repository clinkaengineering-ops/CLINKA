"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymobPayoutWebhookSchema = void 0;
const zod_1 = require("zod");
exports.paymobPayoutWebhookSchema = zod_1.z
    .object({
    transaction_id: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional(),
    client_reference: zod_1.z.string().optional(),
    reference: zod_1.z.string().optional(),
    issuer: zod_1.z.string().optional(),
    amount: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional(),
    disbursement_status: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
    status_code: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional(),
    status_description: zod_1.z.union([zod_1.z.string(), zod_1.z.record(zod_1.z.string(), zod_1.z.unknown())]).optional(),
})
    .passthrough();
