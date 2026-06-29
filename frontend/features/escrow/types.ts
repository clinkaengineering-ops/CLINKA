export type EscrowDisplayStatus =
  | "Pending"
  | "In escrow"
  | "Released"
  | "Refunded";

export type EngineerPaymentStatus =
  | "awaiting_payment"
  | "in_progress"
  | "paid"
  | "refunded";

export interface EngineerBalanceTransaction {
  id: number;
  projectId: number;
  projectTitle: string;
  amount: number;
  netAmount: number;
  commission: number;
  status: EngineerPaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalRequest {
  id: number;
  amount: number;
  method: string;
  accountNumber: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "REJECTED";
  adminNotes: string | null;
  processedAt: string | null;
  createdAt: string;
}

export interface EngineerBalanceSummary {
  availableBalance: number;
  pendingBalance: number;
  securedBalance: number;
  awaitingClientPayment: number;
  transactions: EngineerBalanceTransaction[];
  withdrawalRequests: WithdrawalRequest[];
}

export interface EscrowPaymentItem {
  id: number;
  projectId: number;
  projectTitle: string;
  projectStatus?: string;
  amount: number;
  commission: number;
  status: EscrowDisplayStatus;
  createdAt: string;
  updatedAt: string;
}

/** Merged row: existing payment or in-progress project awaiting first payment */
export interface EscrowContractRow {
  paymentId: number | null;
  projectId: number;
  projectTitle: string;
  projectStatus?: string;
  amount: number;
  commission: number;
  status: EscrowDisplayStatus;
  updatedAt: string;
}

export interface PaymentMethodOption {
  paymentId: number;
  name_en: string;
  name_ar: string;
  redirect: string;
  logo?: string;
}

/** @deprecated Use PaymentMethodOption */
export type FawaterkPaymentMethod = PaymentMethodOption;

export interface CheckoutPaymentData {
  checkoutUrl?: string;
  redirectTo?: string;
}

export interface CheckoutResult {
  payment: {
    id: number;
    projectId: number;
    amount: number;
    commission: number;
    status: string;
    gatewayInvoiceId: string | null;
    gatewayInvoiceKey: string | null;
  };
  intentionId: string;
  orderId: number;
  checkoutUrl: string;
  clientSecret: string;
}

export interface InitiateCheckoutPayload {
  paymentMethodId?: number;
  phone?: string;
  address?: string;
}

export interface CreateWithdrawalPayload {
  amount: number;
  method: string;
  accountNumber: string;
}
