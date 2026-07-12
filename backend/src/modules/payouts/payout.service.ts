import { randomUUID } from "crypto";
import db from "../../config/db";
import {
  getPaymobPayoutConfig,
  isPaymobPayoutConfigured,
} from "../../config/paymob";
import ApiError from "../../utils/ApiError";
import {
  lockWalletForUpdate,
  roundMoney,
  settleMaturedWalletTransactions,
} from "../../utils/wallet";
import type {
  AutoWithdrawalInput,
  InternationalWithdrawalInput,
} from "../payments/payments.validation";
import {
  encryptSensitiveField,
  maskIban,
  isPayoutFieldEncryptionConfigured,
} from "../../utils/fieldEncryption";
import {
  createPaymobInstantCashin,
  detectWalletIssuerFromMsisdn,
  inquirePaymobPayoutTransactions,
  normalizeEgyptianMsisdn,
  normalizeNationalId,
  type PaymobInstantCashinResult,
  type PaymobInquiryTransaction,
} from "../payments/paymob.payout.api";
import { logPayoutEvent } from "./payout.audit";
import {
  assertPayoutTransition,
  BALANCE_HELD_STATUSES,
  mapPaymobStatusToWithdrawalStatus,
  normalizePaymobDisbursementStatus,
  RECONCILABLE_STATUSES,
} from "./payout.state";
import type { WithdrawalRequestStatus } from "../../generated/prisma/client";

type TxClient = Parameters<Parameters<typeof db.$transaction>[0]>[0];

function formatUsd(amount: number) {
  return `$${roundMoney(amount).toFixed(2)}`;
}

function paymobResultToStatus(result: {
  disbursementStatus: string;
}): WithdrawalRequestStatus {
  return mapPaymobStatusToWithdrawalStatus(result.disbursementStatus);
}

/** Legacy rows created before balance-hold did not decrement wallet on create. */
export async function getLegacyReservedWithdrawalAmount(
  tx: TxClient,
  userId: number,
): Promise<number> {
  const pending = await tx.withdrawalRequest.aggregate({
    where: {
      userId,
      status: { in: [...BALANCE_HELD_STATUSES] },
      balanceHeldAt: null,
    },
    _sum: { amount: true },
  });
  return pending._sum.amount ? Number(pending._sum.amount) : 0;
}

export async function getSpendableBalance(
  tx: TxClient,
  userId: number,
): Promise<number> {
  const wallet = await lockWalletForUpdate(tx, userId);
  const legacyReserved = await getLegacyReservedWithdrawalAmount(tx, userId);
  return roundMoney(wallet.availableBalance - legacyReserved);
}

async function resolveEngineerNationalId(
  engineerUserId: number,
  override?: string,
) {
  if (override?.trim()) {
    return normalizeNationalId(override);
  }

  const profile = await db.engineerProfile.findUnique({
    where: { userId: engineerUserId },
    select: { nationalId: true },
  });

  if (!profile?.nationalId?.trim()) {
    throw new ApiError(
      400,
      "National ID is required for Paymob withdrawals. Add it in your profile or include it in the withdrawal request.",
    );
  }

  return normalizeNationalId(profile.nationalId);
}

async function holdPayoutBalance(
  tx: TxClient,
  walletId: number,
  amount: number,
) {
  await tx.wallet.update({
    where: { id: walletId },
    data: { 
      availableBalance: { decrement: amount },
      version: { increment: 1 }
    },
  });
}

async function releasePayoutBalance(
  tx: TxClient,
  walletId: number,
  amount: number,
) {
  await tx.wallet.update({
    where: { id: walletId },
    data: { 
      availableBalance: { increment: amount },
      version: { increment: 1 }
    },
  });
}

async function loadWithdrawalForUpdate(tx: TxClient, withdrawalId: number) {
  const rows = await tx.$queryRaw<
    Array<{
      id: number;
      userId: number;
      amount: number;
      status: WithdrawalRequestStatus;
      balanceHeldAt: Date | null;
    }>
  >`
    SELECT id, "userId", amount, status, "balanceHeldAt"
    FROM "WithdrawalRequest"
    WHERE id = ${withdrawalId}
    FOR UPDATE
  `;
  const row = rows[0];
  if (!row) throw new ApiError(404, "Withdrawal request not found");
  return row;
}

async function getWalletForUser(tx: TxClient, userId: number) {
  return lockWalletForUpdate(tx, userId);
}

export async function applyPaymobPayoutResult(
  withdrawalId: number,
  result: PaymobInstantCashinResult | PaymobInquiryTransaction,
  context: {
    event: "PAYMOB_RESPONSE" | "INQUIRY_UPDATED" | "CALLBACK_RECEIVED" | "RECONCILIATION";
    source?: string;
  },
) {
  const targetStatus = paymobResultToStatus(result);
  const paymobFields = {
    paymobTransactionId:
      "transactionId" in result && result.transactionId
        ? result.transactionId
        : null,
    paymobDisbursementStatus: result.disbursementStatus,
    paymobStatusDescription: result.statusDescription,
  };

  const withdrawalInfo = await db.withdrawalRequest.findUnique({
    where: { id: withdrawalId },
    select: { userId: true },
  });
  if (!withdrawalInfo) throw new ApiError(404, "Withdrawal request not found");

  return db.$transaction(async (tx) => {
    const wallet = await getWalletForUser(tx, withdrawalInfo.userId);
    const withdrawal = await loadWithdrawalForUpdate(tx, withdrawalId);

    if (
      withdrawal.status === targetStatus &&
      withdrawal.status === "COMPLETED"
    ) {
      return tx.withdrawalRequest.findUniqueOrThrow({
        where: { id: withdrawalId },
      });
    }

    assertPayoutTransition(withdrawal.status, targetStatus);

    const normalized = normalizePaymobDisbursementStatus(result.disbursementStatus);
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

      await logPayoutEvent(tx, {
        withdrawalId,
        event: context.event,
        statusBefore: withdrawal.status,
        statusAfter: "COMPLETED",
        message: result.statusDescription,
        metadata: { source: context.source, paymob: result.raw },
      });

      await logPayoutEvent(tx, {
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

      await logPayoutEvent(tx, {
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
      await logPayoutEvent(tx, {
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

    await logPayoutEvent(tx, {
      withdrawalId,
      event: context.event,
      statusBefore: withdrawal.status,
      statusAfter: "FAILED",
      message: result.statusDescription,
      metadata: { source: context.source, paymob: result.raw },
    });

    await logPayoutEvent(tx, {
      withdrawalId,
      event: "FAILED",
      statusBefore: withdrawal.status,
      statusAfter: "FAILED",
    });

    return updated;
  });
}

async function markPayoutSubmissionFailed(
  withdrawalId: number,
  walletId: number,
  amount: number,
  message: string,
) {
  return db.$transaction(async (tx) => {
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
      await logPayoutEvent(tx, {
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

    await logPayoutEvent(tx, {
      withdrawalId,
      event: "FAILED",
      statusBefore: withdrawal.status,
      statusAfter: "FAILED",
      message,
    });

    return updated;
  });
}

function buildPaymobInput(
  input: AutoWithdrawalInput,
  nationalId: string,
  amount: number,
  clientReference: string,
) {
  if (input.channel === "mobile_wallet") {
    const msisdn = normalizeEgyptianMsisdn(input.msisdn);
    const issuer = detectWalletIssuerFromMsisdn(msisdn);
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
      issuer: "instant_bank" as const,
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

export async function createPaymobPayout(
  engineerUserId: number,
  input: AutoWithdrawalInput,
  options?: { idempotencyKey?: string },
) {
  const engineer = await db.user.findUnique({
    where: { id: engineerUserId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!engineer || engineer.role !== "ENGINEER") {
    throw new ApiError(403, "Only engineers can request withdrawals");
  }

  if (!isPaymobPayoutConfigured()) {
    throw new ApiError(
      503,
      "Automatic withdrawals are unavailable until Paymob payout credentials are configured",
    );
  }

  const idempotencyKey = options?.idempotencyKey?.trim() || null;
  if (idempotencyKey) {
    const existing = await db.withdrawalRequest.findFirst({
      where: { userId: engineerUserId, idempotencyKey },
    });
    if (existing) return existing;
  }

  const amount = roundMoney(input.amount);
  if (amount <= 0) {
    throw new ApiError(400, "Withdrawal amount must be greater than zero");
  }

  const payoutConfig = getPaymobPayoutConfig();
  
  // Enforce rolling 24-hour maximum withdrawal volume per user
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentWithdrawals = await db.withdrawalRequest.aggregate({
    where: {
      userId: engineerUserId,
      createdAt: { gte: last24h },
      status: { notIn: ["FAILED", "CANCELLED", "REVERSED", "REJECTED", "FAILED_NEEDS_MANUAL_REVIEW"] },
    },
    _sum: { amount: true },
  });
  const currentVolume = Number(recentWithdrawals._sum.amount ?? 0);
  if (currentVolume + amount > payoutConfig.maxWithdrawalAmount) {
    throw new ApiError(
      400,
      `Rolling 24-hour withdrawal limit exceeded. Remaining allowance is ${formatUsd(Math.max(0, payoutConfig.maxWithdrawalAmount - currentVolume))}.`,
    );
  }

  if (input.channel === "bank_transfer" && amount < payoutConfig.instantBankMinAmount) {
    throw new ApiError(
      400,
      `Bank withdrawals require at least ${formatUsd(payoutConfig.instantBankMinAmount)}`,
    );
  }

  const nationalId = await resolveEngineerNationalId(
    engineerUserId,
    input.nationalId,
  );

  const clientReference = idempotencyKey || `clinka-wd-${engineerUserId}-${randomUUID()}`;
  const { paymobInput, methodLabel, accountNumber } = buildPaymobInput(
    input,
    nationalId,
    amount,
    clientReference,
  );

  let txResult;
  try {
    txResult = await db.$transaction(async (tx) => {
      await settleMaturedWalletTransactions(tx, engineerUserId);
      const spendable = await getSpendableBalance(tx, engineerUserId);

      if (amount > spendable) {
        throw new ApiError(
          400,
          `Withdrawal exceeds available spendable balance (${formatUsd(spendable)})`,
        );
      }

      const lockedWallet = await lockWalletForUpdate(tx, engineerUserId);
      const now = new Date();

      const created = await tx.withdrawalRequest.create({
        data: {
          userId: engineerUserId,
          amount,
          method: methodLabel,
          accountNumber,
          payoutType: "PAYMOB",
          currency: "USD",
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

      await logPayoutEvent(tx, {
        withdrawalId: created.id,
        event: "CREATED",
        statusAfter: "PENDING",
        metadata: { method: methodLabel, amount },
      });

      await logPayoutEvent(tx, {
        withdrawalId: created.id,
        event: "BALANCE_HELD",
        statusBefore: "PENDING",
        statusAfter: "PENDING",
        message: formatUsd(amount),
      });

      return { withdrawal: created, wallet: lockedWallet };
    });
  } catch (error: any) {
    if (error.code === "P2002" && idempotencyKey) {
      const { metrics } = await import("../../utils/metrics");
      metrics.increment("payouts_duplicate_blocked");
      const existing = await db.withdrawalRequest.findFirst({
        where: { userId: engineerUserId, idempotencyKey },
      });
      if (existing) return existing;
    }
    throw error;
  }
  const { withdrawal, wallet } = txResult;

  let paymobResult: PaymobInstantCashinResult;
  try {
    paymobResult = await createPaymobInstantCashin(paymobInput);
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "Paymob payout request failed";
    await markPayoutSubmissionFailed(withdrawal.id, wallet.id, amount, message);
    throw error;
  }

  await db.withdrawalRequest.update({
    where: { id: withdrawal.id },
    data: { status: "SUBMITTED", submittedAt: new Date() },
  });

  await logPayoutEvent(db, {
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

  const { createNotification } = await import("../../utils/notifications");
  if (updated.status === "COMPLETED") {
    await createNotification(
      engineerUserId,
      "FUNDS_RELEASED",
      "Withdrawal completed",
      `${formatUsd(amount)} was sent to your ${methodLabel} account via Paymob.`,
      "/balance",
    );
  } else if (updated.status === "PROCESSING") {
    await createNotification(
      engineerUserId,
      "FUNDS_RELEASED",
      "Withdrawal processing",
      `Your ${formatUsd(amount)} withdrawal via Paymob is being processed.`,
      "/balance",
    );
  } else if (updated.status === "FAILED") {
    await createNotification(
      engineerUserId,
      "FUNDS_RELEASED",
      "Withdrawal failed",
      `Your ${formatUsd(amount)} withdrawal could not be completed.${updated.paymobStatusDescription ? ` ${updated.paymobStatusDescription}` : ""}`,
      "/balance",
    );
  }

  return updated;
}

export async function createIbanPayout(
  engineerUserId: number,
  input: InternationalWithdrawalInput,
  options?: { idempotencyKey?: string },
) {
  const engineer = await db.user.findUnique({
    where: { id: engineerUserId },
    select: { id: true, name: true, role: true },
  });
  if (!engineer || engineer.role !== "ENGINEER") {
    throw new ApiError(403, "Only engineers can request withdrawals");
  }

  if (!isPayoutFieldEncryptionConfigured()) {
    throw new ApiError(
      503,
      "International withdrawals are unavailable until PAYOUT_FIELD_ENCRYPTION_KEY is configured on the server.",
    );
  }

  const idempotencyKey = options?.idempotencyKey?.trim() || null;
  if (idempotencyKey) {
    const existing = await db.withdrawalRequest.findFirst({
      where: { userId: engineerUserId, idempotencyKey },
    });
    if (existing) return existing;
  }

  const amount = roundMoney(input.amount);
  if (amount <= 0) {
    throw new ApiError(400, "Withdrawal amount must be greater than zero");
  }

  const encryptedHolderName = encryptSensitiveField(input.accountHolderName);
  const encryptedIban = encryptSensitiveField(input.iban);
  const encryptedSwift = input.swiftBic ? encryptSensitiveField(input.swiftBic) : null;
  const encryptedAddress = input.bankAddress ? encryptSensitiveField(input.bankAddress) : null;
  
  const maskedIban = maskIban(input.iban);
  const maskedName = input.accountHolderName.length > 2
    ? input.accountHolderName.substring(0, 1) + "***" + input.accountHolderName.substring(input.accountHolderName.length - 1)
    : "***";

  let txResult;
  try {
    txResult = await db.$transaction(async (tx) => {
      await settleMaturedWalletTransactions(tx, engineerUserId);
      const spendable = await getSpendableBalance(tx, engineerUserId);

      if (amount > spendable) {
        throw new ApiError(
          400,
          `Withdrawal exceeds available spendable balance (${formatUsd(spendable)})`,
        );
      }
      
      const activeIban = await tx.withdrawalRequest.findFirst({
        where: {
          userId: engineerUserId,
          payoutType: "IBAN",
          status: { in: ["PENDING_REVIEW", "APPROVED", "TRANSFER_INITIATED", "PROCESSING"] },
        },
      });
      if (activeIban) {
         throw new ApiError(400, "You already have an active international withdrawal request.");
      }

      const lockedWallet = await lockWalletForUpdate(tx, engineerUserId);
      const now = new Date();
      
      const created = await tx.withdrawalRequest.create({
        data: {
          userId: engineerUserId,
          amount,
          method: "IBAN",
          accountNumber: maskedIban,
          payoutType: "IBAN",
          currency: "USD",
          country: input.country,
          bankName: input.bankName,
          accountHolderName: maskedName,
          accountHolderNameEncrypted: encryptedHolderName,
          ibanEncrypted: encryptedIban,
          swiftBicEncrypted: encryptedSwift,
          bankAddressEncrypted: encryptedAddress,
          status: "PENDING_REVIEW",
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
          description: `International withdrawal (IBAN)`,
          relatedWithdrawalId: created.id,
        },
      });

      await logPayoutEvent(tx, {
        withdrawalId: created.id,
        event: "CREATED",
        statusAfter: "PENDING_REVIEW",
        metadata: { method: "IBAN", amount },
      });

      await logPayoutEvent(tx, {
        withdrawalId: created.id,
        event: "BALANCE_HELD",
        statusBefore: "PENDING_REVIEW",
        statusAfter: "PENDING_REVIEW",
        message: formatUsd(amount),
      });

      return { withdrawal: created, wallet: lockedWallet };
    });
  } catch (error: any) {
    if (error.code === "P2002" && idempotencyKey) {
      const { metrics } = await import("../../utils/metrics");
      metrics.increment("payouts_duplicate_blocked");
      const existing = await db.withdrawalRequest.findFirst({
        where: { userId: engineerUserId, idempotencyKey },
      });
      if (existing) return existing;
    }
    throw error;
  }
  
  const { createNotification } = await import("../../utils/notifications");
  await createNotification(
    engineerUserId,
    "FUNDS_HELD",
    "Withdrawal request received",
    `Your ${formatUsd(amount)} international withdrawal request is pending review.`,
    "/balance",
  );

  return txResult.withdrawal;
}

export async function reconcilePendingPayouts(limit = 50) {
  if (!isPaymobPayoutConfigured()) {
    return { checked: 0, updated: 0 };
  }

  const { ORPHANED_TIMEOUT_MINUTES } = await import("./payout.state");
  const orphanedThreshold = new Date(Date.now() - ORPHANED_TIMEOUT_MINUTES * 60000);

  // 1. Handle Orphaned PENDING
  const orphanedPending = await db.withdrawalRequest.findMany({
    where: {
      status: "PENDING",
      updatedAt: { lt: orphanedThreshold }
    },
    take: limit,
  });

  let updated = 0;

  for (const row of orphanedPending) {
    const wallet = await db.wallet.findUnique({
      where: { userId: row.userId },
      select: { id: true },
    });
    if (wallet) {
      await markPayoutSubmissionFailed(
        row.id,
        wallet.id,
        Number(row.amount),
        "Orphaned PENDING payout — Paymob was never called; funds released",
      );
    } else {
      await db.withdrawalRequest.update({
        where: { id: row.id },
        data: {
          status: "FAILED",
          failureReason: "Orphaned PENDING payout",
          processedAt: new Date(),
        },
      });
    }
    updated += 1;
  }

  // 2. Handle Upstream Reconcilable States (SUBMITTED, PROCESSING)
  const pending = await db.withdrawalRequest.findMany({
    where: { status: { in: [...RECONCILABLE_STATUSES] } },
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
      const ids: string[] = [];
      if (row.paymobTransactionId) ids.push(row.paymobTransactionId);
      if (row.paymobClientReference) ids.push(row.paymobClientReference);
      return ids;
    });

    const uniqueIds = [...new Set(inquiryIds)].slice(0, 50);
    const bankTransactions = pending.some((row) =>
      row.method.startsWith("instant_bank"),
    );

    let inquiry;
    try {
      inquiry = await inquirePaymobPayoutTransactions(uniqueIds, {
        bankTransactions,
      });
    } catch (error) {
      console.error(
        "[payout-reconcile] Paymob inquiry failed:",
        error instanceof Error ? error.message : error,
      );
      return { checked: pending.length + orphanedPending.length, updated, error: true };
    }

    const byTransactionId = new Map<string, PaymobInquiryTransaction>();
    const byClientReference = new Map<string, PaymobInquiryTransaction>();
    for (const item of inquiry.results) {
      byTransactionId.set(item.transactionId, item);
      if (item.clientReference) {
        byClientReference.set(item.clientReference, item);
      }
    }

    const now = new Date();

    for (const row of pending) {
      const match =
        (row.paymobTransactionId &&
          byTransactionId.get(row.paymobTransactionId)) ||
        (row.paymobClientReference &&
          byClientReference.get(row.paymobClientReference));

      if (!match) {
        if (row.retryCount >= 5) {
          await markPayoutNeedsManualReview(
            row.id,
            "Max inquiry retries exceeded",
          );
          updated += 1;
        } else {
          const { metrics } = await import("../../utils/metrics");
          metrics.increment("reconciliation_retries");
          await db.withdrawalRequest.update({
            where: { id: row.id },
            data: { retryCount: { increment: 1 }, lastInquiryAt: now },
          });
        }
        continue;
      }

      await db.withdrawalRequest.update({
        where: { id: row.id },
        data: { lastInquiryAt: now, retryCount: 0 },
      });

      const before = await db.withdrawalRequest.findUnique({
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

export async function handlePaymobPayoutWebhook(payload: Record<string, unknown>) {
  const transactionId =
    typeof payload.transaction_id === "string"
      ? payload.transaction_id
      : payload.transaction_id != null
        ? String(payload.transaction_id)
        : null;
  const clientReference =
    typeof payload.client_reference === "string"
      ? payload.client_reference
      : typeof payload.reference === "string"
        ? payload.reference
        : null;

  if (!transactionId && !clientReference) {
    throw new ApiError(400, "Invalid payout webhook payload");
  }

  const withdrawal = await db.withdrawalRequest.findFirst({
    where: {
      OR: [
        transactionId ? { paymobTransactionId: transactionId } : undefined,
        clientReference ? { paymobClientReference: clientReference } : undefined,
      ].filter(Boolean) as Array<
        | { paymobTransactionId: string }
        | { paymobClientReference: string }
      >,
    },
  });

  if (!withdrawal) {
    return { matched: false };
  }

  const payloadAmount = Number(payload.amount);
  if (payloadAmount > 0 && payloadAmount !== Number(withdrawal.amount)) {
    throw new ApiError(400, "Webhook payload amount does not match the database withdrawal amount");
  }

  const inquiryResult: PaymobInquiryTransaction = {
    transactionId: transactionId ?? withdrawal.paymobTransactionId ?? "",
    issuer: String(payload.issuer ?? withdrawal.method),
    amount: Number(payload.amount ?? withdrawal.amount),
    disbursementStatus: String(
      payload.disbursement_status ?? payload.status ?? "failed",
    ),
    statusCode: String(payload.status_code ?? ""),
    statusDescription: String(payload.status_description ?? "Payout callback"),
    clientReference: clientReference ?? withdrawal.paymobClientReference ?? undefined,
    raw: payload,
  };

  const updated = await applyPaymobPayoutResult(
    withdrawal.id,
    inquiryResult,
    { event: "CALLBACK_RECEIVED", source: "webhook" },
  );

  return { matched: true, withdrawalId: withdrawal.id, status: updated.status };
}

export async function markPayoutNeedsManualReview(
  withdrawalId: number,
  reason: string,
) {
  return db.$transaction(async (tx) => {
    const withdrawal = await loadWithdrawalForUpdate(tx, withdrawalId);
    if (withdrawal.status === "FAILED_NEEDS_MANUAL_REVIEW") {
      return tx.withdrawalRequest.findUniqueOrThrow({
        where: { id: withdrawalId },
      });
    }
    assertPayoutTransition(withdrawal.status, "FAILED_NEEDS_MANUAL_REVIEW");

    const updated = await tx.withdrawalRequest.update({
      where: { id: withdrawalId },
      data: {
        status: "FAILED_NEEDS_MANUAL_REVIEW",
        failureReason: reason,
      },
    });

    await logPayoutEvent(tx, {
      withdrawalId,
      event: "RECONCILIATION",
      statusBefore: withdrawal.status,
      statusAfter: "FAILED_NEEDS_MANUAL_REVIEW",
      message: reason,
    });

    return updated;
  });
}

export async function markPayoutCompletedByAdmin(
  withdrawalId: number,
  adminId: number,
  adminNotes?: string,
) {
  return db.$transaction(async (tx) => {
    const withdrawal = await loadWithdrawalForUpdate(tx, withdrawalId);
    assertPayoutTransition(withdrawal.status, "COMPLETED");

    const wallet = await getWalletForUser(tx, withdrawal.userId);

    await tx.walletTransaction.updateMany({
      where: {
        walletId: wallet.id,
        relatedWithdrawalId: withdrawalId,
        type: "WITHDRAWAL",
      },
      data: { status: "COMPLETED" },
    });

    const updated = await tx.withdrawalRequest.update({
      where: { id: withdrawalId },
      data: {
        status: "COMPLETED",
        processedAt: new Date(),
        adminNotes: adminNotes ?? "Marked completed by admin",
      },
    });

    await logPayoutEvent(tx, {
      withdrawalId,
      event: "ADMIN_OVERRIDE",
      statusBefore: withdrawal.status,
      statusAfter: "COMPLETED",
      message: adminNotes,
      metadata: { adminId },
    });

    await logPayoutEvent(tx, {
      withdrawalId,
      event: "COMPLETED",
      statusBefore: withdrawal.status,
      statusAfter: "COMPLETED",
    });

    return updated;
  });
}

export async function resolvePayoutManualReview(
  withdrawalId: number,
  adminId: number,
  action: "release_funds" | "mark_completed" | "cancel",
  reason?: string,
) {
  const withdrawal = await db.withdrawalRequest.findUnique({
    where: { id: withdrawalId },
    select: { status: true },
  });
  if (!withdrawal) throw new ApiError(404, "Withdrawal request not found");
  if (withdrawal.status !== "FAILED_NEEDS_MANUAL_REVIEW") {
    throw new ApiError(
      400,
      "Only payouts in FAILED_NEEDS_MANUAL_REVIEW can be resolved through this action",
    );
  }

  if (action === "mark_completed") {
    return markPayoutCompletedByAdmin(withdrawalId, adminId, reason);
  }

  return cancelPayoutByAdmin(
    withdrawalId,
    adminId,
    reason ??
      (action === "release_funds"
        ? "Manual review — funds released to engineer"
        : "Cancelled by admin during manual review"),
  );
}

export async function cancelPayoutByAdmin(
  withdrawalId: number,
  adminId: number,
  reason?: string,
) {
  return db.$transaction(async (tx) => {
    const withdrawal = await loadWithdrawalForUpdate(tx, withdrawalId);
    assertPayoutTransition(withdrawal.status, "CANCELLED");

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
      await logPayoutEvent(tx, {
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

    await logPayoutEvent(tx, {
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

export async function getPayoutAuditTrail(withdrawalId: number) {
  return db.payoutAuditLog.findMany({
    where: { withdrawalId },
    orderBy: { createdAt: "asc" },
  });
}
