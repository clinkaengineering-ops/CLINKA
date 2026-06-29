export interface PaymobConfig {
  baseUrl: string;
  secretKey: string;
  publicKey: string;
  hmacSecret: string;
  currency: string;
  commissionRate: number;
  integrationIds: number[];
}

function parseIntegrationIds(raw: string | undefined): number[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);
}

export function getPaymobConfig(): PaymobConfig {
  const secretKey = process.env.PAYMOB_SECRET_KEY;
  if (!secretKey) {
    throw new Error("PAYMOB_SECRET_KEY is not set");
  }

  const integrationIds = parseIntegrationIds(process.env.PAYMOB_INTEGRATION_IDS);
  if (integrationIds.length === 0) {
    throw new Error("PAYMOB_INTEGRATION_IDS is not set or invalid");
  }

  return {
    baseUrl: (process.env.PAYMOB_BASE_URL ?? "https://accept.paymob.com").replace(
      /\/$/,
      "",
    ),
    secretKey,
    publicKey: process.env.PAYMOB_PUBLIC_KEY ?? "",
    hmacSecret: process.env.PAYMOB_HMAC_SECRET ?? "",
    currency: process.env.PAYMOB_CURRENCY ?? "EGP",
    commissionRate: Number(process.env.PLATFORM_COMMISSION_RATE ?? "0.1"),
    integrationIds,
  };
}

export function buildPaymobCheckoutUrl(
  config: Pick<PaymobConfig, "baseUrl" | "publicKey">,
  clientSecret: string,
): string {
  const url = new URL(`${config.baseUrl}/unifiedcheckout/`);
  url.searchParams.set("publicKey", config.publicKey);
  url.searchParams.set("clientSecret", clientSecret);
  return url.toString();
}
