import type { WithdrawalRequestStatus } from "../../generated/prisma/client";
import ApiError from "../../utils/ApiError";

/** Terminal states — no further automated transitions. */
export const TERMINAL_PAYOUT_STATUSES: WithdrawalRequestStatus[] = [
  "COMPLETED",
  "FAILED",
  "CANCELLED",
  "REVERSED",
  "REJECTED",
  "FAILED_NEEDS_MANUAL_REVIEW",
];

/** Statuses where balance is held (deducted from available). */
export const BALANCE_HELD_STATUSES: WithdrawalRequestStatus[] = [
  "PENDING",
  "PENDING_REVIEW",
  "APPROVED",
  "TRANSFER_INITIATED",
  "SUBMITTED",
  "PROCESSING",
];

/** Statuses eligible for Paymob inquiry reconciliation. */
export const RECONCILABLE_STATUSES: WithdrawalRequestStatus[] = [
  "SUBMITTED",
  "PROCESSING",
];

const ALLOWED_TRANSITIONS: Record<
  WithdrawalRequestStatus,
  WithdrawalRequestStatus[]
> = {
  PENDING: ["SUBMITTED", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED", "FAILED_NEEDS_MANUAL_REVIEW"],
  PENDING_REVIEW: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["TRANSFER_INITIATED", "COMPLETED", "CANCELLED", "FAILED"],
  TRANSFER_INITIATED: ["PROCESSING", "COMPLETED", "FAILED", "CANCELLED"],
  SUBMITTED: ["PROCESSING", "COMPLETED", "FAILED", "CANCELLED", "FAILED_NEEDS_MANUAL_REVIEW"],
  PROCESSING: ["COMPLETED", "FAILED", "CANCELLED", "REVERSED", "FAILED_NEEDS_MANUAL_REVIEW"],
  COMPLETED: ["REVERSED"],
  FAILED: [],
  CANCELLED: [],
  REVERSED: [],
  REJECTED: [],
  FAILED_NEEDS_MANUAL_REVIEW: ["FAILED", "COMPLETED", "CANCELLED"],
};

export function canTransitionPayoutStatus(
  from: WithdrawalRequestStatus,
  to: WithdrawalRequestStatus,
): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertPayoutTransition(
  from: WithdrawalRequestStatus,
  to: WithdrawalRequestStatus,
): void {
  if (!canTransitionPayoutStatus(from, to)) {
    throw new ApiError(
      400,
      `Invalid payout status transition: ${from} → ${to}`,
    );
  }
}

export function normalizePaymobDisbursementStatus(
  status: string,
): "success" | "pending" | "failed" {
  const normalized = status.trim().toLowerCase();
  if (normalized === "success" || normalized === "successful") return "success";
  if (normalized === "pending") return "pending";
  return "failed";
}

export function mapPaymobStatusToWithdrawalStatus(
  disbursementStatus: string,
): WithdrawalRequestStatus {
  const normalized = normalizePaymobDisbursementStatus(disbursementStatus);
  if (normalized === "success") return "COMPLETED";
  if (normalized === "pending") return "PROCESSING";
  return "FAILED";
}

export function isTerminalPayoutStatus(status: WithdrawalRequestStatus): boolean {
  return TERMINAL_PAYOUT_STATUSES.includes(status);
}

export function isBalanceHeldStatus(status: WithdrawalRequestStatus): boolean {
  return BALANCE_HELD_STATUSES.includes(status);
}

export const ORPHANED_TIMEOUT_MINUTES = 15;
