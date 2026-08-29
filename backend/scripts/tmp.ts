import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const wallets = await prisma.wallet.findMany({
    include: { transactions: true }
  });
  
  for(let w of wallets) {
    const pendingCredits = w.transactions
      .filter(t => t.status === 'PENDING' && t.type !== 'WITHDRAWAL')
      .reduce((acc, t) => acc + Number(t.amount), 0);
      
    const pendingDebits = w.transactions
      .filter(t => t.status === 'PENDING' && t.type === 'WITHDRAWAL')
      .reduce((acc, t) => acc + Number(t.amount), 0);
      
    if (w.transactions.length > 0 || Number(w.pendingBalance) !== 0) {
      console.log('Wallet ' + w.id + ' (User ' + w.userId + '):');
      console.log('  DB Available: ' + w.availableBalance + ' Pending: ' + w.pendingBalance);
      console.log('  Calculated Pending Credits: ' + pendingCredits);
      console.log('  Calculated Pending Debits: ' + pendingDebits);
      console.log('  Expected Pending (Credits - Debits): ' + (pendingCredits - pendingDebits));
    }
  }
}

main().finally(() => prisma.$disconnect());
