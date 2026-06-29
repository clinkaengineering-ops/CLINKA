"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordPaymentLedger = recordPaymentLedger;
exports.netEngineerAmount = netEngineerAmount;
function toNumber(value) {
    return typeof value === "number" ? value : Number(value);
}
async function recordPaymentLedger(tx, paymentId, entries) {
    if (entries.length === 0)
        return;
    await tx.paymentLedgerEntry.createMany({
        data: entries.map((e) => ({
            paymentId,
            type: e.type,
            amount: toNumber(e.amount),
            note: e.note ?? null,
        })),
    });
}
function netEngineerAmount(amount, commission) {
    const amountNumber = toNumber(amount);
    const commissionNumber = toNumber(commission);
    return Math.round((amountNumber - commissionNumber) * 100) / 100;
}
