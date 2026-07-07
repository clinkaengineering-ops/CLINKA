"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLegacyReservedWithdrawalAmount = getLegacyReservedWithdrawalAmount;
exports.getSpendableBalance = getSpendableBalance;
exports.applyPaymobPayoutResult = applyPaymobPayoutResult;
exports.createEngineerPayout = createEngineerPayout;
exports.reconcilePendingPayouts = reconcilePendingPayouts;
exports.handlePaymobPayoutWebhook = handlePaymobPayoutWebhook;
exports.cancelPayoutByAdmin = cancelPayoutByAdmin;
exports.getPayoutAuditTrail = getPayoutAuditTrail;
const crypto_1 = require("crypto");
const db_1 = __importDefault(require("../../config/db"));
const paymob_1 = require("../../config/paymob");
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const wallet_1 = require("../../utils/wallet");
const paymob_payout_api_1 = require("../payments/paymob.payout.api");
const payout_audit_1 = require("./payout.audit");
const payout_state_1 = require("./payout.state");
function formatEgp(amount) {
    return `${(0, wallet_1.roundMoney)(amount).toFixed(2)} EGP`;
}
function paymobResultToStatus(result) {
    return (0, payout_state_1.mapPaymobStatusToWithdrawalStatus)(result.disbursementStatus);
}
/** Legacy rows created before balance-hold did not decrement wallet on create. */
async function getLegacyReservedWithdrawalAmount(tx, userId) {
    const pending = await tx.withdrawalRequest.aggregate({
        where: {
            userId,
            status: { in: [...payout_state_1.BALANCE_HELD_STATUSES] },
            balanceHeldAt: null,
        },
        _sum: { amount: true },
    });
    return pending._sum.amount ? Number(pending._sum.amount) : 0;
}
async function getSpendableBalance(tx, userId) {
    const wallet = await (0, wallet_1.lockWalletForUpdate)(tx, userId);
    const legacyReserved = await getLegacyReservedWithdrawalAmount(tx, userId);
    return (0, wallet_1.roundMoney)(wallet.availableBalance - legacyReserved);
}
async function resolveEngineerNationalId(engineerUserId, override) {
    if (override?.trim()) {
        return (0, paymob_payout_api_1.normalizeNationalId)(override);
    }
    const profile = await db_1.default.engineerProfile.findUnique({
        where: { userId: engineerUserId },
        select: { nationalId: true },
    });
    if (!profile?.nationalId?.trim()) {
        throw new ApiError_1.default(400, "National ID is required for Paymob withdrawals. Add it in your profile or include it in the withdrawal request.");
    }
    return (0, paymob_payout_api_1.normalizeNationalId)(profile.nationalId);
}
async function holdPayoutBalance(tx, walletId, amount) {
    await tx.wallet.update({
        where: { id: walletId },
        data: { availableBalance: { decrement: amount } },
    });
}
async function releasePayoutBalance(tx, walletId, amount) {
    await tx.wallet.update({
        where: { id: walletId },
        data: { availableBalance: { increment: amount } },
    });
}
async function loadWithdrawalForUpdate(tx, withdrawalId) {
    const rows = await tx.$queryRaw `
    SELECT id, "userId", amount, status, "balanceHeldAt"
    FROM "WithdrawalRequest"
    WHERE id = ${withdrawalId}
    FOR UPDATE
  `;
    const row = rows[0];
    if (!row)
        throw new ApiError_1.default(404, "Withdrawal request not found");
    return row;
}
async function getWalletForUser(tx, userId) {
    return (0, wallet_1.lockWalletForUpdate)(tx, userId);
}
async function applyPaymobPayoutResult(withdrawalId, result, context) {
    const targetStatus = paymobResultToStatus(result);
    const paymobFields = {
        paymobTransactionId: "transactionId" in result && result.transactionId
            ? result.transactionId
            : null,
        paymobDisbursementStatus: result.disbursementStatus,
        paymobStatusDescription: result.statusDescription,
    };
    const withdrawalInfo = await db_1.default.withdrawalRequest.findUnique({
        where: { id: withdrawalId },
        select: { userId: true },
    });
    if (!withdrawalInfo)
        throw new ApiError_1.default(404, "Withdrawal request not found");
    return db_1.default.$transaction(async (tx) => {
        const wallet = await getWalletForUser(tx, withdrawalInfo.userId);
        const withdrawal = await loadWithdrawalForUpdate(tx, withdrawalId);
        if (withdrawal.status === targetStatus &&
            withdrawal.status === "COMPLETED") {
            return tx.withdrawalRequest.findUniqueOrThrow({
                where: { id: withdrawalId },
            });
        }
        (0, payout_state_1.assertPayoutTransition)(withdrawal.status, targetStatus);
        const normalized = (0, payout_state_1.normalizePaymobDisbursementStatus)(result.disbursementStatus);
        const now = new Date();
        if (normalized === "success") {
            await tx.walletTransaction.updateMany({
                where: {
                    walletId: wallet.id,
                    relatedWithdrawalId: withdrawalId,
                    type: "WITHDRAWAL",
                },
                data: { status: "COMPLETED" },
            });
            if (!withdrawal.balanceHeldAt) {
                await holdPayoutBalance(tx, wallet.id, withdrawal.amount);
            }
            const updated = await tx.withdrawalRequest.update({
                where: { id: withdrawalId },
                data: {
                    ...paymobFields,
                    status: "COMPLETED",
                    processedAt: now,
                    submittedAt: withdrawal.status === "PENDING" ? now : undefined,
                },
            });
            await (0, payout_audit_1.logPayoutEvent)(tx, {
                withdrawalId,
                event: context.event,
                statusBefore: withdrawal.status,
                statusAfter: "COMPLETED",
                message: result.statusDescription,
                metadata: { source: context.source, paymob: result.raw },
            });
            await (0, payout_audit_1.logPayoutEvent)(tx, {
                withdrawalId,
                event: "COMPLETED",
                statusBefore: withdrawal.status,
                statusAfter: "COMPLETED",
            });
            return updated;
        }
        if (normalized === "pending") {
            const updated = await tx.withdrawalRequest.update({
                where: { id: withdrawalId },
                data: {
                    ...paymobFields,
                    status: "PROCESSING",
                    submittedAt: now,
                },
            });
            await (0, payout_audit_1.logPayoutEvent)(tx, {
                withdrawalId,
                event: context.event,
                statusBefore: withdrawal.status,
                statusAfter: "PROCESSING",
                message: result.statusDescription,
                metadata: { source: context.source, paymob: result.raw },
            });
            return updated;
        }
        await tx.walletTransaction.updateMany({
            where: {
                walletId: wallet.id,
                relatedWithdrawalId: withdrawalId,
                type: "WITHDRAWAL",
            },
            data: { status: "REJECTED" },
        });
        if (withdrawal.balanceHeldAt) {
            await releasePayoutBalance(tx, wallet.id, withdrawal.amount);
            await (0, payout_audit_1.logPayoutEvent)(tx, {
                withdrawalId,
                event: "BALANCE_RELEASED",
                statusBefore: withdrawal.status,
                statusAfter: "FAILED",
                message: "Balance released after payout failure",
            });
        }
        const updated = await tx.withdrawalRequest.update({
            where: { id: withdrawalId },
            data: {
                ...paymobFields,
                status: "FAILED",
                processedAt: now,
                failureReason: result.statusDescription,
                adminNotes: result.statusDescription,
            },
        });
        await (0, payout_audit_1.logPayoutEvent)(tx, {
            withdrawalId,
            event: context.event,
            statusBefore: withdrawal.status,
            statusAfter: "FAILED",
            message: result.statusDescription,
            metadata: { source: context.source, paymob: result.raw },
        });
        await (0, payout_audit_1.logPayoutEvent)(tx, {
            withdrawalId,
            event: "FAILED",
            statusBefore: withdrawal.status,
            statusAfter: "FAILED",
        });
        return updated;
    });
}
async function markPayoutSubmissionFailed(withdrawalId, walletId, amount, message) {
    return db_1.default.$transaction(async (tx) => {
        const withdrawal = await loadWithdrawalForUpdate(tx, withdrawalId);
        await tx.walletTransaction.updateMany({
            where: {
                walletId,
                relatedWithdrawalId: withdrawalId,
                type: "WITHDRAWAL",
            },
            data: { status: "REJECTED" },
        });
        if (withdrawal.balanceHeldAt) {
            await releasePayoutBalance(tx, walletId, amount);
            await (0, payout_audit_1.logPayoutEvent)(tx, {
                withdrawalId,
                event: "BALANCE_RELEASED",
                statusBefore: withdrawal.status,
                statusAfter: "FAILED",
                message: "Balance released after Paymob submission error",
            });
        }
        const updated = await tx.withdrawalRequest.update({
            where: { id: withdrawalId },
            data: {
                status: "FAILED",
                processedAt: new Date(),
                failureReason: message,
                paymobDisbursementStatus: "failed",
                paymobStatusDescription: message,
            },
        });
        await (0, payout_audit_1.logPayoutEvent)(tx, {
            withdrawalId,
            event: "FAILED",
            statusBefore: withdrawal.status,
            statusAfter: "FAILED",
            message,
        });
        return updated;
    });
}
function buildPaymobInput(input, nationalId, amount, clientReference) {
    if (input.channel === "mobile_wallet") {
        const msisdn = (0, paymob_payout_api_1.normalizeEgyptianMsisdn)(input.msisdn);
        const issuer = (0, paymob_payout_api_1.detectWalletIssuerFromMsisdn)(msisdn);
        return {
            paymobInput: {
                issuer,
                amount,
                nationalId,
                msisdn,
                clientReference,
            },
            methodLabel: issuer,
            accountNumber: msisdn,
        };
    }
    const normalizedAccount = input.accountNumber.replace(/\s+/g, "").toUpperCase();
    return {
        paymobInput: {
            issuer: "instant_bank",
            amount,
            nationalId,
            bankCardNumber: normalizedAccount,
            bankCode: input.bankCode.toUpperCase(),
            fullName: input.fullName.trim(),
            bankTransactionType: input.bankTransactionType,
            clientReference,
        },
        methodLabel: `instant_bank:${input.bankCode.toUpperCase()}`,
        accountNumber: normalizedAccount,
    };
}
async function createEngineerPayout(engineerUserId, input, options) {
    const engineer = await db_1.default.user.findUnique({
        where: { id: engineerUserId },
        select: { id: true, name: true, email: true, role: true },
    });
    if (!engineer || engineer.role !== "ENGINEER") {
        throw new ApiError_1.default(403, "Only engineers can request withdrawals");
    }
    if (!(0, paymob_1.isPaymobPayoutConfigured)()) {
        throw new ApiError_1.default(503, "Automatic withdrawals are unavailable until Paymob payout credentials are configured");
    }
    const idempotencyKey = options?.idempotencyKey?.trim() || null;
    if (idempotencyKey) {
        const existing = await db_1.default.withdrawalRequest.findFirst({
            where: { userId: engineerUserId, idempotencyKey },
        });
        if (existing)
            return existing;
    }
    const amount = (0, wallet_1.roundMoney)(input.amount);
    if (amount <= 0) {
        throw new ApiError_1.default(400, "Withdrawal amount must be greater than zero");
    }
    const payoutConfig = (0, paymob_1.getPaymobPayoutConfig)();
    // Enforce rolling 24-hour maximum withdrawal volume per user
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentWithdrawals = await db_1.default.withdrawalRequest.aggregate({
        where: {
            userId: engineerUserId,
            createdAt: { gte: last24h },
            status: { notIn: ["FAILED", "CANCELLED", "REVERSED", "REJECTED", "FAILED_NEEDS_MANUAL_REVIEW"] },
        },
        _sum: { amount: true },
    });
    const currentVolume = Number(recentWithdrawals._sum.amount ?? 0);
    if (currentVolume + amount > payoutConfig.maxWithdrawalAmount) {
        throw new ApiError_1.default(400, `Rolling 24-hour withdrawal limit exceeded. Remaining allowance is ${formatEgp(Math.max(0, payoutConfig.maxWithdrawalAmount - currentVolume))}.`);
    }
    if (input.channel === "bank_transfer" && amount < payoutConfig.instantBankMinAmount) {
        throw new ApiError_1.default(400, `Bank withdrawals require at least ${formatEgp(payoutConfig.instantBankMinAmount)}`);
    }
    const nationalId = await resolveEngineerNationalId(engineerUserId, input.nationalId);
    const clientReference = idempotencyKey || `clinka-wd-${engineerUserId}-${(0, crypto_1.randomUUID)()}`;
    const { paymobInput, methodLabel, accountNumber } = buildPaymobInput(input, nationalId, amount, clientReference);
    let txResult;
    try {
        txResult = await db_1.default.$transaction(async (tx) => {
            await (0, wallet_1.settleMaturedWalletTransactions)(tx, engineerUserId);
            const spendable = await getSpendableBalance(tx, engineerUserId);
            if (amount > spendable) {
                throw new ApiError_1.default(400, `Withdrawal exceeds available spendable balance (${formatEgp(spendable)})`);
            }
            const lockedWallet = await (0, wallet_1.lockWalletForUpdate)(tx, engineerUserId);
            const now = new Date();
            const created = await tx.withdrawalRequest.create({
                data: {
                    userId: engineerUserId,
                    amount,
                    method: methodLabel,
                    accountNumber,
                    status: "PENDING",
                    paymobClientReference: clientReference,
                    idempotencyKey,
                    balanceHeldAt: now,
                },
            });
            await holdPayoutBalance(tx, lockedWallet.id, amount);
            await tx.walletTransaction.create({
                data: {
                    walletId: lockedWallet.id,
                    amount,
                    type: "WITHDRAWAL",
                    status: "PENDING",
                    description: `Auto withdrawal via Paymob (${methodLabel})`,
                    relatedWithdrawalId: created.id,
                },
            });
            await (0, payout_audit_1.logPayoutEvent)(tx, {
                withdrawalId: created.id,
                event: "CREATED",
                statusAfter: "PENDING",
                metadata: { method: methodLabel, amount },
            });
            await (0, payout_audit_1.logPayoutEvent)(tx, {
                withdrawalId: created.id,
                event: "BALANCE_HELD",
                statusBefore: "PENDING",
                statusAfter: "PENDING",
                message: formatEgp(amount),
            });
            return { withdrawal: created, wallet: lockedWallet };
        });
    }
    catch (error) {
        if (error.code === "P2002" && idempotencyKey) {
            const { metrics } = await Promise.resolve().then(() => __importStar(require("../../utils/metrics")));
            metrics.increment("payouts_duplicate_blocked");
            const existing = await db_1.default.withdrawalRequest.findFirst({
                where: { userId: engineerUserId, idempotencyKey },
            });
            if (existing)
                return existing;
        }
        throw error;
    }
    const { withdrawal, wallet } = txResult;
    let paymobResult;
    try {
        paymobResult = await (0, paymob_payout_api_1.createPaymobInstantCashin)(paymobInput);
    }
    catch (error) {
        const message = error instanceof ApiError_1.default
            ? error.message
            : "Paymob payout request failed";
        await markPayoutSubmissionFailed(withdrawal.id, wallet.id, amount, message);
        throw error;
    }
    await db_1.default.withdrawalRequest.update({
        where: { id: withdrawal.id },
        data: { status: "SUBMITTED", submittedAt: new Date() },
    });
    await (0, payout_audit_1.logPayoutEvent)(db_1.default, {
        withdrawalId: withdrawal.id,
        event: "SUBMITTED",
        statusBefore: "PENDING",
        statusAfter: "SUBMITTED",
        metadata: { clientReference },
    });
    const updated = await applyPaymobPayoutResult(withdrawal.id, paymobResult, {
        event: "PAYMOB_RESPONSE",
        source: "instant_cashin",
    });
    const { createNotification } = await Promise.resolve().then(() => __importStar(require("../../utils/notifications")));
    if (updated.status === "COMPLETED") {
        await createNotification(engineerUserId, "FUNDS_RELEASED", "Withdrawal completed", `${formatEgp(amount)} was sent to your ${methodLabel} account via Paymob.`, "/balance");
    }
    else if (updated.status === "PROCESSING") {
        await createNotification(engineerUserId, "FUNDS_RELEASED", "Withdrawal processing", `Your ${formatEgp(amount)} withdrawal via Paymob is being processed.`, "/balance");
    }
    else if (updated.status === "FAILED") {
        await createNotification(engineerUserId, "FUNDS_RELEASED", "Withdrawal failed", `Your ${formatEgp(amount)} withdrawal could not be completed.${updated.paymobStatusDescription ? ` ${updated.paymobStatusDescription}` : ""}`, "/balance");
    }
    return updated;
}
async function reconcilePendingPayouts(limit = 50) {
    if (!(0, paymob_1.isPaymobPayoutConfigured)()) {
        return { checked: 0, updated: 0 };
    }
    const { ORPHANED_TIMEOUT_MINUTES } = await Promise.resolve().then(() => __importStar(require("./payout.state")));
    const orphanedThreshold = new Date(Date.now() - ORPHANED_TIMEOUT_MINUTES * 60000);
    // 1. Handle Orphaned PENDING
    const orphanedPending = await db_1.default.withdrawalRequest.findMany({
        where: {
            status: "PENDING",
            updatedAt: { lt: orphanedThreshold }
        },
        take: limit,
    });
    let updated = 0;
    for (const row of orphanedPending) {
        await db_1.default.withdrawalRequest.update({
            where: { id: row.id },
            data: { status: "FAILED_NEEDS_MANUAL_REVIEW", failureReason: "Orphaned PENDING payout" }
        });
        updated += 1;
    }
    // 2. Handle Upstream Reconcilable States (SUBMITTED, PROCESSING)
    const pending = await db_1.default.withdrawalRequest.findMany({
        where: { status: { in: [...payout_state_1.RECONCILABLE_STATUSES] } },
        orderBy: [{ lastInquiryAt: "asc" }, { updatedAt: "asc" }],
        take: limit,
        select: {
            id: true,
            paymobTransactionId: true,
            paymobClientReference: true,
            method: true,
            retryCount: true,
        },
    });
    if (pending.length === 0 && orphanedPending.length === 0) {
        return { checked: 0, updated: 0 };
    }
    if (pending.length > 0) {
        const inquiryIds = pending.flatMap((row) => {
            const ids = [];
            if (row.paymobTransactionId)
                ids.push(row.paymobTransactionId);
            if (row.paymobClientReference)
                ids.push(row.paymobClientReference);
            return ids;
        });
        const uniqueIds = [...new Set(inquiryIds)].slice(0, 50);
        const bankTransactions = pending.some((row) => row.method.startsWith("instant_bank"));
        let inquiry;
        try {
            inquiry = await (0, paymob_payout_api_1.inquirePaymobPayoutTransactions)(uniqueIds, {
                bankTransactions,
            });
        }
        catch (error) {
            console.error("[payout-reconcile] Paymob inquiry failed:", error instanceof Error ? error.message : error);
            return { checked: pending.length + orphanedPending.length, updated, error: true };
        }
        const byTransactionId = new Map();
        const byClientReference = new Map();
        for (const item of inquiry.results) {
            byTransactionId.set(item.transactionId, item);
            if (item.clientReference) {
                byClientReference.set(item.clientReference, item);
            }
        }
        const now = new Date();
        for (const row of pending) {
            const match = (row.paymobTransactionId &&
                byTransactionId.get(row.paymobTransactionId)) ||
                (row.paymobClientReference &&
                    byClientReference.get(row.paymobClientReference));
            if (!match) {
                if (row.retryCount >= 5) {
                    await db_1.default.withdrawalRequest.update({
                        where: { id: row.id },
                        data: { status: "FAILED_NEEDS_MANUAL_REVIEW", failureReason: "Max inquiry retries exceeded" }
                    });
                    updated += 1;
                }
                else {
                    const { metrics } = await Promise.resolve().then(() => __importStar(require("../../utils/metrics")));
                    metrics.increment("reconciliation_retries");
                    await db_1.default.withdrawalRequest.update({
                        where: { id: row.id },
                        data: { retryCount: { increment: 1 }, lastInquiryAt: now },
                    });
                }
                continue;
            }
            await db_1.default.withdrawalRequest.update({
                where: { id: row.id },
                data: { lastInquiryAt: now, retryCount: 0 },
            });
            const before = await db_1.default.withdrawalRequest.findUnique({
                where: { id: row.id },
                select: { status: true },
            });
            const result = await applyPaymobPayoutResult(row.id, match, {
                event: "RECONCILIATION",
                source: "inquiry",
            });
            if (before && result.status !== before.status) {
                updated += 1;
            }
        }
    }
    return { checked: pending.length + orphanedPending.length, updated };
}
async function handlePaymobPayoutWebhook(payload) {
    const transactionId = typeof payload.transaction_id === "string"
        ? payload.transaction_id
        : payload.transaction_id != null
            ? String(payload.transaction_id)
            : null;
    const clientReference = typeof payload.client_reference === "string"
        ? payload.client_reference
        : typeof payload.reference === "string"
            ? payload.reference
            : null;
    if (!transactionId && !clientReference) {
        throw new ApiError_1.default(400, "Invalid payout webhook payload");
    }
    const withdrawal = await db_1.default.withdrawalRequest.findFirst({
        where: {
            OR: [
                transactionId ? { paymobTransactionId: transactionId } : undefined,
                clientReference ? { paymobClientReference: clientReference } : undefined,
            ].filter(Boolean),
        },
    });
    if (!withdrawal) {
        return { matched: false };
    }
    const payloadAmount = Number(payload.amount);
    if (payloadAmount > 0 && payloadAmount !== Number(withdrawal.amount)) {
        throw new ApiError_1.default(400, "Webhook payload amount does not match the database withdrawal amount");
    }
    const inquiryResult = {
        transactionId: transactionId ?? withdrawal.paymobTransactionId ?? "",
        issuer: String(payload.issuer ?? withdrawal.method),
        amount: Number(payload.amount ?? withdrawal.amount),
        disbursementStatus: String(payload.disbursement_status ?? payload.status ?? "failed"),
        statusCode: String(payload.status_code ?? ""),
        statusDescription: String(payload.status_description ?? "Payout callback"),
        clientReference: clientReference ?? withdrawal.paymobClientReference ?? undefined,
        raw: payload,
    };
    const updated = await applyPaymobPayoutResult(withdrawal.id, inquiryResult, { event: "CALLBACK_RECEIVED", source: "webhook" });
    return { matched: true, withdrawalId: withdrawal.id, status: updated.status };
}
async function cancelPayoutByAdmin(withdrawalId, adminId, reason) {
    return db_1.default.$transaction(async (tx) => {
        const withdrawal = await loadWithdrawalForUpdate(tx, withdrawalId);
        (0, payout_state_1.assertPayoutTransition)(withdrawal.status, "CANCELLED");
        const wallet = await getWalletForUser(tx, withdrawal.userId);
        await tx.walletTransaction.updateMany({
            where: {
                walletId: wallet.id,
                relatedWithdrawalId: withdrawalId,
                type: "WITHDRAWAL",
            },
            data: { status: "REJECTED" },
        });
        if (withdrawal.balanceHeldAt) {
            await releasePayoutBalance(tx, wallet.id, withdrawal.amount);
            await (0, payout_audit_1.logPayoutEvent)(tx, {
                withdrawalId,
                event: "BALANCE_RELEASED",
                statusBefore: withdrawal.status,
                statusAfter: "CANCELLED",
            });
        }
        const updated = await tx.withdrawalRequest.update({
            where: { id: withdrawalId },
            data: {
                status: "CANCELLED",
                processedAt: new Date(),
                failureReason: reason ?? "Cancelled by admin",
                adminNotes: reason ?? "Cancelled by admin",
            },
        });
        await (0, payout_audit_1.logPayoutEvent)(tx, {
            withdrawalId,
            event: "ADMIN_OVERRIDE",
            statusBefore: withdrawal.status,
            statusAfter: "CANCELLED",
            message: reason,
            metadata: { adminId },
        });
        return updated;
    });
}
async function getPayoutAuditTrail(withdrawalId) {
    return db_1.default.payoutAuditLog.findMany({
        where: { withdrawalId },
        orderBy: { createdAt: "asc" },
    });
}
