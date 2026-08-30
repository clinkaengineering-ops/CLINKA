import { PrismaClient } from "./src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  const reqs = await prisma.withdrawalRequest.findMany({
    select: { id: true, status: true, proofUrl: true, externalReference: true }
  });
  console.log("WithdrawalRequests:");
  console.log(JSON.stringify(reqs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
