export type CheckoutReturnStatus = "success" | "fail" | "pending";

export interface ParsedCheckoutReturn {
  isReturn: boolean;
  status: CheckoutReturnStatus | null;
  projectId?: number;
  paymentId?: number;
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

  const projectId = parsePositiveInt(searchParams.get("projectId"));
  const paymentId =
    parsePositiveInt(searchParams.get("paymentId")) ??
    parsePaymentIdFromReference(searchParams.get("merchant_order_id")) ??
    parsePaymentIdFromReference(searchParams.get("special_reference"));

  const isReturn =
    status !== null ||
    projectId !== undefined ||
    paymentId !== undefined ||
    paymobSuccess !== null ||
    searchParams.has("id") ||
    searchParams.has("order");

  return { isReturn, status, projectId, paymentId };
}
