const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres:01015635789@Mm@localhost:5432/mohamedtalal"
  });
  await client.connect();
  const res = await client.query('SELECT id, status, "proofUrl", "externalReference" FROM "WithdrawalRequest" ORDER BY id DESC LIMIT 5');
  console.log("Latest WithdrawalRequests:");
  console.table(res.rows);
  await client.end();
}
main().catch(console.error);
