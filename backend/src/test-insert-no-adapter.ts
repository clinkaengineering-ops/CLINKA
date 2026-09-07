import { PrismaClient } from "./generated/prisma/client";

async function run() {
  const prisma = new PrismaClient({ log: ['query', 'warn', 'error'] });
  try {
    const u = await prisma.user.create({
      data: { email: `test_${Date.now()}@test.com`, password: "x", name: "Test User", role: "CLIENT" }
    });
    console.log("SUCCESS:", u);
  } catch (e) {
    console.error("FAILED:", e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
