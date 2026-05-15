"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("../generated/prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    throw new Error('Missing DATABASE_URL in environment');
}
// Use the pg driver adapter as required by the generated client configuration.
const adapter = new adapter_pg_1.PrismaPg({ connectionString: dbUrl });
const prisma = new client_1.PrismaClient({
    adapter,
    log: ['warn', 'error'],
});
exports.default = prisma;
