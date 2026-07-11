/** ISO 13616 mod-97 IBAN check (matches backend validation). */
export function isValidIban(value: string): boolean {
  const normalized = value.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(normalized)) return false;
  if (normalized.length < 15 || normalized.length > 34) return false;

  const rearranged = normalized.slice(4) + normalized.slice(0, 4);
  const numeric = rearranged
    .split("")
    .map((ch) => (ch >= "A" && ch <= "Z" ? (ch.charCodeAt(0) - 55).toString() : ch))
    .join("");
  let remainder = numeric;
  while (remainder.length > 2) {
    const block = remainder.slice(0, 9);
    remainder = (Number(block) % 97).toString() + remainder.slice(block.length);
  }
  return Number(remainder) % 97 === 1;
}

export function isValidSwiftBic(value: string): boolean {
  return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/i.test(value.trim());
}

export function isValidCountryCode(value: string): boolean {
  return /^[A-Z]{2}$/i.test(value.trim());
}
