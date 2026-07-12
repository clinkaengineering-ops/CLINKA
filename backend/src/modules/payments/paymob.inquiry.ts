import { getPaymobConfig } from "../../config/paymob";
import ApiError from "../../utils/ApiError";
import type { PaymobTransactionObject } from "./paymob.webhook";
import { parsePaymobSpecialReference } from "./paymob.webhook";

function amountToCents(amount: number) {
  return Math.round(amount * 100);
}

function normalizePaymobTransaction(
  raw: Record<string, unknown>,
): PaymobTransactionObject | null {
  const id = raw.id;
  if (typeof id !== "number" || !Number.isFinite(id)) return null;

  const orderRaw = raw.order;
  const order =
    orderRaw && typeof orderRaw === "object"
      ? {
          id:
            typeof (orderRaw as { id?: unknown }).id === "number"
              ? (orderRaw as { id: number }).id
              : undefined,
          merchant_order_id:
            typeof (orderRaw as { merchant_order_id?: unknown })
              .merchant_order_id === "string"
              ? (orderRaw as { merchant_order_id: string }).merchant_order_id
              : ((orderRaw as { merchant_order_id?: unknown })
                  .merchant_order_id as string | null | undefined) ?? null,
        }
      : typeof orderRaw === "number"
        ? { id: orderRaw, merchant_order_id: null }
        : undefined;

  const sourceRaw = raw.source_data;
  const source_data =
    sourceRaw && typeof sourceRaw === "object"
      ? {
          pan:
            typeof (sourceRaw as { pan?: unknown }).pan === "string"
              ? (sourceRaw as { pan: string }).pan
              : undefined,
          sub_type:
            typeof (sourceRaw as { sub_type?: unknown }).sub_type === "string"
              ? (sourceRaw as { sub_type: string }).sub_type
              : undefined,
          type:
            typeof (sourceRaw as { type?: unknown }).type === "string"
              ? (sourceRaw as { type: string }).type
              : undefined,
        }
      : undefined;

  return {
    id,
    success: Boolean(raw.success),
    amount_cents:
      typeof raw.amount_cents === "number" ? raw.amount_cents : 0,
    created_at:
      typeof raw.created_at === "string" ? raw.created_at : new Date().toISOString(),
    currency: typeof raw.currency === "string" ? raw.currency : "USD",
    error_occured: Boolean(raw.error_occured ?? raw.error_occured),
    has_parent_transaction: Boolean(raw.has_parent_transaction),
    integration_id:
      typeof raw.integration_id === "number" ? raw.integration_id : 0,
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

let cachedAuthToken: string | null = null;
let authTokenExpiresAt = 0;

/** Inquiry APIs use the legacy API-key bearer token, not the intention secret key. */
async function getPaymobInquiryAuthToken(): Promise<string> {
  if (cachedAuthToken && Date.now() < authTokenExpiresAt) {
    return cachedAuthToken;
  }

  const config = getPaymobConfig();
  if (!config.apiKey?.trim()) {
    throw new ApiError(
      500,
      "PAYMOB_API_KEY is required to verify payments with Paymob",
    );
  }

  const response = await fetch(`${config.baseUrl}/api/auth/tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: config.apiKey }),
  });

  if (!response.ok) {
    throw new ApiError(502, "Failed to authenticate with Paymob API");
  }

  const data = (await response.json()) as { token: string };
  cachedAuthToken = data.token;
  authTokenExpiresAt = Date.now() + 3500 * 1000;
  return data.token;
}

async function paymobInquiryRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T | null> {
  const config = getPaymobConfig();
  const authToken = await getPaymobInquiryAuthToken();
  const url = `${config.baseUrl}/${path.replace(/^\//, "")}`;

  let finalBody = options.body;
  if (options.method === "POST" && typeof options.body === "string") {
    try {
      const parsedBody = JSON.parse(options.body) as Record<string, unknown>;
      parsedBody.auth_token = authToken;
      finalBody = JSON.stringify(parsedBody);
    } catch {
      // ignore
    }
  }

  const response = await fetch(url, {
    ...options,
    body: finalBody,
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
  });

  if (response.status === 404) return null;

  const text = await response.text();
  let body: Record<string, unknown>;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    throw new ApiError(502, `Paymob inquiry returned invalid JSON (${response.status})`);
  }

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new ApiError(
      502,
      typeof body.detail === "string"
        ? body.detail
        : `Paymob inquiry failed (${response.status})`,
    );
  }

  return body as T;
}

/** Fetch a single transaction directly from Paymob by transaction ID. */
export async function fetchPaymobTransactionById(
  transactionId: number,
): Promise<PaymobTransactionObject | null> {
  const data = await paymobInquiryRequest<Record<string, unknown>>(
    `api/acceptance/transactions/${transactionId}`,
    { method: "GET" },
  );
  return data ? normalizePaymobTransaction(data) : null;
}

/** Look up the latest transaction for a Paymob order ID. */
export async function inquirePaymobTransactionByOrderId(
  orderId: number,
): Promise<PaymobTransactionObject | null> {
  const data = await paymobInquiryRequest<Record<string, unknown>>(
    "api/ecommerce/orders/transaction_inquiry",
    {
      method: "POST",
      body: JSON.stringify({ order_id: orderId }),
    },
  );
  return data ? normalizePaymobTransaction(data) : null;
}

/** Look up a transaction using our merchant reference (special_reference). */
export async function inquirePaymobTransactionByMerchantOrderId(
  merchantOrderId: string,
): Promise<PaymobTransactionObject | null> {
  const data = await paymobInquiryRequest<Record<string, unknown>>(
    "api/ecommerce/orders/transaction_inquiry",
    {
      method: "POST",
      body: JSON.stringify({ merchant_order_id: merchantOrderId }),
    },
  );
  return data ? normalizePaymobTransaction(data) : null;
}

export function getExpectedAmountCents(payment: {
  amount: number | { toString(): string };
  commission: number | { toString(): string };
}) {
  const amount =
    typeof payment.amount === "number"
      ? payment.amount
      : Number(payment.amount.toString());
  const commission =
    typeof payment.commission === "number"
      ? payment.commission
      : Number(payment.commission.toString());
  return amountToCents(amount + commission);
}

/** Validates that a Paymob transaction is a successful, final payment for the expected amount. */
export function validatePaymobTransactionForPayment(
  transaction: PaymobTransactionObject,
  payment: {
    amount: number | { toString(): string };
    commission: number | { toString(): string };
    gatewayInvoiceId?: string | null;
    id: number;
  },
  integrationIds: number[],
): void {
  if (transaction.pending) {
    throw new ApiError(402, "Payment is still pending confirmation from Paymob");
  }
  if (!transaction.success) {
    throw new ApiError(402, "Payment was not successful");
  }
  if (transaction.is_refunded) {
    throw new ApiError(402, "Payment was refunded");
  }
  if (transaction.is_voided) {
    throw new ApiError(402, "Payment was voided");
  }

  const expectedCents = getExpectedAmountCents(payment);
  if (transaction.amount_cents !== expectedCents) {
    throw new ApiError(
      502,
      `Payment amount mismatch: expected ${expectedCents} cents, got ${transaction.amount_cents}`,
    );
  }

  if (
    integrationIds.length > 0 &&
    !integrationIds.includes(transaction.integration_id)
  ) {
    throw new ApiError(502, "Payment integration is not authorized");
  }

  if (
    payment.gatewayInvoiceId &&
    transaction.order?.id &&
    String(transaction.order.id) !== payment.gatewayInvoiceId
  ) {
    const refPaymentId = parsePaymobSpecialReference(
      transaction.order.merchant_order_id,
    )?.paymentId;
    if (refPaymentId !== payment.id) {
      throw new ApiError(502, "Transaction order does not match this payment");
    }
  }
}
