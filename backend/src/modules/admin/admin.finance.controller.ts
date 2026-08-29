import { Request, Response, NextFunction } from "express";
import db from "../../config/db";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";

// ─── OVERVIEW METRICS ────────────────────────────────────────────────────────

export async function getFinanceOverviewController(req: Request, res: Response, next: NextFunction) {
  try {
    const [
      totalPaymentsResult,
      pendingManualPayments,
      pendingWithdrawals,
      commissionResult,
      engineerEarningsResult,
      failedTransactions
    ] = await Promise.all([
      db.payment.aggregate({
        _count: { id: true },
        _sum: { amountUsd: true },
        where: { status: "FUNDED" }
      }),
      db.manualPaymentSubmission.count({ where: { status: "PENDING" } }),
      db.withdrawalRequest.count({ where: { status: "PENDING_REVIEW" } }),
      db.paymentLedgerEntry.aggregate({
        _sum: { amount: true },
        where: { type: "PLATFORM_COMMISSION" }
      }),
      db.paymentLedgerEntry.aggregate({
        _sum: { amount: true },
        where: { type: "ENGINEER_ESCROW" }
      }),
      db.withdrawalRequest.count({ where: { status: { in: ["FAILED_NEEDS_MANUAL_REVIEW", "FAILED", "REJECTED"] } } })
    ]);

    res.json(ApiResponse(200, "Finance overview retrieved", {
      totalPayments: totalPaymentsResult._count.id,
      totalMoneyReceived: totalPaymentsResult._sum.amountUsd || 0,
      pendingManualPayments,
      pendingWithdrawals,
      totalPlatformCommissions: commissionResult._sum.amount || 0,
      totalEngineerEarnings: engineerEarningsResult._sum.amount || 0,
      failedTransactions
    }));
  } catch (err) {
    next(err);
  }
}

// ─── UNIFIED TRANSACTIONS LEDGER ─────────────────────────────────────────────

export async function getUnifiedTransactionsController(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // A true unified ledger in SQL would require a UNION view.
    // For Prisma, we can query PaymentLedgerEntry, WalletTransaction, and WithdrawalRequest, 
    // then merge and sort them in JS for simplicity, though this limits robust pagination if datasets are huge.
    // Since this is an admin tool, we'll fetch recent records from each and merge them.
    
    const [ledgerEntries, walletTxs, withdrawals] = await Promise.all([
      db.paymentLedgerEntry.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { payment: { include: { project: true, client: true, engineer: { include: { user: true } } } } }
      }),
      db.walletTransaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { wallet: { include: { user: true } } }
      }),
      db.withdrawalRequest.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { user: true }
      })
    ]);

    const unified: any[] = [];

    for (const l of ledgerEntries) {
      unified.push({
        id: `L-${l.id}`,
        date: l.createdAt,
        type: l.type,
        reference: l.paymentId ? `PAY-${l.paymentId}` : null,
        user: l.payment.client.name,
        amount: l.amount,
        currency: "USD",
        status: "COMPLETED",
        note: l.note
      });
    }

    for (const w of walletTxs) {
      unified.push({
        id: `W-${w.id}`,
        date: w.createdAt,
        type: w.type,
        reference: w.relatedPaymentId ? `PAY-${w.relatedPaymentId}` : w.relatedWithdrawalId ? `WD-${w.relatedWithdrawalId}` : null,
        user: w.wallet.user.name,
        amount: w.amount,
        currency: "USD",
        status: w.status,
        note: w.description
      });
    }

    for (const wr of withdrawals) {
      unified.push({
        id: `WD-${wr.id}`,
        date: wr.createdAt,
        type: "PAYOUT",
        reference: wr.externalReference || wr.paymobTransactionId || null,
        user: wr.user.name,
        amount: wr.amount,
        currency: wr.currency,
        status: wr.status,
        note: wr.method
      });
    }

    unified.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Slice for pagination (simulated)
    const paginated = unified.slice(0, limit);

    res.json(ApiResponse(200, "Transactions retrieved", paginated));
  } catch (err) {
    next(err);
  }
}

// ─── MANUAL PAYMENT SETTINGS ─────────────────────────────────────────────────

export async function getManualPaymentSettingsController(req: Request, res: Response, next: NextFunction) {
  try {
    let settings = await db.platformSettings.findFirst();
    if (!settings) {
      settings = await db.platformSettings.create({ data: { platformFeePercent: 10 } });
    }
    res.json(ApiResponse(200, "Manual payment settings retrieved", settings.manualPaymentSettings || {}));
  } catch (err) {
    next(err);
  }
}

export async function updateManualPaymentSettingsController(req: Request, res: Response, next: NextFunction) {
  try {
    const { manualPaymentSettings } = req.body;
    let settings = await db.platformSettings.findFirst();
    
    if (!settings) {
      settings = await db.platformSettings.create({ 
        data: { platformFeePercent: 10, manualPaymentSettings } 
      });
    } else {
      settings = await db.platformSettings.update({
        where: { id: settings.id },
        data: { manualPaymentSettings }
      });
    }
    
    res.json(ApiResponse(200, "Manual payment settings updated", settings.manualPaymentSettings));
  } catch (err) {
    next(err);
  }
}
