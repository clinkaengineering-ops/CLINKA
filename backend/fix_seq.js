const { Client } = require('pg');
const client = new Client({
  connectionString: "postgres://postgres:OUP8UDMwL51SLFc2U42v0KsGXiaHsPu9J1dmpvmUHxI0NOKetpFQIkYv600VaxAq@159.195.202.54:5432/postgres",
});

async function main() {
  await client.connect();

  const res = await client.query(`
    SELECT setval('"ProjectDeliverable_id_seq"', COALESCE((SELECT MAX(id) FROM "ProjectDeliverable") + 1, 1), false);
  `);
  
  console.log("Fixed sequence:", res.rows);

  await client.end();
}
main().catch(console.error);
