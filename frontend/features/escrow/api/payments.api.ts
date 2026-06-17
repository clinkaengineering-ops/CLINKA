import api from "@/lib/axios";
import type { ApiResponse } from "@/features/engineers/api/engineer.api";
import type {
  CheckoutResult,
  EngineerBalanceSummary,
  EscrowPaymentItem,
  FawaterkPaymentMethod,
  InitiateCheckoutPayload,
} from "../types";

const unwrap = <T>(promise: Promise<{ data: ApiResponse<T> }>) =>
  promise.then((r) => r.data.data);

/** GET /payments/methods */
export const fetchPaymentMethods = (): Promise<FawaterkPaymentMethod[]> =>
  unwrap(
    api.get<ApiResponse<FawaterkPaymentMethod[]>>("/payments/methods"),
  ).then((d) => d ?? []);

/** GET /payments/escrow */
export const fetchEscrowPayments = (): Promise<EscrowPaymentItem[]> =>
  unwrap(api.get<ApiResponse<EscrowPaymentItem[]>>("/payments/escrow")).then(
    (d) => d ?? [],
  );

/** GET /payments/engineer/escrow */
export const fetchEngineerEscrowPayments = (): Promise<EscrowPaymentItem[]> =>
  unwrap(
    api.get<ApiResponse<EscrowPaymentItem[]>>("/payments/engineer/escrow"),
  ).then((d) => d ?? []);

/** GET /payments/engineer/balance */
export const fetchEngineerBalance = (): Promise<EngineerBalanceSummary> =>
  unwrap(
    api.get<ApiResponse<EngineerBalanceSummary>>("/payments/engineer/balance"),
  );

export interface CheckoutSession {
  hashKey: string;
  envType: "test" | "live";
  currency: string;
  projectId: number;
  projectTitle: string;
  paymentId: number;
  amount: number;
  pluginRequest: {
    cartTotal: string;
    currency: string;
    customer: {
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      address: string;
    };
    redirectionUrls: {
      successUrl: string;
      failUrl: string;
      pendingUrl: string;
    };
    cartItems: Array<{ name: string; price: string; quantity: string }>;
    payLoad: { projectId: number; paymentId: number };
  };
}

/** GET /payments/projects/:projectId/checkout-session — Fawaterak IFrame config */
export const fetchCheckoutSession = (
  projectId: number,
  phone?: string,
  address?: string,
): Promise<CheckoutSession> =>
  unwrap(
    api.get<ApiResponse<CheckoutSession>>(
      `/payments/projects/${projectId}/checkout-session`,
      { params: { phone, address } },
    ),
  );

/** POST /payments/projects/:projectId/checkout */
export const initiateCheckout = (
  projectId: number,
  payload: InitiateCheckoutPayload,
): Promise<CheckoutResult> =>
  unwrap(
    api.post<ApiResponse<CheckoutResult>>(
      `/payments/projects/${projectId}/checkout`,
      {
        paymentMethodId: payload.paymentMethodId,
        phone: payload.phone,
        address: payload.address,
      },
    ),
  ).then((d) => {
    if (!d) throw new Error("Checkout failed");
    return d;
  });

/** POST /payments/:paymentId/release */
export const releaseEscrowPayment = (paymentId: number): Promise<unknown> =>
  unwrap(api.post<ApiResponse<unknown>>(`/payments/${paymentId}/release`));

/** POST /payments/:paymentId/refund */
export const refundEscrowPayment = (paymentId: number): Promise<unknown> =>
  unwrap(api.post<ApiResponse<unknown>>(`/payments/${paymentId}/refund`));

/** GET /payments/escrow/:paymentId */
export const fetchEscrowPaymentById = (paymentId: number) =>
  unwrap(api.get<ApiResponse<unknown>>(`/payments/escrow/${paymentId}`));

/** GET /payments/projects/:projectId */
export const fetchProjectPayment = (projectId: number) =>
  unwrap(api.get<ApiResponse<unknown>>(`/payments/projects/${projectId}`));
