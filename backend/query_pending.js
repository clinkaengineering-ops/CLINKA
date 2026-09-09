const { Client } = require('pg');
const client = new Client({
  connectionString: "postgres://postgres:OUP8UDMwL51SLFc2U42v0KsGXiaHsPu9J1dmpvmUHxI0NOKetpFQIkYv600VaxAq@159.195.202.54:5432/postgres",
});

async function main() {
  await client.connect();

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
  
  console.log("Found", res.rows.length, "pending profiles");
  console.log(res.rows);

  await client.end();
}
main().catch(console.error);
