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

export type WithdrawalRequestStatus =
  | "PENDING"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "TRANSFER_INITIATED"
  | "SUBMITTED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "REVERSED"
  | "REJECTED"
  | "FAILED_NEEDS_MANUAL_REVIEW";

export interface WalletTransactionRow {
  id: number;
  amount: number;
  type: "PROJECT_PAYMENT" | "RELEASED" | "WITHDRAWAL";
  status: "PENDING" | "AVAILABLE" | "COMPLETED" | "REJECTED";
  description: string | null;
  availableAt: string | null;
  relatedPaymentId: number | null;
  relatedWithdrawalId: number | null;
  createdAt: string;
}

export interface WithdrawalRequest {
  id: number;
  amount: number;
  method: string;
  accountNumber: string;
  status: WithdrawalRequestStatus;
  adminNotes: string | null;
  paymobTransactionId?: string | null;
  paymobDisbursementStatus?: string | null;
  paymobStatusDescription?: string | null;
  failureReason?: string | null;
  processedAt: string | null;
  createdAt: string;
  proofUrl?: string | null;
  externalReference?: string | null;
}

export interface EngineerBalanceSummary {
  availableBalance: number;
  spendableBalance: number;
  heldInWithdrawals: number;
  pendingBalance: number;
  securedBalance: number;
  awaitingClientPayment: number;
  transactions: EngineerBalanceTransaction[];
  walletHistory: WalletTransactionRow[];
  withdrawalRequests: WithdrawalRequest[];
}

export interface EscrowPaymentItem {
  id: number;
  projectId: number;
  projectTitle: string;
  projectStatus?: string;
  amountUsd: number;
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
  amountUsd: number;
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

export interface CheckoutPaymentData {
  checkoutUrl?: string;
  redirectTo?: string;
}

export interface CheckoutResult {
  payment: {
    id: number;
    projectId: number;
    amountUsd: number;
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

export type AutoWithdrawalChannel = "mobile_wallet" | "bank_transfer";

export interface AutoWithdrawalPayload {
  amount: number;
  channel: AutoWithdrawalChannel;
  msisdn?: string;
  accountNumber?: string;
  bankCode?: string;
  fullName?: string;
  nationalId?: string;
  bankTransactionType?: "cash_transfer" | "salary";
}

export interface UnifiedWithdrawalPayload {
  payoutMethod: "PAYMOB" | "IBAN" | "INSTAPAY" | "E_WALLET";
  amount: number;
  // Paymob specific
  channel?: AutoWithdrawalChannel;
  msisdn?: string;
  accountNumber?: string;
  bankCode?: string;
  fullName?: string;
  nationalId?: string;
  bankTransactionType?: "cash_transfer" | "salary";
  // IBAN specific
  accountHolderName?: string;
  iban?: string;
  swiftBic?: string;
  bankName?: string;
  bankAddress?: string;
  country?: string;
  // INSTAPAY specific
  instapayAccount?: string;
  // E_WALLET specific
  walletProvider?: string;
  walletNumber?: string;
}
