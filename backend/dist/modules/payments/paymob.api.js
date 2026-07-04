"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listConfiguredPaymobMethods = listConfiguredPaymobMethods;
exports.createPaymobIntention = createPaymobIntention;
const paymob_1 = require("../../config/paymob");
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
function formatPaymobErrorMessage(message, status) {
    if (typeof message === "string" && message.trim())
        return message;
    if (message && typeof message === "object") {
        const obj = message;
        if (typeof obj.detail === "string")
            return obj.detail;
        const parts = Object.entries(obj).map(([key, value]) => {
            const text = Array.isArray(value) ? value.join(", ") : String(value);
            return `${key}: ${text}`;
        });
        if (parts.length)
            return parts.join("; ");
    }
    return `Paymob request failed (${status})`;
}
async function paymobRequest(path, options = {}) {
    const config = (0, paymob_1.getPaymobConfig)();
    const url = `${config.baseUrl}/${path.replace(/^\//, "")}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            Authorization: `Token ${config.secretKey}`,
            "Content-Type": "application/json",
            ...options.headers,
        },
    });
    const text = await response.text();
    let body;
    try {
        body = text ? JSON.parse(text) : {};
    }
    catch {
        throw new ApiError_1.default(502, `Paymob API returned invalid JSON (${response.status})`);
    }
    if (!response.ok) {
        throw new ApiError_1.default(502, formatPaymobErrorMessage(body.detail ?? body.message ?? body, response.status));
    }
    return body;
}
function listConfiguredPaymobMethods() {
    const config = (0, paymob_1.getPaymobConfig)();
    return config.integrationIds.map((integrationId, index) => ({
        paymentId: integrationId,
        name_en: `Payment method ${index + 1}`,
        name_ar: `طريقة دفع ${index + 1}`,
        redirect: "true",
    }));
}
function extractPaymobCheckoutSecret(payload) {
    const directSecret = payload.client_secret ?? payload.clientSecret;
    if (typeof directSecret === "string" && directSecret.trim()) {
        return directSecret.trim();
    }
    const paymentKeys = Array.isArray(payload.payment_keys)
        ? payload.payment_keys
        : [];
    for (const paymentKey of paymentKeys) {
        if (!paymentKey || typeof paymentKey !== "object")
            continue;
        const candidate = paymentKey;
        const nestedSecret = candidate.client_secret ?? candidate.clientSecret;
        if (typeof nestedSecret === "string" && nestedSecret.trim()) {
            return nestedSecret.trim();
        }
        const keyValue = candidate.key;
        if (typeof keyValue === "string" && keyValue.trim()) {
            return keyValue.trim();
        }
    }
    return undefined;
}
async function createPaymobIntention(input) {
    const data = await paymobRequest("v1/intention/", {
        method: "POST",
        body: JSON.stringify({
            amount: input.amountCents,
            currency: input.currency,
            payment_methods: input.paymentMethods,
            items: input.items,
            billing_data: {
                apartment: input.billingData.apartment ?? "NA",
                floor: input.billingData.floor ?? "NA",
                street: input.billingData.street ?? "NA",
                building: input.billingData.building ?? "NA",
                city: input.billingData.city ?? "NA",
                country: input.billingData.country ?? "EG",
                state: input.billingData.state ?? "NA",
                first_name: input.billingData.first_name,
                last_name: input.billingData.last_name,
                email: input.billingData.email,
                phone_number: input.billingData.phone_number,
                shipping_method: "NA",
                postal_code: "NA",
            },
            special_reference: input.specialReference,
            notification_url: input.notificationUrl,
            redirection_url: input.redirectionUrl,
            extras: input.extras,
            expiration: input.expirationSeconds ?? 3600,
        }),
    });
    const orderId = data.intention_order_id ??
        data.payment_keys?.[0]?.order_id ??
        0;
    const clientSecret = extractPaymobCheckoutSecret(data);
    if (!clientSecret) {
        throw new ApiError_1.default(502, "Paymob intention response missing checkout secret");
    }
    return {
        id: data.id ?? input.specialReference,
        clientSecret,
        orderId,
    };
}
