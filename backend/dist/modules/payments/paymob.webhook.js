"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPaymobTransactionHmac = verifyPaymobTransactionHmac;
exports.parsePaymobSpecialReference = parsePaymobSpecialReference;
const crypto_1 = __importDefault(require("crypto"));
/** Validates Paymob transaction callback HMAC (SHA512). */
function verifyPaymobTransactionHmac(transaction, receivedHmac, hmacSecret) {
    if (!hmacSecret || !receivedHmac)
        return false;
    const source = transaction.source_data ?? {};
    const orderId = transaction.order?.id ?? "";
    const fields = [
        transaction.amount_cents,
        transaction.created_at,
        transaction.currency,
        transaction.error_occured,
        transaction.has_parent_transaction,
        transaction.id,
        transaction.integration_id,
        transaction.is_3d_secure,
        transaction.is_auth,
        transaction.is_capture,
        transaction.is_refunded,
        transaction.is_standalone_payment,
        transaction.is_voided,
        orderId,
        transaction.owner,
        transaction.pending,
        source.pan ?? "",
        source.sub_type ?? "",
        source.type ?? "",
        transaction.success,
    ];
    const computed = crypto_1.default
        .createHmac("sha512", hmacSecret)
        .update(fields.map(String).join(""))
        .digest("hex");
    if (computed.length !== receivedHmac.length)
        return false;
    return crypto_1.default.timingSafeEqual(Buffer.from(computed), Buffer.from(receivedHmac));
}
function parsePaymobSpecialReference(reference) {
    if (!reference?.trim())
        return null;
    const paymentMatch = reference.match(/payment[-_]?(\d+)/i);
    if (paymentMatch) {
        return { paymentId: Number(paymentMatch[1]) };
    }
    const numeric = Number(reference);
    if (Number.isInteger(numeric) && numeric > 0) {
        return { paymentId: numeric };
    }
    return null;
}
