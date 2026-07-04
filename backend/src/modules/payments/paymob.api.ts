import { getPaymobConfig } from "../../config/paymob";
import ApiError from "../../utils/ApiError";

export interface PaymobPaymentMethod {
  paymentId: number;
  name_en: string;
  name_ar: string;
  redirect: string;
  logo?: string;
}

export interface PaymobBillingData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  apartment?: string;
  floor?: string;
  street?: string;
  building?: string;
  city?: string;
  country?: string;
  state?: string;
}

export interface PaymobCreateIntentionInput {
  amountCents: number;
  currency: string;
  paymentMethods: number[];
  items: Array<{
    name: string;
    amount: number;
    quantity: number;
    description?: string;
  }>;
  billingData: PaymobBillingData;
  specialReference: string;
  notificationUrl: string;
  redirectionUrl: string;
  extras?: Record<string, unknown>;
  expirationSeconds?: number;
}

export interface PaymobIntentionData {
  id: string;
  clientSecret: string;
  orderId: number;
}

function formatPaymobErrorMessage(message: unknown, status: number): string {
  if (typeof message === "string" && message.trim()) return message;
  if (message && typeof message === "object") {
    const obj = message as Record<string, unknown>;
    if (typeof obj.detail === "string") return obj.detail;
    const parts = Object.entries(obj).map(([key, value]) => {
      const text = Array.isArray(value) ? value.join(", ") : String(value);
      return `${key}: ${text}`;
    });
    if (parts.length) return parts.join("; ");
  }
  return `Paymob request failed (${status})`;
}

async function paymobRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const config = getPaymobConfig();
  const url = `${config.baseUrl}/${path.replace(/^\//, "")}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Token ${config.secretKey}`,
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
  });

  const text = await response.text();
  let body: Record<string, unknown>;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    throw new ApiError(502, `Paymob API returned invalid JSON (${response.status})`);
  }

  if (!response.ok) {
    throw new ApiError(
      502,
      formatPaymobErrorMessage(body.detail ?? body.message ?? body, response.status),
    );
  }

  return body as T;
}

export function listConfiguredPaymobMethods(): PaymobPaymentMethod[] {
  const config = getPaymobConfig();
  return config.integrationIds.map((integrationId, index) => ({
    paymentId: integrationId,
    name_en: `Payment method ${index + 1}`,
    name_ar: `طريقة دفع ${index + 1}`,
    redirect: "true",
  }));
}

function extractPaymobCheckoutSecret(
  payload: Record<string, unknown>,
): string | undefined {
  const directSecret = payload.client_secret ?? payload.clientSecret;
  if (typeof directSecret === "string" && directSecret.trim()) {
    return directSecret.trim();
  }

  const paymentKeys = Array.isArray(payload.payment_keys)
    ? payload.payment_keys
    : [];

  for (const paymentKey of paymentKeys) {
    if (!paymentKey || typeof paymentKey !== "object") continue;

    const candidate = paymentKey as Record<string, unknown>;
    const nestedSecret = candidate.client_secret ?? candidate.clientSecret;
    if (typeof nestedSecret === "string" && nestedSecret.trim()) {
      return nestedSecret.trim();
    }

    const keyValue = candidate.key;
    if (typeof keyValue === "string" && keyValue.trim()) {
      return keyValue.trim();
    }
  }

  return undefined;
}

export async function createPaymobIntention(
  input: PaymobCreateIntentionInput,
): Promise<PaymobIntentionData> {
  const data = await paymobRequest<{
    id?: string;
    client_secret?: string;
    clientSecret?: string;
    intention_order_id?: number;
    payment_keys?: Array<{
      order_id?: number;
      key?: string;
      client_secret?: string;
      clientSecret?: string;
    }>;
    merchant_order_id?: string;
  }>("v1/intention/", {
    method: "POST",
    body: JSON.stringify({
      amount: input.amountCents,
      currency: input.currency,
      payment_methods: input.paymentMethods,
      items: input.items,
      billing_data: {
        apartment: input.billingData.apartment ?? "NA",
        floor: input.billingData.floor ?? "NA",
        street: input.billingData.street ?? "NA",
        building: input.billingData.building ?? "NA",
        city: input.billingData.city ?? "NA",
        country: input.billingData.country ?? "EG",
        state: input.billingData.state ?? "NA",
        first_name: input.billingData.first_name,
        last_name: input.billingData.last_name,
        email: input.billingData.email,
        phone_number: input.billingData.phone_number,
        shipping_method: "NA",
        postal_code: "NA",
      },
      special_reference: input.specialReference,
      notification_url: input.notificationUrl,
      redirection_url: input.redirectionUrl,
      extras: input.extras,
      expiration: input.expirationSeconds ?? 3600,
    }),
  });

  const orderId =
    data.intention_order_id ??
    data.payment_keys?.[0]?.order_id ??
    0;
  const clientSecret = extractPaymobCheckoutSecret(data as Record<string, unknown>);

  if (!clientSecret) {
    throw new ApiError(502, "Paymob intention response missing checkout secret");
  }

  return {
    id: data.id ?? input.specialReference,
    clientSecret,
    orderId,
  };
}
