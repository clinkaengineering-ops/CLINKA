import api from "@/lib/axios";
import type { ApiResponse } from "@/features/engineers/api/engineer.api";
import type {
  CheckoutResult,
  EngineerBalanceSummary,
  EscrowPaymentItem,
  InitiateCheckoutPayload,
  PaymentMethodOption,
} from "../types";

const unwrap = <T>(promise: Promise<{ data: ApiResponse<T> }>) =>
  promise.then((r) => r.data.data);

/** GET /payments/methods */
export const fetchPaymentMethods = (): Promise<PaymentMethodOption[]> =>
  unwrap(
    api.get<ApiResponse<PaymentMethodOption[]>>("/payments/methods"),
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
  checkoutUrl: string | null;
  clientSecret: string | null;
  intentionId: string | null;
  orderId: number | null;
  currency: string;
  projectId: number;
  projectTitle: string;
  paymentId: number;
  amount: number;
  commission?: number;
  totalCharged?: number;
}

/** GET /payments/projects/:projectId/checkout-session — Paymob Unified Checkout */
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
export const fetchEscrowPaymentById = (
  paymentId: number,
): Promise<EscrowPaymentItem> =>
  unwrap(api.get<ApiResponse<EscrowPaymentItem>>(`/payments/escrow/${paymentId}`)).then(
    (d) => {
      if (!d) throw new Error("Payment not found");
      return d;
    },
  );

/** GET /payments/projects/:projectId */
export const fetchProjectPayment = (projectId: number) =>
  unwrap(api.get<ApiResponse<unknown>>(`/payments/projects/${projectId}`));

/** GET /payments/gateway/:gatewayId */
export const fetchPaymentByGatewayId = (gatewayId: string) =>
  unwrap(api.get<ApiResponse<unknown>>(`/payments/gateway/${encodeURIComponent(gatewayId)}`));

/** POST /payments/verify-return — resolve Paymob return params and verify escrow */
export const verifyCheckoutReturn = (payload: {
  projectId?: number;
  paymentId?: number;
  orderId?: number;
  transactionId?: number;
  specialReference?: string;
  merchantOrderId?: string;
  returnQuery?: string;
}): Promise<{ id: number; projectId: number; status: string }> =>
  unwrap(
    api.post<ApiResponse<{ id: number; projectId: number; status: string }>>(
      "/payments/verify-return",
      payload,
    ),
  ).then((d) => {
    if (!d) throw new Error("Payment verification failed");
    return d;
  });

/** POST /payments/:paymentId/verify */
export const verifyPayment = (paymentId: number): Promise<unknown> =>
  unwrap(api.post<ApiResponse<unknown>>(`/payments/${paymentId}/verify`));

export const createEngineerWithdrawal = (
  payload: import("../types").UnifiedWithdrawalPayload,
  idempotencyKey?: string,
): Promise<import("../types").WithdrawalRequest> =>
  unwrap(
    api.post<ApiResponse<import("../types").WithdrawalRequest>>(
      `/payments/engineer/withdrawals`,
      payload,
      idempotencyKey
        ? { headers: { "Idempotency-Key": idempotencyKey } }
        : undefined,
    ),
  );

/* OLD_WITHDRAWAL_START — Manual admin-reviewed withdrawal (commented out for Paymob auto-withdrawal)
export const createEngineerWithdrawal = (
  payload: import("../types").CreateWithdrawalPayload,
): Promise<import("../types").WithdrawalRequest> =>
  unwrap(
    api.post<ApiResponse<import("../types").WithdrawalRequest>>(
      `/payments/engineer/withdrawals`,
      payload,
    ),
  );
OLD_WITHDRAWAL_END */
