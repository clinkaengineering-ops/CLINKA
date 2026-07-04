"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymobConfig = getPaymobConfig;
exports.buildPaymobCheckoutUrl = buildPaymobCheckoutUrl;
exports.getPaymobPayoutConfig = getPaymobPayoutConfig;
exports.isPaymobPayoutConfigured = isPaymobPayoutConfigured;
function parseIntegrationIds(raw) {
    if (!raw?.trim())
        return [];
    return raw
        .split(",")
        .map((part) => Number(part.trim()))
        .filter((id) => Number.isInteger(id) && id > 0);
}
function getPaymobConfig() {
    const secretKey = process.env.PAYMOB_SECRET_KEY;
    if (!secretKey) {
        throw new Error("PAYMOB_SECRET_KEY is not set");
    }
    const integrationIds = parseIntegrationIds(process.env.PAYMOB_INTEGRATION_IDS);
    if (integrationIds.length === 0) {
        throw new Error("PAYMOB_INTEGRATION_IDS is not set or invalid");
    }
    return {
        baseUrl: (process.env.PAYMOB_BASE_URL ?? "https://accept.paymob.com").replace(/\/$/, ""),
        secretKey,
        publicKey: process.env.PAYMOB_PUBLIC_KEY ?? "",
        hmacSecret: process.env.PAYMOB_HMAC_SECRET ?? "",
        currency: process.env.PAYMOB_CURRENCY ?? "EGP",
        commissionRate: Number(process.env.PLATFORM_COMMISSION_RATE ?? "0.1"),
        integrationIds,
    };
}
function buildPaymobCheckoutUrl(config, clientSecret) {
    const url = new URL(`${config.baseUrl}/unifiedcheckout/`);
    url.searchParams.set("publicKey", config.publicKey);
    url.searchParams.set("clientSecret", clientSecret);
    return url.toString();
}
/**
 * Returns Paymob Payout (Instant Cashin / Disbursement) OAuth configuration.
 * Docs: https://payouts.paymobsolutions.com/docs/
 */
function getPaymobPayoutConfig() {
    const clientId = process.env.PAYMOB_PAYOUT_CLIENT_ID?.trim();
    const clientSecret = process.env.PAYMOB_PAYOUT_CLIENT_SECRET?.trim();
    const username = process.env.PAYMOB_PAYOUT_USERNAME?.trim();
    const password = process.env.PAYMOB_PAYOUT_PASSWORD?.trim();
    if (!clientId || !clientSecret || !username || !password) {
        throw new Error("Paymob payout OAuth credentials are not fully configured (PAYMOB_PAYOUT_CLIENT_ID, PAYMOB_PAYOUT_CLIENT_SECRET, PAYMOB_PAYOUT_USERNAME, PAYMOB_PAYOUT_PASSWORD)");
    }
    return {
        baseUrl: (process.env.PAYMOB_PAYOUT_BASE_URL ??
            "https://stagingpayouts.paymobsolutions.com/api/secure").replace(/\/$/, ""),
        clientId,
        clientSecret,
        username,
        password,
        currency: process.env.PAYMOB_CURRENCY ?? "EGP",
        instantBankMinAmount: Number(process.env.PAYMOB_PAYOUT_INSTANT_BANK_MIN ?? "112"),
    };
}
/** Returns true when payout OAuth env vars are configured. */
function isPaymobPayoutConfigured() {
    return Boolean(process.env.PAYMOB_PAYOUT_CLIENT_ID?.trim() &&
        process.env.PAYMOB_PAYOUT_CLIENT_SECRET?.trim() &&
        process.env.PAYMOB_PAYOUT_USERNAME?.trim() &&
        process.env.PAYMOB_PAYOUT_PASSWORD?.trim());
}
