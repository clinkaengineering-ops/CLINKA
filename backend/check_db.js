const { Client } = require('pg');
async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query('SELECT COUNT(*) FROM "WithdrawalRequest" WHERE "proofOriginalName" IS NOT NULL OR "proofUrl" IS NOT NULL;');
  console.log('WithdrawalRequest with proofs:', res.rows);
  const res2 = await client.query('SELECT COUNT(*) FROM "Project" WHERE "deliveredAt" IS NOT NULL;');
  console.log('Projects with deliveredAt:', res2.rows);
  const res3 = await client.query('SELECT COUNT(*) FROM "Payment" WHERE "isAdminOverride" = true;');
  console.log('Payments with isAdminOverride:', res3.rows);
  await client.end();
}
main().catch(console.error);
