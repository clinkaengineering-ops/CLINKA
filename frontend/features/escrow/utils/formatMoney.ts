const CURRENCY = process.env.NEXT_PUBLIC_PAYMENT_CURRENCY ?? "EGP";

/** Format amounts as "1,234 EGP" consistently across the app. */
export function formatMoney(amount: number, currency = CURRENCY): string {
  const hasFraction = Math.abs(amount % 1) > 0.001;
  const formatted = new Intl.NumberFormat("en-EG", {
    maximumFractionDigits: hasFraction ? 2 : 0,
    minimumFractionDigits: hasFraction ? 2 : 0,
  }).format(amount);
  return `${formatted} ${currency}`;
}
