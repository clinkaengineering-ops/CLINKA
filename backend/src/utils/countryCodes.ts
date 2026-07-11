/** Common non-ISO inputs → ISO 3166-1 alpha-2 */
const COUNTRY_ALIASES: Record<string, string> = {
  UK: "GB",
  "UNITED KINGDOM": "GB",
  "GREAT BRITAIN": "GB",
  ENGLAND: "GB",
  USA: "US",
  "UNITED STATES": "US",
  "UNITED STATES OF AMERICA": "US",
  UAE: "AE",
  "UNITED ARAB EMIRATES": "AE",
  EGYPT: "EG",
  GERMANY: "DE",
  FRANCE: "FR",
  SAUDI: "SA",
  "SAUDI ARABIA": "SA",
  CANADA: "CA",
  AUSTRALIA: "AU",
};

export function normalizeCountryCode(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  const upper = trimmed.toUpperCase();
  if (COUNTRY_ALIASES[upper]) return COUNTRY_ALIASES[upper];
  if (/^[A-Z]{2}$/.test(upper)) return upper;
  return upper;
}

export function isValidCountryCode(code: string): boolean {
  return /^[A-Z]{2}$/.test(code);
}
