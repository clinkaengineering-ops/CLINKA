const { Client } = require('pg');
const client = new Client({
  connectionString: "postgres://postgres:OUP8UDMwL51SLFc2U42v0KsGXiaHsPu9J1dmpvmUHxI0NOKetpFQIkYv600VaxAq@159.195.202.54:5432/postgres",
});

async function main() {
  await client.connect();

  const res = await client.query(`
    SELECT u.id, u.email, u.role, u."googleId", u."createdAt", ep.id as profile_id, ep."createdAt" as profile_created_at
    FROM "User" u
    JOIN "EngineerProfile" ep ON ep."userId" = u.id
    WHERE ep."verificationStatus" = 'PENDING'
  `);
  console.log(res.rows);

  const res2 = await client.query(`
    SELECT * FROM "PortfolioItem" LIMIT 5;
  `);
  console.log("Some portfolio items:", res2.rows);

  await client.end();
}
main().catch(console.error);
