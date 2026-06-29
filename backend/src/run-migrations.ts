import fs from "fs";
import path from "path";
import db from "./config/db";

async function main() {
  const migrationsDir = path.join(__dirname, "../prisma/migrations");
  const entries = fs.readdirSync(migrationsDir, { withFileTypes: true });
  
  // Sort migration directories chronologically
  const migrationDirs = entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();

  console.log("Found migrations:", migrationDirs);

  for (const dir of migrationDirs) {
    const sqlPath = path.join(migrationsDir, dir, "migration.sql");
    if (fs.existsSync(sqlPath)) {
      console.log(`Running migration: ${dir}`);
      const sql = fs.readFileSync(sqlPath, "utf-8");
      
      try {
        await db.$executeRawUnsafe(sql);
        console.log(`✅ Migration ${dir} applied successfully`);
      } catch (error) {
        console.error(`❌ Migration ${dir} failed:`, error);
        throw error;
      }
    }
  }
  console.log("All migrations applied successfully!");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
