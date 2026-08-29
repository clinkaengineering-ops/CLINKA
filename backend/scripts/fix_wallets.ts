import db from "../src/config/db";

async function main() {
  const wallets = await db.wallet.findMany({
    include: { transactions: true }
  });
  
  for(let w of wallets) {
    const pendingCredits = w.transactions
      .filter((t: any) => t.status === 'PENDING' && t.type !== 'WITHDRAWAL')
      .reduce((acc: number, t: any) => acc + Number(t.amount), 0);
      
    const pendingDebits = w.transactions
      .filter((t: any) => t.status === 'PENDING' && t.type === 'WITHDRAWAL')
      .reduce((acc: number, t: any) => acc + Number(t.amount), 0);
      
      console.log(`Wallet ${w.id} (User ${w.userId}):`);
      console.log(`  DB Available: ${w.availableBalance} Pending: ${w.pendingBalance}`);
      console.log(`  Calculated Pending Credits: ${pendingCredits}`);
      console.log(`  Calculated Pending Debits: ${pendingDebits}`);
      const expectedPending = pendingCredits - pendingDebits;
      console.log(`  Expected Pending: ${expectedPending}`);
      
      const availableCredits = w.transactions
        .filter((t: any) => t.status === 'COMPLETED' || t.status === 'AVAILABLE')
        .reduce((acc: number, t: any) => acc + Number(t.amount), 0);
      const debits = w.transactions
        .filter((t: any) => (t.type === 'WITHDRAWAL' && (t.status === 'COMPLETED' || t.status === 'PROCESSING')))
        .reduce((acc: number, t: any) => acc + Number(t.amount), 0);
      const expectedAvailable = availableCredits - debits;
      console.log(`  Calculated Available Credits: ${availableCredits}, Debits: ${debits}`);
      console.log(`  Expected Available: ${expectedAvailable}`);
      
      await db.wallet.update({
        where: { id: w.id },
        data: {
          pendingBalance: expectedPending,
          availableBalance: expectedAvailable
        }
      });
      console.log(`  Fixed DB balances for wallet ${w.id}`);
    }
  // Delete the bogus "PROJECT_PAYMENT" wallet transactions created at funding
  const bogusTx = await db.walletTransaction.findMany({
    where: { type: "PROJECT_PAYMENT", description: { startsWith: "Payment for project:" } }
  });
  
  console.log(`Found ${bogusTx.length} bogus funding wallet transactions to delete.`);
  for(let tx of bogusTx) {
    console.log(`Deleting tx ${tx.id} - ${tx.description} - Amount: ${tx.amount}`);
    await db.walletTransaction.delete({ where: { id: tx.id } });
  }

}

main().finally(() => db.$disconnect());
