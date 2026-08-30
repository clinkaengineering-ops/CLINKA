const CURRENCY = "USD";

/** Format amounts as "$1,234" consistently across the app. */
export function formatMoney(amount: any, currency = CURRENCY): string {
  let numAmount = 0;
  
  if (typeof amount === "number") {
    numAmount = amount;
  } else if (typeof amount === "string") {
    numAmount = Number(amount);
  } else if (amount && typeof amount === "object") {
    // Handle Prisma Decimal passed as raw JSON object { s, e, d }
    if (amount.d !== undefined && amount.e !== undefined && amount.s !== undefined) {
      // Reconstruct the decimal value roughly, or simply rely on string representation if it has a custom toString
      if (typeof amount.toString === "function" && amount.toString() !== "[object Object]") {
        numAmount = Number(amount.toString());
      } else {
        const dStr = Array.isArray(amount.d) ? amount.d.join('') : String(amount.d);
        // Decimal.js internal representation: value = s * d * 10^(e - d.length + 1)
        // Note: For simplicity, converting it to string first based on its parts
        numAmount = amount.s * Number(dStr) * Math.pow(10, amount.e - dStr.length + 1);
      }
    } else {
      numAmount = Number(amount);
    }
  }

  if (isNaN(numAmount)) numAmount = 0;

  const hasFraction = Math.abs(numAmount % 1) > 0.001;
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency", currency: currency, maximumFractionDigits: hasFraction ? 2 : 0,
    minimumFractionDigits: hasFraction ? 2 : 0,
  }).format(numAmount);
  return formatted;
}
