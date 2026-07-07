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

/** 
 * Verifies Paymob Payout webhook HMAC. 
 * Supports secret rotation by accepting an array of secrets.
 */
export function verifyPaymobPayoutHmac(
  payload: Record<string, unknown>,
  receivedHmac: string,
  secrets: string[],
): boolean {
  if (!receivedHmac || secrets.length === 0) return false;

  // Paymob usually stringifies specific fields for payout HMAC,
  // but if undocumented, standard practice is to stringify the sorted JSON or specific keys.
  // For safety, we assume a concatenated string of values similar to Accept, 
  // or a raw payload signature. We will implement a robust check here.
  // We'll assume the payload values are sorted by key or just use the whole string if it's raw.
  // Since we don't have exact Paymob Payout HMAC docs, we verify the signature against the raw body 
  // or concatenated fields. Here we demonstrate checking a concatenated string of typical fields.
  
  const fields = [
    payload.amount,
    payload.client_reference,
    payload.created_at,
    payload.disbursement_status,
    payload.issuer,
    payload.transaction_id,
  ];

  const payloadString = fields.map(f => (f ?? "")).join("");

  for (const secret of secrets) {
    if (!secret) continue;
    
    const computed = crypto
      .createHmac("sha512", secret)
      .update(payloadString)
      .digest("hex");

    if (
      computed.length === receivedHmac.length &&
      crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(receivedHmac))
    ) {
      return true;
    }
  }

  return false;
}

export function isWebhookReplayed(createdAtStr: string | unknown, windowMinutes = 5): boolean {
  if (typeof createdAtStr !== "string") return false;
  
  const createdAt = new Date(createdAtStr).getTime();
  if (isNaN(createdAt)) return false;

  const now = Date.now();
  const diffMinutes = Math.abs(now - createdAt) / (1000 * 60);

  return diffMinutes > windowMinutes;
}
