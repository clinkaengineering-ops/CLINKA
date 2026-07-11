import db from "./src/config/db";

async function main() {
  await db.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "one_active_iban_per_user" 
    ON "WithdrawalRequest"("userId") 
    WHERE "payoutType" = 'IBAN' 
    AND status IN ('PENDING_REVIEW', 'APPROVED', 'TRANSFER_INITIATED', 'PROCESSING');
  `);
  console.log("Index created");
}
main().finally(() => db.$disconnect());
