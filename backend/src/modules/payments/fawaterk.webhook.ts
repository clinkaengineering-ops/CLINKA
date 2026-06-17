import crypto from "crypto";

/** Validates paid-invoice webhook per Fawaterak docs (HMAC SHA256). */
export function verifyPaidWebhookHash(
  invoiceId: number,
  invoiceKey: string,
  paymentMethod: string,
  hashKey: string,
  vendorKey: string,
): boolean {
  if (!vendorKey || !hashKey) return false;

  const queryParam = `InvoiceId=${invoiceId}&InvoiceKey=${invoiceKey}&PaymentMethod=${paymentMethod}`;
  const expected = crypto
    .createHmac("sha256", vendorKey)
    .update(queryParam)
    .digest("hex");

  return expected === hashKey;
}

/** Validates expired Fawry/Aman/Masary webhook. */
export function verifyExpiredWebhookHash(
  referenceId: string,
  paymentMethod: string,
  hashKey: string,
  vendorKey: string,
): boolean {
  if (!vendorKey || !hashKey) return false;

  const queryParam = `referenceId=${referenceId}&PaymentMethod=${paymentMethod}`;
  const expected = crypto
    .createHmac("sha256", vendorKey)
    .update(queryParam)
    .digest("hex");

  return expected === hashKey;
}
