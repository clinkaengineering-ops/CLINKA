import { randomUUID } from "crypto";
import { cacheGet, cacheSet } from "../../config/redis";
import {
  getPaymobPayoutConfig,
  isPaymobPayoutConfigured,
} from "../../config/paymob";
import ApiError from "../../utils/ApiError";

const ACCESS_TOKEN_KEY = "paymob:payout:access_token";
const REFRESH_TOKEN_KEY = "paymob:payout:refresh_token";

export type PaymobWalletIssuer = "vodafone" | "etisalat" | "orange";
export type PaymobBankIssuer = "instant_bank" | "bank_card";

export interface PaymobInstantCashinInput {
  issuer: PaymobWalletIssuer | PaymobBankIssuer | "bank_wallet";
  amount: number;
  nationalId: string;
  msisdn?: string;
  bankCardNumber?: string;
  bankCode?: string;
  fullName?: string;
  bankTransactionType?: "cash_transfer" | "salary";
  clientReference?: string;
  customerBearsFees?: boolean;
}

export interface PaymobInstantCashinResult {
  transactionId: string | null;
  disbursementStatus: string;
  statusCode: string;
  statusDescription: string;
  issuer: string;
  amount: number;
  clientReference: string;
  raw: Record<string, unknown>;
}

export interface PaymobInquiryTransaction {
  transactionId: string;
  issuer: string;
  amount: number;
  disbursementStatus: string;
  statusCode: string;
  statusDescription: string;
  clientReference?: string;
  raw: Record<string, unknown>;
}

export interface PaymobBulkInquiryResult {
  count: number;
  results: PaymobInquiryTransaction[];
}

interface PaymobTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number | string;
  token_type: string;
}

function formatPaymobPayoutError(message: unknown, status: number): string {
  if (typeof message === "string" && message.trim()) return message;
  if (message && typeof message === "object") {
    const obj = message as Record<string, unknown>;
    if (typeof obj.status_description === "string") return obj.status_description;
    if (typeof obj.error_description === "string") return obj.error_description;
    if (typeof obj.detail === "string") return obj.detail;
    const parts = Object.entries(obj).map(([key, value]) => {
      const text = Array.isArray(value) ? value.join(", ") : String(value);
      return `${key}: ${text}`;
    });
    if (parts.length) return parts.join("; ");
  }
  return `Paymob payout request failed (${status})`;
}

async function requestPayoutToken(
  body: URLSearchParams,
): Promise<PaymobTokenResponse> {
  const config = getPaymobPayoutConfig();
  const credentials = Buffer.from(
    `${config.clientId}:${config.clientSecret}`,
  ).toString("base64");

  const response = await fetch(`${config.baseUrl}/o/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const text = await response.text();
  let payload: Record<string, unknown>;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    throw new ApiError(502, "Paymob payout token response was invalid JSON");
  }

  if (!response.ok) {
    throw new ApiError(
      502,
      formatPaymobPayoutError(
        payload.error_description ?? payload.error ?? payload,
        response.status,
      ),
    );
  }

  return payload as unknown as PaymobTokenResponse;
}

async function storePayoutTokens(data: PaymobTokenResponse) {
  const expiresIn = Number(data.expires_in) || 3600;
  const ttl = Math.max(60, expiresIn - 120);
  await cacheSet(ACCESS_TOKEN_KEY, data.access_token, ttl);
  if (data.refresh_token) {
    await cacheSet(REFRESH_TOKEN_KEY, data.refresh_token, 60 * 60 * 24 * 30);
  }
}

async function generatePayoutAccessToken(): Promise<string> {
  const config = getPaymobPayoutConfig();
  const data = await requestPayoutToken(
    new URLSearchParams({
      grant_type: "password",
      username: config.username,
      password: config.password,
    }),
  );
  await storePayoutTokens(data);
  return data.access_token;
}

async function refreshPayoutAccessToken(refreshToken: string): Promise<string> {
  const data = await requestPayoutToken(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  );
  await storePayoutTokens(data);
  return data.access_token;
}

export async function getPaymobPayoutAccessToken(): Promise<string> {
  const cached = await cacheGet(ACCESS_TOKEN_KEY);
  if (cached) return cached;

  const refreshToken = await cacheGet(REFRESH_TOKEN_KEY);
  if (refreshToken) {
    try {
      return await refreshPayoutAccessToken(refreshToken);
    } catch {
      // Fall back to password grant below.
    }
  }

  return generatePayoutAccessToken();
}

export function detectWalletIssuerFromMsisdn(
  msisdn: string,
): PaymobWalletIssuer {
  const digits = msisdn.replace(/\D/g, "");
  if (digits.startsWith("010")) return "vodafone";
  if (digits.startsWith("011")) return "etisalat";
  if (digits.startsWith("012")) return "orange";
  throw new ApiError(
    400,
    "Could not detect mobile wallet provider. Use a Vodafone (010), Etisalat (011), or Orange (012) number.",
  );
}

export function normalizeEgyptianMsisdn(msisdn: string): string {
  const digits = msisdn.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("1")) {
    return `0${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("01")) {
    return digits;
  }
  throw new ApiError(400, "Enter a valid Egyptian mobile wallet number");
}

export function normalizeNationalId(nationalId: string): string {
  const digits = nationalId.replace(/\D/g, "");
  if (!/^\d{14}$/.test(digits)) {
    throw new ApiError(400, "National ID must be exactly 14 digits");
  }
  return digits;
}

function buildInstantCashinBody(input: PaymobInstantCashinInput) {
  const clientReference = input.clientReference ?? randomUUID();
  const body: Record<string, unknown> = {
    issuer: input.issuer,
    amount: input.amount,
    national_id: input.nationalId,
    client_reference: clientReference,
    customer_bears_fees: input.customerBearsFees ?? false,
  };

  if (input.msisdn) body.msisdn = input.msisdn;
  if (input.bankCardNumber) body.bank_card_number = input.bankCardNumber;
  if (input.bankCode) body.bank_code = input.bankCode;
  if (input.fullName) body.full_name = input.fullName;
  if (input.bankTransactionType) {
    body.bank_transaction_type = input.bankTransactionType;
  }

  return { body, clientReference };
}

function normalizeInquiryTransaction(
  raw: Record<string, unknown>,
): PaymobInquiryTransaction | null {
  const transactionId = raw.transaction_id;
  if (typeof transactionId !== "string" || !transactionId.trim()) return null;

  return {
    transactionId: transactionId.trim(),
    issuer: String(raw.issuer ?? ""),
    amount: Number(raw.amount ?? 0),
    disbursementStatus: String(
      raw.disbursement_status ?? raw.transaction_status ?? "failed",
    ),
    statusCode: String(raw.status_code ?? ""),
    statusDescription: String(raw.status_description ?? ""),
    clientReference:
      typeof raw.client_reference === "string"
        ? raw.client_reference
        : typeof raw.reference === "string"
          ? raw.reference
          : undefined,
    raw,
  };
}

async function payoutAuthorizedRequest(
  path: string,
  options: RequestInit = {},
  retryOnUnauthorized = true,
): Promise<Response> {
  const config = getPaymobPayoutConfig();
  const accessToken = await getPaymobPayoutAccessToken();
  const url = `${config.baseUrl}/${path.replace(/^\//, "")}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
  });

  if (response.status === 401 && retryOnUnauthorized) {
    await cacheSet(ACCESS_TOKEN_KEY, "", 1);
    const freshToken = await getPaymobPayoutAccessToken();
    return fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${freshToken}`,
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      },
    });
  }

  return response;
}

export async function createPaymobInstantCashin(
  input: PaymobInstantCashinInput,
): Promise<PaymobInstantCashinResult> {
  if (!isPaymobPayoutConfigured()) {
    throw new ApiError(
      503,
      "Paymob payout is not configured (missing PAYMOB_PAYOUT_* credentials)",
    );
  }

  const config = getPaymobPayoutConfig();
  const { body, clientReference } = buildInstantCashinBody(input);
  const response = await payoutAuthorizedRequest("disburse/", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let payload: Record<string, unknown>;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    throw new ApiError(502, "Paymob payout response was invalid JSON");
  }

  if (!response.ok) {
    throw new ApiError(
      502,
      formatPaymobPayoutError(
        payload.status_description ?? payload.detail ?? payload,
        response.status,
      ),
    );
  }

  const disbursementStatus = String(
    payload.disbursement_status ?? payload.status ?? "failed",
  );
  const statusDescription =
    typeof payload.status_description === "string"
      ? payload.status_description
      : typeof payload.status_description === "object"
        ? JSON.stringify(payload.status_description)
        : "Paymob payout response received";

  return {
    transactionId:
      typeof payload.transaction_id === "string"
        ? payload.transaction_id
        : payload.transaction_id != null
          ? String(payload.transaction_id)
          : null,
    disbursementStatus,
    statusCode: String(payload.status_code ?? response.status),
    statusDescription,
    issuer: String(payload.issuer ?? input.issuer),
    amount: Number(payload.amount ?? input.amount),
    clientReference,
    raw: payload,
  };
}

/** Bulk inquiry by transaction IDs and/or client references (max 50 per request). */
export async function inquirePaymobPayoutTransactions(
  ids: string[],
  options?: { bankTransactions?: boolean },
): Promise<PaymobBulkInquiryResult> {
  if (!isPaymobPayoutConfigured()) {
    throw new ApiError(503, "Paymob payout is not configured");
  }
  if (ids.length === 0) {
    return { count: 0, results: [] };
  }

  const response = await payoutAuthorizedRequest("transaction/inquire/", {
    method: "POST",
    body: JSON.stringify({
      transactions_ids_list: ids.slice(0, 50),
      ...(options?.bankTransactions ? { bank_transactions: true } : {}),
    }),
  });

  const text = await response.text();
  let payload: Record<string, unknown>;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    throw new ApiError(502, "Paymob payout inquiry response was invalid JSON");
  }

  if (!response.ok) {
    throw new ApiError(
      502,
      formatPaymobPayoutError(
        payload.status_description ?? payload.detail ?? payload,
        response.status,
      ),
    );
  }

  const resultsRaw = Array.isArray(payload.results) ? payload.results : [];
  const results = resultsRaw
    .map((item) =>
      item && typeof item === "object"
        ? normalizeInquiryTransaction(item as Record<string, unknown>)
        : null,
    )
    .filter((item): item is PaymobInquiryTransaction => item !== null);

  return {
    count: Number(payload.count ?? results.length),
    results,
  };
}
