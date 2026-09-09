const { Client } = require('pg');
const client = new Client({
  connectionString: "postgres://postgres:OUP8UDMwL51SLFc2U42v0KsGXiaHsPu9J1dmpvmUHxI0NOKetpFQIkYv600VaxAq@159.195.202.54:5432/postgres",
});

async function main() {
  await client.connect();
  const tables = ['ProjectSubmission', 'Project', 'User', 'EngineerProfile', 'ClientProfile', 'Dispute', 'Message', 'Conversation', 'Payment', 'Wallet', 'WalletTransaction', 'Bid', 'Skill'];
  
  for (const table of tables) {
    try {
      const res = await client.query(`SELECT setval('"${table}_id_seq"', COALESCE((SELECT MAX(id) FROM "${table}") + 1, 1), false);`);
      console.log(`${table}: ${res.rows[0].setval}`);
    } catch (e) {
      console.log(`Failed for ${table}`);
    }
  }

  await client.end();
}
main().catch(console.error);
