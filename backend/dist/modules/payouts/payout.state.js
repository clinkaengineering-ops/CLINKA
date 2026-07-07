"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ORPHANED_TIMEOUT_MINUTES = exports.RECONCILABLE_STATUSES = exports.BALANCE_HELD_STATUSES = exports.TERMINAL_PAYOUT_STATUSES = void 0;
exports.canTransitionPayoutStatus = canTransitionPayoutStatus;
exports.assertPayoutTransition = assertPayoutTransition;
exports.normalizePaymobDisbursementStatus = normalizePaymobDisbursementStatus;
exports.mapPaymobStatusToWithdrawalStatus = mapPaymobStatusToWithdrawalStatus;
exports.isTerminalPayoutStatus = isTerminalPayoutStatus;
exports.isBalanceHeldStatus = isBalanceHeldStatus;
/** Terminal states — no further automated transitions. */
exports.TERMINAL_PAYOUT_STATUSES = [
    "COMPLETED",
    "FAILED",
    "CANCELLED",
    "REVERSED",
    "REJECTED",
    "FAILED_NEEDS_MANUAL_REVIEW",
];
/** Statuses where balance is held (deducted from available). */
exports.BALANCE_HELD_STATUSES = [
    "PENDING",
    "SUBMITTED",
    "PROCESSING",
];
/** Statuses eligible for Paymob inquiry reconciliation. */
exports.RECONCILABLE_STATUSES = [
    "SUBMITTED",
    "PROCESSING",
];
const ALLOWED_TRANSITIONS = {
    PENDING: ["SUBMITTED", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED", "FAILED_NEEDS_MANUAL_REVIEW"],
    SUBMITTED: ["PROCESSING", "COMPLETED", "FAILED", "CANCELLED", "FAILED_NEEDS_MANUAL_REVIEW"],
    PROCESSING: ["COMPLETED", "FAILED", "CANCELLED", "REVERSED", "FAILED_NEEDS_MANUAL_REVIEW"],
    COMPLETED: ["REVERSED"],
    FAILED: [],
    CANCELLED: [],
    REVERSED: [],
    REJECTED: [],
    FAILED_NEEDS_MANUAL_REVIEW: ["FAILED", "COMPLETED", "CANCELLED"],
};
function canTransitionPayoutStatus(from, to) {
    if (from === to)
        return true;
    return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
function assertPayoutTransition(from, to) {
    if (!canTransitionPayoutStatus(from, to)) {
        throw new Error(`Invalid payout status transition: ${from} → ${to}`);
    }
}
function normalizePaymobDisbursementStatus(status) {
    const normalized = status.trim().toLowerCase();
    if (normalized === "success" || normalized === "successful")
        return "success";
    if (normalized === "pending")
        return "pending";
    return "failed";
}
function mapPaymobStatusToWithdrawalStatus(disbursementStatus) {
    const normalized = normalizePaymobDisbursementStatus(disbursementStatus);
    if (normalized === "success")
        return "COMPLETED";
    if (normalized === "pending")
        return "PROCESSING";
    return "FAILED";
}
function isTerminalPayoutStatus(status) {
    return exports.TERMINAL_PAYOUT_STATUSES.includes(status);
}
function isBalanceHeldStatus(status) {
    return exports.BALANCE_HELD_STATUSES.includes(status);
}
exports.ORPHANED_TIMEOUT_MINUTES = 15;
