"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const db_1 = __importDefault(require("./config/db"));
async function main() {
    const migrationsDir = path_1.default.join(__dirname, "../prisma/migrations");
    const entries = fs_1.default.readdirSync(migrationsDir, { withFileTypes: true });
    // Sort migration directories chronologically
    const migrationDirs = entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
        .sort();
    console.log("Found migrations:", migrationDirs);
    for (const dir of migrationDirs) {
        const sqlPath = path_1.default.join(migrationsDir, dir, "migration.sql");
        if (fs_1.default.existsSync(sqlPath)) {
            console.log(`Running migration: ${dir}`);
            const sql = fs_1.default.readFileSync(sqlPath, "utf-8");
            try {
                await db_1.default.$executeRawUnsafe(sql);
                console.log(`✅ Migration ${dir} applied successfully`);
            }
            catch (error) {
                console.error(`❌ Migration ${dir} failed:`, error);
                throw error;
            }
        }
    }
    console.log("All migrations applied successfully!");
}
main()
    .catch(console.error)
    .finally(() => db_1.default.$disconnect());
