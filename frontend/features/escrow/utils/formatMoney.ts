const CURRENCY = process.env.NEXT_PUBLIC_PAYMENT_CURRENCY ?? "EGP";

export function formatMoney(amount: number, currency = CURRENCY): string {
  try {
    return new Intl.NumberFormat("en-EG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}
