import { ensureWallet, walletHoldReleaseDate } from "../src/utils/wallet";
import db from "../src/config/db";

async function main() {
  console.log("Syncing old RELEASED payments into Wallet system...");

  const releasedPayments = await db.payment.findMany({
    where: { status: "RELEASED" },
    include: {
      engineer: { select: { userId: true } },
      project: { select: { title: true } },
    },
  });

  console.log(`Found ${releasedPayments.length} released payments.`);

  for (const payment of releasedPayments) {
    const netAmount = payment.amount - payment.commission;
    
    await db.$transaction(async (tx) => {
      // Ensure wallet exists
      const wallet = await ensureWallet(tx, payment.engineer.userId);

      // Check if a wallet transaction already exists for this payment
      const existingTx = await tx.walletTransaction.findFirst({
        where: { relatedPaymentId: payment.id },
      });

      if (existingTx) {
        console.log(`Payment ${payment.id} already synced.`);
        return;
      }

      // If this is an OLD payment, let's just make it fully AVAILABLE immediately
      // because 14 days have likely passed or we want to honor old released funds immediately.
      // Or we can just set it to AVAILABLE.
      const now = new Date();
      const holdDate = walletHoldReleaseDate(payment.updatedAt);
      const isMatured = now >= holdDate;
      const status = isMatured ? "AVAILABLE" : "PENDING";

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: netAmount,
          type: "RELEASED",
          status,
          description: `Legacy payment synced for "${payment.project.title}"`,
          availableAt: holdDate,
          relatedPaymentId: payment.id,
          createdAt: payment.updatedAt,
        },
      });

      if (status === "AVAILABLE") {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { availableBalance: { increment: netAmount } },
        });
      } else {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { pendingBalance: { increment: netAmount } },
        });
      }

      console.log(`Synced payment ${payment.id} -> ${status} (\${netAmount})`);
    });
  }

  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
