export type CheckoutReturnStatus = "success" | "fail" | "pending";

export interface ParsedCheckoutReturn {
  isReturn: boolean;
  status: CheckoutReturnStatus | null;
  projectId?: number;
  paymentId?: number;
  orderId?: number;
  transactionId?: number;
  specialReference?: string;
  merchantOrderId?: string;
}

function parsePositiveInt(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : undefined;
}

function parsePaymentIdFromReference(raw: string | null): number | undefined {
  if (!raw?.trim()) return undefined;
  const match = raw.match(/payment[-_]?(\d+)/i);
  if (match) return Number(match[1]);
  return parsePositiveInt(raw);
}

function parseOrderId(raw: string | null): number | undefined {
  if (!raw?.trim()) return undefined;
  const numeric = Number(raw);
  if (Number.isInteger(numeric) && numeric > 0) return numeric;

  const match = raw.match(/(\d+)/);
  if (match) return Number(match[1]);

  return undefined;
}

function firstParam(
  searchParams: URLSearchParams,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = searchParams.get(key);
    if (value?.trim()) return value.trim();
  }
  return null;
}

/** Map Paymob redirect query params + our checkout return params. */
export function parseCheckoutReturn(
  searchParams: URLSearchParams,
): ParsedCheckoutReturn {
  const statusParam = searchParams.get("status");
  const paymobSuccess = searchParams.get("success");
  const paymobPending = searchParams.get("pending");

  let status: CheckoutReturnStatus | null = null;
  if (
    statusParam === "success" ||
    statusParam === "fail" ||
    statusParam === "pending"
  ) {
    status = statusParam;
  } else if (paymobSuccess === "true") {
    status = "success";
  } else if (paymobSuccess === "false") {
    status = "fail";
  } else if (paymobPending === "true") {
    status = "pending";
  }

  const projectId = parsePositiveInt(firstParam(searchParams, ["projectId", "project_id"]));
  const merchantOrderId =
    firstParam(searchParams, ["merchant_order_id", "merchantOrderId"]) ?? undefined;
  const specialReference =
    firstParam(searchParams, ["special_reference", "specialReference"]) ?? undefined;

  const paymentId =
    parsePositiveInt(firstParam(searchParams, ["paymentId", "payment_id"])) ??
    parsePaymentIdFromReference(merchantOrderId ?? null) ??
    parsePaymentIdFromReference(specialReference ?? null);

  // Paymob appends `id` as the transaction id and `order` as the order id.
  const transactionId = parsePositiveInt(
    firstParam(searchParams, ["id", "transaction_id", "transactionId", "txn_id"]),
  );
  const orderId =
    parsePositiveInt(firstParam(searchParams, ["order", "order_id", "orderId"])) ??
    parseOrderId(merchantOrderId ?? null);

  // `projectId` alone is the normal checkout entry (/checkout?projectId=10), not a Paymob return.
  const isReturn =
    status !== null ||
    paymentId !== undefined ||
    orderId !== undefined ||
    transactionId !== undefined ||
    specialReference !== undefined ||
    merchantOrderId !== undefined ||
    paymobSuccess !== null ||
    paymobPending !== null ||
    searchParams.has("id") ||
    searchParams.has("order");

  return {
    isReturn,
    status,
    projectId,
    paymentId,
    orderId,
    transactionId,
    specialReference,
    merchantOrderId,
  };
}
