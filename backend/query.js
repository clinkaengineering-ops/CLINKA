const { Client } = require('pg');

const client = new Client({
  connectionString: "postgres://postgres:OUP8UDMwL51SLFc2U42v0KsGXiaHsPu9J1dmpvmUHxI0NOKetpFQIkYv600VaxAq@159.195.202.54:5432/postgres",
});

async function main() {
  await client.connect();

  console.log("--- Engineers Profile with PENDING status ---");
  const res = await client.query(`
    SELECT
      ep.id as profile_id,
      ep."userId",
      u.email,
      ep."verificationStatus",
      (SELECT COUNT(*) FROM "PortfolioItem" pi WHERE pi."engineerId" = ep.id) as portfolio_count
    FROM "EngineerProfile" ep
    JOIN "User" u ON u.id = ep."userId"
    WHERE ep."verificationStatus" = 'PENDING';
  `);
  console.log(res.rows);

  console.log("--- Users with ENGINEER role but no Profile ---");
  const res2 = await client.query(`
    SELECT u.id, u.email, u.role
    FROM "User" u
    LEFT JOIN "EngineerProfile" ep ON ep."userId" = u.id
    WHERE u.role = 'ENGINEER' AND ep.id IS NULL;
  `);
  console.log(res2.rows);

  await client.end();
}

main().catch(console.error);
