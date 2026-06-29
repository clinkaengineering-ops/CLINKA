import type { PaymentLedgerType } from "../generated/prisma/enums";
import type { Prisma } from "../generated/prisma/client";

type Tx = Prisma.TransactionClient;
type MoneyInput = number | Prisma.Decimal;

function toNumber(value: MoneyInput) {
  return typeof value === "number" ? value : Number(value);
}

export async function recordPaymentLedger(
  tx: Tx,
  paymentId: number,
  entries: Array<{ type: PaymentLedgerType; amount: MoneyInput; note?: string }>,
) {
  if (entries.length === 0) return;
  await tx.paymentLedgerEntry.createMany({
    data: entries.map((e) => ({
      paymentId,
      type: e.type,
      amount: toNumber(e.amount),
      note: e.note ?? null,
    })),
  });
}

export function netEngineerAmount(amount: MoneyInput, commission: MoneyInput) {
  const amountNumber = toNumber(amount);
  const commissionNumber = toNumber(commission);
  return Math.round((amountNumber - commissionNumber) * 100) / 100;
}
