import { getFawaterkConfig } from "../../config/fawaterk";
import ApiError from "../../utils/ApiError";

export interface FawaterkPaymentMethod {
  paymentId: number;
  name_en: string;
  name_ar: string;
  redirect: string;
  logo?: string;
}

export interface FawaterkCustomer {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
}

export interface FawaterkInitiatePaymentInput {
  payment_method_id: number;
  cartTotal: string;
  currency: string;
  customer: FawaterkCustomer;
  redirectionUrls: {
    successUrl: string;
    failUrl: string;
    pendingUrl: string;
    webhookUrl?: string;
  };
  cartItems: Array<{
    name: string;
    price: string;
    quantity: string;
  }>;
  payLoad?: Record<string, unknown>;
}

export interface FawaterkInitiatePaymentData {
  invoice_id: number;
  invoice_key: string;
  payment_data: {
    redirectTo?: string;
    fawryCode?: string;
    expireDate?: string;
    meezaReference?: number;
  };
}

function formatFawaterkErrorMessage(
  message: unknown,
  status: number,
): string {
  if (typeof message === "string" && message.trim()) return message;
  if (message && typeof message === "object") {
    const parts = Object.entries(message as Record<string, unknown>).map(
      ([key, value]) => {
        const text = Array.isArray(value) ? value.join(", ") : String(value);
        return `${key}: ${text}`;
      },
    );
    if (parts.length) return parts.join("; ");
  }
  return `Fawaterk request failed (${status})`;
}

async function fawaterkRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const config = getFawaterkConfig();
  const url = `${config.baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
  });

  const text = await response.text();
  let body: { status?: string; message?: unknown; data?: T };
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    throw new ApiError(502, `Fawaterk API returned invalid JSON (${response.status})`);
  }

  if (!response.ok || body.status === "error") {
    throw new ApiError(
      502,
      formatFawaterkErrorMessage(body.message, response.status),
    );
  }

  return body.data as T;
}

export async function getFawaterkPaymentMethods(): Promise<
  FawaterkPaymentMethod[]
> {
  const data = await fawaterkRequest<FawaterkPaymentMethod[]>(
    "getPaymentmethods",
    { method: "GET" },
  );
  return Array.isArray(data) ? data : [];
}

export async function initiateFawaterkPayment(
  payload: FawaterkInitiatePaymentInput,
): Promise<FawaterkInitiatePaymentData> {
  return fawaterkRequest<FawaterkInitiatePaymentData>("invoiceInitPay", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
