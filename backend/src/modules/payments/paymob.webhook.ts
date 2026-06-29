import crypto from "crypto";

export interface PaymobTransactionObject {
  id: number;
  success: boolean;
  amount_cents: number;
  created_at: string;
  currency: string;
  error_occured: boolean;
  has_parent_transaction: boolean;
  integration_id: number;
  is_3d_secure: boolean;
  is_auth: boolean;
  is_capture: boolean;
  is_refunded: boolean;
  is_standalone_payment: boolean;
  is_voided: boolean;
  owner: number;
  pending: boolean;
  order?: {
    id?: number;
    merchant_order_id?: string | null;
  };
  source_data?: {
    pan?: string;
    sub_type?: string;
    type?: string;
  };
}

/** Validates Paymob transaction callback HMAC (SHA512). */
export function verifyPaymobTransactionHmac(
  transaction: PaymobTransactionObject,
  receivedHmac: string,
  hmacSecret: string,
): boolean {
  if (!hmacSecret || !receivedHmac) return false;

  const source = transaction.source_data ?? {};
  const orderId = transaction.order?.id ?? "";

  const fields = [
    transaction.amount_cents,
    transaction.created_at,
    transaction.currency,
    transaction.error_occured,
    transaction.has_parent_transaction,
    transaction.id,
    transaction.integration_id,
    transaction.is_3d_secure,
    transaction.is_auth,
    transaction.is_capture,
    transaction.is_refunded,
    transaction.is_standalone_payment,
    transaction.is_voided,
    orderId,
    transaction.owner,
    transaction.pending,
    source.pan ?? "",
    source.sub_type ?? "",
    source.type ?? "",
    transaction.success,
  ];

  const computed = crypto
    .createHmac("sha512", hmacSecret)
    .update(fields.map(String).join(""))
    .digest("hex");

  if (computed.length !== receivedHmac.length) return false;

  return crypto.timingSafeEqual(
    Buffer.from(computed),
    Buffer.from(receivedHmac),
  );
}

export function parsePaymobSpecialReference(
  reference: string | null | undefined,
): { paymentId?: number; projectId?: number } | null {
  if (!reference?.trim()) return null;

  const paymentMatch = reference.match(/payment[-_]?(\d+)/i);
  if (paymentMatch) {
    return { paymentId: Number(paymentMatch[1]) };
  }

  const numeric = Number(reference);
  if (Number.isInteger(numeric) && numeric > 0) {
    return { paymentId: numeric };
  }

  return null;
}
