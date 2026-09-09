const { Client } = require('pg');
const client = new Client({
  connectionString: "postgres://postgres:OUP8UDMwL51SLFc2U42v0KsGXiaHsPu9J1dmpvmUHxI0NOKetpFQIkYv600VaxAq@159.195.202.54:5432/postgres",
});

async function main() {
  await client.connect();

  const res = await client.query(`
    SELECT "timestamp", "level", "message", "action", "actorId", "targetId"
    FROM "SystemLog"
    WHERE "level" IN ('ERROR', 'WARN')
    ORDER BY "timestamp" DESC
    LIMIT 20;
  `);
  
  console.log("Recent Errors:", res.rows);

  await client.end();
}
main().catch(console.error);
