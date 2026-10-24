const { Client } = require("pg");

async function resolveFailedMigrations() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log("[Migration Fix] DATABASE_URL not set; skipping failed migration check.");
    return;
  }

  const clientConfig = { connectionString: dbUrl };
  if (dbUrl.includes("sslmode=") || dbUrl.includes("supabase") || dbUrl.includes("rds")) {
    clientConfig.ssl = { rejectUnauthorized: false };
  }

  const client = new Client(clientConfig);

  try {
    await client.connect();

    // Check if _prisma_migrations table exists
    const checkTable = await client.query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = '_prisma_migrations';
    `);

    if (checkTable.rowCount === 0) {
      console.log("[Migration Fix] _prisma_migrations table does not exist yet.");
      await client.end();
      return;
    }

    // Check for failed migrations (finished_at IS NULL)
    const failedMigrations = await client.query(`
      SELECT id, migration_name, started_at 
      FROM _prisma_migrations 
      WHERE finished_at IS NULL;
    `);

    if (failedMigrations.rows.length > 0) {
      console.warn(`[Migration Fix] Found ${failedMigrations.rows.length} failed migration(s) in _prisma_migrations:`);
      for (const row of failedMigrations.rows) {
        console.warn(`[Migration Fix] - ${row.migration_name} (started at ${row.started_at})`);
      }

      const deleteRes = await client.query(`
        DELETE FROM _prisma_migrations 
        WHERE finished_at IS NULL;
      `);
      console.log(`[Migration Fix] Successfully cleared ${deleteRes.rowCount} failed migration record(s). Prisma will re-apply.`);
    } else {
      console.log("[Migration Fix] No failed migrations in _prisma_migrations.");
    }

    await client.end();
  } catch (error) {
    console.warn("[Migration Fix] Non-fatal check completed:", error.message);
    try {
      await client.end();
    } catch (_) {}
  }
}

resolveFailedMigrations().catch((err) => {
  console.warn("[Migration Fix] Unhandled error:", err.message);
});
