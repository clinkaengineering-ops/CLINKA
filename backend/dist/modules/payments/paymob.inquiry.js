"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPaymobTransactionById = fetchPaymobTransactionById;
exports.inquirePaymobTransactionByOrderId = inquirePaymobTransactionByOrderId;
exports.inquirePaymobTransactionByMerchantOrderId = inquirePaymobTransactionByMerchantOrderId;
exports.getExpectedAmountCents = getExpectedAmountCents;
exports.validatePaymobTransactionForPayment = validatePaymobTransactionForPayment;
const paymob_1 = require("../../config/paymob");
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const paymob_webhook_1 = require("./paymob.webhook");
function amountToCents(amount) {
    return Math.round(amount * 100);
}
function normalizePaymobTransaction(raw) {
    const id = raw.id;
    if (typeof id !== "number" || !Number.isFinite(id))
        return null;
    const orderRaw = raw.order;
    const order = orderRaw && typeof orderRaw === "object"
        ? {
            id: typeof orderRaw.id === "number"
                ? orderRaw.id
                : undefined,
            merchant_order_id: typeof orderRaw
                .merchant_order_id === "string"
                ? orderRaw.merchant_order_id
                : orderRaw
                    .merchant_order_id ?? null,
        }
        : typeof orderRaw === "number"
            ? { id: orderRaw, merchant_order_id: null }
            : undefined;
    const sourceRaw = raw.source_data;
    const source_data = sourceRaw && typeof sourceRaw === "object"
        ? {
            pan: typeof sourceRaw.pan === "string"
                ? sourceRaw.pan
                : undefined,
            sub_type: typeof sourceRaw.sub_type === "string"
                ? sourceRaw.sub_type
                : undefined,
            type: typeof sourceRaw.type === "string"
                ? sourceRaw.type
                : undefined,
        }
        : undefined;
    return {
        id,
        success: Boolean(raw.success),
        amount_cents: typeof raw.amount_cents === "number" ? raw.amount_cents : 0,
        created_at: typeof raw.created_at === "string" ? raw.created_at : new Date().toISOString(),
        currency: typeof raw.currency === "string" ? raw.currency : "EGP",
        error_occured: Boolean(raw.error_occured ?? raw.error_occured),
        has_parent_transaction: Boolean(raw.has_parent_transaction),
        integration_id: typeof raw.integration_id === "number" ? raw.integration_id : 0,
        is_3d_secure: Boolean(raw.is_3d_secure),
        is_auth: Boolean(raw.is_auth),
        is_capture: Boolean(raw.is_capture),
        is_refunded: Boolean(raw.is_refunded ?? raw.is_refund),
        is_standalone_payment: Boolean(raw.is_standalone_payment),
        is_voided: Boolean(raw.is_voided ?? raw.is_void),
        owner: typeof raw.owner === "number" ? raw.owner : 0,
        pending: Boolean(raw.pending),
        order,
        source_data,
    };
}
let cachedAuthToken = null;
let authTokenExpiresAt = 0;
/** Inquiry APIs use the legacy API-key bearer token, not the intention secret key. */
async function getPaymobInquiryAuthToken() {
    if (cachedAuthToken && Date.now() < authTokenExpiresAt) {
        return cachedAuthToken;
    }
    const config = (0, paymob_1.getPaymobConfig)();
    if (!config.apiKey?.trim()) {
        throw new ApiError_1.default(500, "PAYMOB_API_KEY is required to verify payments with Paymob");
    }
    const response = await fetch(`${config.baseUrl}/api/auth/tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: config.apiKey }),
    });
    if (!response.ok) {
        throw new ApiError_1.default(502, "Failed to authenticate with Paymob API");
    }
    const data = (await response.json());
    cachedAuthToken = data.token;
    authTokenExpiresAt = Date.now() + 3500 * 1000;
    return data.token;
}
async function paymobInquiryRequest(path, options = {}) {
    const config = (0, paymob_1.getPaymobConfig)();
    const authToken = await getPaymobInquiryAuthToken();
    const url = `${config.baseUrl}/${path.replace(/^\//, "")}`;
    let finalBody = options.body;
    if (options.method === "POST" && typeof options.body === "string") {
        try {
            const parsedBody = JSON.parse(options.body);
            parsedBody.auth_token = authToken;
            finalBody = JSON.stringify(parsedBody);
        }
        catch {
            // ignore
        }
    }
    const response = await fetch(url, {
        ...options,
        body: finalBody,
        headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
            ...options.headers,
        },
    });
    if (response.status === 404)
        return null;
    const text = await response.text();
    let body;
    try {
        body = text ? JSON.parse(text) : {};
    }
    catch {
        throw new ApiError_1.default(502, `Paymob inquiry returned invalid JSON (${response.status})`);
    }
    if (!response.ok) {
        if (response.status === 404)
            return null;
        throw new ApiError_1.default(502, typeof body.detail === "string"
            ? body.detail
            : `Paymob inquiry failed (${response.status})`);
    }
    return body;
}
/** Fetch a single transaction directly from Paymob by transaction ID. */
async function fetchPaymobTransactionById(transactionId) {
    const data = await paymobInquiryRequest(`api/acceptance/transactions/${transactionId}`, { method: "GET" });
    return data ? normalizePaymobTransaction(data) : null;
}
/** Look up the latest transaction for a Paymob order ID. */
async function inquirePaymobTransactionByOrderId(orderId) {
    const data = await paymobInquiryRequest("api/ecommerce/orders/transaction_inquiry", {
        method: "POST",
        body: JSON.stringify({ order_id: orderId }),
    });
    return data ? normalizePaymobTransaction(data) : null;
}
/** Look up a transaction using our merchant reference (special_reference). */
async function inquirePaymobTransactionByMerchantOrderId(merchantOrderId) {
    const data = await paymobInquiryRequest("api/ecommerce/orders/transaction_inquiry", {
        method: "POST",
        body: JSON.stringify({ merchant_order_id: merchantOrderId }),
    });
    return data ? normalizePaymobTransaction(data) : null;
}
function getExpectedAmountCents(payment) {
    const amount = typeof payment.amount === "number"
        ? payment.amount
        : Number(payment.amount.toString());
    const commission = typeof payment.commission === "number"
        ? payment.commission
        : Number(payment.commission.toString());
    return amountToCents(amount + commission);
}
/** Validates that a Paymob transaction is a successful, final payment for the expected amount. */
function validatePaymobTransactionForPayment(transaction, payment, integrationIds) {
    if (transaction.pending) {
        throw new ApiError_1.default(402, "Payment is still pending confirmation from Paymob");
    }
    if (!transaction.success) {
        throw new ApiError_1.default(402, "Payment was not successful");
    }
    if (transaction.is_refunded) {
        throw new ApiError_1.default(402, "Payment was refunded");
    }
    if (transaction.is_voided) {
        throw new ApiError_1.default(402, "Payment was voided");
    }
    const expectedCents = getExpectedAmountCents(payment);
    if (transaction.amount_cents !== expectedCents) {
        throw new ApiError_1.default(502, `Payment amount mismatch: expected ${expectedCents} cents, got ${transaction.amount_cents}`);
    }
    if (integrationIds.length > 0 &&
        !integrationIds.includes(transaction.integration_id)) {
        throw new ApiError_1.default(502, "Payment integration is not authorized");
    }
    if (payment.gatewayInvoiceId &&
        transaction.order?.id &&
        String(transaction.order.id) !== payment.gatewayInvoiceId) {
        const refPaymentId = (0, paymob_webhook_1.parsePaymobSpecialReference)(transaction.order.merchant_order_id)?.paymentId;
        if (refPaymentId !== payment.id) {
            throw new ApiError_1.default(502, "Transaction order does not match this payment");
        }
    }
}
