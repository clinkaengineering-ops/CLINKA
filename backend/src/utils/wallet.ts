import db from "../config/db";

const HOLD_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

type TxLike = any;

export function walletHoldReleaseDate(from = new Date()): Date {
  return new Date(from.getTime() + HOLD_DAYS * DAY_MS);
}

export async function ensureWallet(tx: TxLike, userId: number) {
  const existing = await tx.wallet.findUnique({ where: { userId } });
  if (existing) return existing;

  return tx.wallet.create({
    data: {
      userId,
      availableBalance: 0,
      pendingBalance: 0,
    },
  });
}

export async function settleMaturedWalletTransactions(
  tx: TxLike,
  userId: number,
  now = new Date(),
) {
  const wallet = await ensureWallet(tx, userId);

  const matured = await tx.walletTransaction.findMany({
    where: {
      walletId: wallet.id,
      status: "PENDING",
      availableAt: { lte: now },
    },
    select: { id: true, amount: true },
  });

  if (matured.length === 0) {
    return {
      wallet,
      maturedCount: 0,
      maturedAmount: 0,
    };
  }

  const maturedAmount = matured.reduce((sum: number, item: any) => sum + item.amount, 0);

  await tx.walletTransaction.updateMany({
    where: { id: { in: matured.map((m: any) => m.id) } },
    data: { status: "AVAILABLE" },
  });

  const updatedWallet = await tx.wallet.update({
    where: { id: wallet.id },
    data: {
      pendingBalance: { decrement: maturedAmount },
      availableBalance: { increment: maturedAmount },
    },
  });

  return {
    wallet: updatedWallet,
    maturedCount: matured.length,
    maturedAmount,
  };
}
