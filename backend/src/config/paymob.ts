export interface PaymobConfig {
  baseUrl: string;
  secretKey: string;
  publicKey: string;
  apiKey: string;
  hmacSecret: string;
  currency: string;
  commissionRate: number;
  integrationIds: number[];
}

function parseIntegrationIds(raw: string | undefined): number[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);
}

export function getPaymobConfig(): PaymobConfig {
  const secretKey = process.env.PAYMOB_SECRET_KEY;
  if (!secretKey) {
    throw new Error("PAYMOB_SECRET_KEY is not set");
  }

  const integrationIds = parseIntegrationIds(process.env.PAYMOB_INTEGRATION_IDS);
  if (integrationIds.length === 0) {
    throw new Error("PAYMOB_INTEGRATION_IDS is not set or invalid");
  }

  return {
    baseUrl: (process.env.PAYMOB_BASE_URL ?? "https://accept.paymob.com").replace(
      /\/$/,
      "",
    ),
    secretKey,
    apiKey: process.env.PAYMOB_API_KEY ?? "",
    publicKey: process.env.PAYMOB_PUBLIC_KEY ?? "",
    hmacSecret: process.env.PAYMOB_HMAC_SECRET ?? "",
    currency: process.env.PAYMOB_CURRENCY ?? "USD",
    commissionRate: Number(process.env.PLATFORM_COMMISSION_RATE ?? "0.1"),
    integrationIds,
  };
}

export function buildPaymobCheckoutUrl(
  config: Pick<PaymobConfig, "baseUrl" | "publicKey">,
  clientSecret: string,
): string {
  const url = new URL(`${config.baseUrl}/unifiedcheckout/`);
  url.searchParams.set("publicKey", config.publicKey);
  url.searchParams.set("clientSecret", clientSecret);
  return url.toString();
}

/* ────────────────────────────────────────────────────────────
 * Paymob Payouts / Disbursement configuration
 * Separate credentials from the Accept (collection) API
 * ──────────────────────────────────────────────────────────── */

export interface PaymobPayoutConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  currency: string;
  instantBankMinAmount: number;
  maxWithdrawalAmount: number;
  hmacSecret: string;
  hmacSecretPrev?: string;
}

/**
 * Returns Paymob Payout (Instant Cashin / Disbursement) OAuth configuration.
 * Docs: https://payouts.paymobsolutions.com/docs/
 */
export function getPaymobPayoutConfig(): PaymobPayoutConfig {
  const clientId = process.env.PAYMOB_PAYOUT_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYMOB_PAYOUT_CLIENT_SECRET?.trim();
  const username = process.env.PAYMOB_PAYOUT_USERNAME?.trim();
  const password = process.env.PAYMOB_PAYOUT_PASSWORD?.trim();

  if (!clientId || !clientSecret || !username || !password) {
    throw new Error(
      "Paymob payout OAuth credentials are not fully configured (PAYMOB_PAYOUT_CLIENT_ID, PAYMOB_PAYOUT_CLIENT_SECRET, PAYMOB_PAYOUT_USERNAME, PAYMOB_PAYOUT_PASSWORD)",
    );
  }

  return {
    baseUrl: (
      process.env.PAYMOB_PAYOUT_BASE_URL ??
      "https://stagingpayouts.paymobsolutions.com/api/secure"
    ).replace(/\/$/, ""),
    clientId,
    clientSecret,
    username,
    password,
    currency: process.env.PAYMOB_CURRENCY ?? "USD",
    instantBankMinAmount: Number(
      process.env.PAYMOB_PAYOUT_INSTANT_BANK_MIN ?? "112",
    ),
    maxWithdrawalAmount: Number(
      process.env.PAYMOB_PAYOUT_MAX_AMOUNT ?? "50000",
    ),
    hmacSecret: process.env.PAYMOB_PAYOUT_HMAC_SECRET ?? "",
    hmacSecretPrev: process.env.PAYMOB_PAYOUT_HMAC_SECRET_PREV,
  };
}

/** Returns true when payout OAuth env vars are configured. */
export function isPaymobPayoutConfigured(): boolean {
  return Boolean(
    process.env.PAYMOB_PAYOUT_CLIENT_ID?.trim() &&
      process.env.PAYMOB_PAYOUT_CLIENT_SECRET?.trim() &&
      process.env.PAYMOB_PAYOUT_USERNAME?.trim() &&
      process.env.PAYMOB_PAYOUT_PASSWORD?.trim(),
  );
}
