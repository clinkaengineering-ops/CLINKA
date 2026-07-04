"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymobPayoutAccessToken = getPaymobPayoutAccessToken;
exports.detectWalletIssuerFromMsisdn = detectWalletIssuerFromMsisdn;
exports.normalizeEgyptianMsisdn = normalizeEgyptianMsisdn;
exports.normalizeNationalId = normalizeNationalId;
exports.createPaymobInstantCashin = createPaymobInstantCashin;
const crypto_1 = require("crypto");
const redis_1 = require("../../config/redis");
const paymob_1 = require("../../config/paymob");
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const ACCESS_TOKEN_KEY = "paymob:payout:access_token";
const REFRESH_TOKEN_KEY = "paymob:payout:refresh_token";
function formatPaymobPayoutError(message, status) {
    if (typeof message === "string" && message.trim())
        return message;
    if (message && typeof message === "object") {
        const obj = message;
        if (typeof obj.status_description === "string")
            return obj.status_description;
        if (typeof obj.error_description === "string")
            return obj.error_description;
        if (typeof obj.detail === "string")
            return obj.detail;
        const parts = Object.entries(obj).map(([key, value]) => {
            const text = Array.isArray(value) ? value.join(", ") : String(value);
            return `${key}: ${text}`;
        });
        if (parts.length)
            return parts.join("; ");
    }
    return `Paymob payout request failed (${status})`;
}
async function requestPayoutToken(body) {
    const config = (0, paymob_1.getPaymobPayoutConfig)();
    const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
    const response = await fetch(`${config.baseUrl}/o/token/`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
    });
    const text = await response.text();
    let payload;
    try {
        payload = text ? JSON.parse(text) : {};
    }
    catch {
        throw new ApiError_1.default(502, "Paymob payout token response was invalid JSON");
    }
    if (!response.ok) {
        throw new ApiError_1.default(502, formatPaymobPayoutError(payload.error_description ?? payload.error ?? payload, response.status));
    }
    return payload;
}
async function storePayoutTokens(data) {
    const expiresIn = Number(data.expires_in) || 3600;
    const ttl = Math.max(60, expiresIn - 120);
    await (0, redis_1.cacheSet)(ACCESS_TOKEN_KEY, data.access_token, ttl);
    if (data.refresh_token) {
        await (0, redis_1.cacheSet)(REFRESH_TOKEN_KEY, data.refresh_token, 60 * 60 * 24 * 30);
    }
}
async function generatePayoutAccessToken() {
    const config = (0, paymob_1.getPaymobPayoutConfig)();
    const data = await requestPayoutToken(new URLSearchParams({
        grant_type: "password",
        username: config.username,
        password: config.password,
    }));
    await storePayoutTokens(data);
    return data.access_token;
}
async function refreshPayoutAccessToken(refreshToken) {
    const data = await requestPayoutToken(new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
    }));
    await storePayoutTokens(data);
    return data.access_token;
}
async function getPaymobPayoutAccessToken() {
    const cached = await (0, redis_1.cacheGet)(ACCESS_TOKEN_KEY);
    if (cached)
        return cached;
    const refreshToken = await (0, redis_1.cacheGet)(REFRESH_TOKEN_KEY);
    if (refreshToken) {
        try {
            return await refreshPayoutAccessToken(refreshToken);
        }
        catch {
            // Fall back to password grant below.
        }
    }
    return generatePayoutAccessToken();
}
function detectWalletIssuerFromMsisdn(msisdn) {
    const digits = msisdn.replace(/\D/g, "");
    if (digits.startsWith("010"))
        return "vodafone";
    if (digits.startsWith("011"))
        return "etisalat";
    if (digits.startsWith("012"))
        return "orange";
    throw new ApiError_1.default(400, "Could not detect mobile wallet provider. Use a Vodafone (010), Etisalat (011), or Orange (012) number.");
}
function normalizeEgyptianMsisdn(msisdn) {
    const digits = msisdn.replace(/\D/g, "");
    if (digits.length === 10 && digits.startsWith("1")) {
        return `0${digits}`;
    }
    if (digits.length === 11 && digits.startsWith("01")) {
        return digits;
    }
    throw new ApiError_1.default(400, "Enter a valid Egyptian mobile wallet number");
}
function normalizeNationalId(nationalId) {
    const digits = nationalId.replace(/\D/g, "");
    if (!/^\d{14}$/.test(digits)) {
        throw new ApiError_1.default(400, "National ID must be exactly 14 digits");
    }
    return digits;
}
function buildInstantCashinBody(input) {
    const body = {
        issuer: input.issuer,
        amount: input.amount,
        national_id: input.nationalId,
        client_reference: input.clientReference ?? (0, crypto_1.randomUUID)(),
        customer_bears_fees: input.customerBearsFees ?? false,
    };
    if (input.msisdn)
        body.msisdn = input.msisdn;
    if (input.bankCardNumber)
        body.bank_card_number = input.bankCardNumber;
    if (input.bankCode)
        body.bank_code = input.bankCode;
    if (input.fullName)
        body.full_name = input.fullName;
    if (input.bankTransactionType) {
        body.bank_transaction_type = input.bankTransactionType;
    }
    return body;
}
async function createPaymobInstantCashin(input) {
    if (!(0, paymob_1.isPaymobPayoutConfigured)()) {
        throw new ApiError_1.default(503, "Paymob payout is not configured (missing PAYMOB_PAYOUT_* credentials)");
    }
    if (process.env.PAYMOB_PAYOUT_DEV_FALLBACK === "true" &&
        process.env.NODE_ENV !== "production") {
        return {
            transactionId: (0, crypto_1.randomUUID)(),
            disbursementStatus: "success",
            statusCode: "200",
            statusDescription: "Simulated payout success (PAYMOB_PAYOUT_DEV_FALLBACK)",
            issuer: input.issuer,
            amount: input.amount,
            raw: { simulated: true },
        };
    }
    const config = (0, paymob_1.getPaymobPayoutConfig)();
    const accessToken = await getPaymobPayoutAccessToken();
    const response = await fetch(`${config.baseUrl}/disburse/`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(buildInstantCashinBody(input)),
    });
    const text = await response.text();
    let payload;
    try {
        payload = text ? JSON.parse(text) : {};
    }
    catch {
        throw new ApiError_1.default(502, "Paymob payout response was invalid JSON");
    }
    if (!response.ok) {
        throw new ApiError_1.default(502, formatPaymobPayoutError(payload.status_description ?? payload.detail ?? payload, response.status));
    }
    const disbursementStatus = String(payload.disbursement_status ?? payload.status ?? "failed");
    const statusDescription = typeof payload.status_description === "string"
        ? payload.status_description
        : typeof payload.status_description === "object"
            ? JSON.stringify(payload.status_description)
            : "Paymob payout response received";
    return {
        transactionId: typeof payload.transaction_id === "string"
            ? payload.transaction_id
            : payload.transaction_id != null
                ? String(payload.transaction_id)
                : null,
        disbursementStatus,
        statusCode: String(payload.status_code ?? response.status),
        statusDescription,
        issuer: String(payload.issuer ?? input.issuer),
        amount: Number(payload.amount ?? input.amount),
        raw: payload,
    };
}
