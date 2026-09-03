const fs = require("fs");
const path = require("path");

const migrationsDir = path.join(__dirname, "..", "prisma", "migrations");
const sql = fs
  .readdirSync(migrationsDir)
  .filter((name) => fs.existsSync(path.join(migrationsDir, name, "migration.sql")))
  .map((name) => fs.readFileSync(path.join(migrationsDir, name, "migration.sql"), "utf8"))
  .join("\n");

const required = [
  { id: 'Project.deliveredAt', re: /ALTER TABLE "Project"[\s\S]*?"deliveredAt"/ },
  { id: 'Project.disputeWindowClosesAt', re: /"disputeWindowClosesAt"/ },
  { id: 'Project.disputePausedAt', re: /"disputePausedAt"/ },
  { id: 'Wallet.heldByDispute', re: /ALTER TABLE "Wallet"[\s\S]*?"heldByDispute"/ },
  { id: 'Dispute table', re: /CREATE TABLE "Dispute"/ },
  { id: 'DisputeStatus enum', re: /CREATE TYPE "DisputeStatus"/ },
  { id: 'SystemAuditLog table', re: /CREATE TABLE "SystemAuditLog"/ },
  { id: 'Payment.isAdminOverride', re: /ALTER TABLE "Payment"[\s\S]*?"isAdminOverride"/ },
];

const missing = required.filter((item) => !item.re.test(sql));
if (missing.length) {
  console.error("schema.prisma changes are missing from prisma/migrations:");
  for (const item of missing) console.error(`  - ${item.id}`);
  console.error("Run `npx prisma migrate dev --name <descriptive_name>` and commit the generated folder.");
  process.exit(1);
}

console.log("verify-migrations-cover-schema: required dispute/hold identifiers are present in prisma/migrations.");
