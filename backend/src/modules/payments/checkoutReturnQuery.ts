import { parsePaymobSpecialReference } from "./paymob.webhook";

export type ParsedCheckoutReturnQuery = {
  projectId?: number;
  paymentId?: number;
  orderId?: number;
  transactionId?: number;
  specialReference?: string;
  merchantOrderId?: string;
};

function parsePositiveInt(raw: string | null | undefined): number | undefined {
  if (!raw?.trim()) return undefined;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : undefined;
}

function parsePaymentIdFromReference(raw: string | null | undefined): number | undefined {
  if (!raw?.trim()) return undefined;
  const match = raw.match(/payment[-_]?(\d+)/i);
  if (match) return Number(match[1]);
  return parsePositiveInt(raw);
}

function firstParam(
  params: URLSearchParams,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = params.get(key);
    if (value?.trim()) return value.trim();
  }
  return null;
}

export function parseCheckoutReturnQuery(
  returnQuery?: string | null,
): ParsedCheckoutReturnQuery {
  if (!returnQuery?.trim()) return {};

  const normalized = returnQuery.startsWith("?") ? returnQuery : `?${returnQuery}`;
  const params = new URLSearchParams(normalized);

  const projectId = parsePositiveInt(firstParam(params, ["projectId", "project_id"]));
  const merchantOrderId =
    firstParam(params, ["merchant_order_id", "merchantOrderId"]) ?? undefined;
  const specialReference =
    firstParam(params, ["special_reference", "specialReference"]) ?? undefined;

  const paymentId =
    parsePositiveInt(firstParam(params, ["paymentId", "payment_id"])) ??
    parsePaymentIdFromReference(merchantOrderId) ??
    parsePaymentIdFromReference(specialReference);

  const transactionId = parsePositiveInt(
    firstParam(params, ["id", "transaction_id", "transactionId", "txn_id"]),
  );
  const orderId =
    parsePositiveInt(firstParam(params, ["order", "order_id", "orderId"])) ??
    parsePaymentIdFromReference(merchantOrderId);

  return {
    projectId,
    paymentId,
    orderId,
    transactionId,
    specialReference,
    merchantOrderId,
  };
}

export function collectGatewayIds(input: ParsedCheckoutReturnQuery): string[] {
  const ids = new Set<string>();
  if (input.orderId) ids.add(String(input.orderId));
  if (input.transactionId) ids.add(String(input.transactionId));
  if (input.specialReference) ids.add(input.specialReference);
  if (input.merchantOrderId) ids.add(input.merchantOrderId);

  for (const value of [input.specialReference, input.merchantOrderId]) {
    const parsed = parsePaymobSpecialReference(value);
    if (parsed?.paymentId) ids.add(String(parsed.paymentId));
  }

  return [...ids];
}
