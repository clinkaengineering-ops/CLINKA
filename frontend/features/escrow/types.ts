export type EscrowDisplayStatus =
  | "Pending"
  | "In escrow"
  | "Released"
  | "Refunded";

export type EngineerPaymentStatus =
  | "awaiting_payment"
  | "in_progress"
  | "awaiting_release"
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

export interface EngineerBalanceSummary {
  availableBalance: number;
  securedBalance: number;
  awaitingClientPayment: number;
  awaitingRelease: number;
  transactions: EngineerBalanceTransaction[];
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

export interface FawaterkPaymentMethod {
  paymentId: number;
  name_en: string;
  name_ar: string;
  redirect: string;
  logo?: string;
}

export interface CheckoutPaymentData {
  redirectTo?: string;
  fawryCode?: string;
  expireDate?: string;
  meezaReference?: number;
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
  invoiceId: number;
  invoiceKey: string;
  paymentData: CheckoutPaymentData;
}

export interface InitiateCheckoutPayload {
  paymentMethodId: number;
  phone?: string;
  address?: string;
}
