"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPaidWebhookHash = verifyPaidWebhookHash;
exports.verifyExpiredWebhookHash = verifyExpiredWebhookHash;
const crypto_1 = __importDefault(require("crypto"));
/** Validates paid-invoice webhook per Fawaterak docs (HMAC SHA256). */
function verifyPaidWebhookHash(invoiceId, invoiceKey, paymentMethod, hashKey, vendorKey) {
    if (!vendorKey || !hashKey)
        return false;
    const queryParam = `InvoiceId=${invoiceId}&InvoiceKey=${invoiceKey}&PaymentMethod=${paymentMethod}`;
    const expected = crypto_1.default
        .createHmac("sha256", vendorKey)
        .update(queryParam)
        .digest("hex");
    return expected === hashKey;
}
/** Validates expired Fawry/Aman/Masary webhook. */
function verifyExpiredWebhookHash(referenceId, paymentMethod, hashKey, vendorKey) {
    if (!vendorKey || !hashKey)
        return false;
    const queryParam = `referenceId=${referenceId}&PaymentMethod=${paymentMethod}`;
    const expected = crypto_1.default
        .createHmac("sha256", vendorKey)
        .update(queryParam)
        .digest("hex");
    return expected === hashKey;
}
