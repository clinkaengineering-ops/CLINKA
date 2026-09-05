const { Client } = require('pg');
async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  await client.query('ALTER TABLE "Payment" DROP COLUMN IF EXISTS "isAdminOverride";');
  await client.query('ALTER TABLE "Project" DROP COLUMN IF EXISTS "deliveredAt", DROP COLUMN IF EXISTS "disputePausedAt", DROP COLUMN IF EXISTS "disputeWindowClosesAt";');
  await client.query('ALTER TABLE "Wallet" DROP COLUMN IF EXISTS "heldByDispute";');
  await client.query('ALTER TABLE "WithdrawalRequest" DROP COLUMN IF EXISTS "proofOriginalName", DROP COLUMN IF EXISTS "proofUrl";');
  
  try {
    await client.query('DROP TYPE IF EXISTS "DisputeStatus";');
  } catch(e) {
    console.log('Could not drop DisputeStatus enum (maybe in use?):', e.message);
  }
  
  console.log('Drops completed');
  await client.end();
}
main().catch(console.error);
