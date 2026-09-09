import { PrismaClient } from './src/generated/prisma';
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgres://postgres:OUP8UDMwL51SLFc2U42v0KsGXiaHsPu9J1dmpvmUHxI0NOKetpFQIkYv600VaxAq@159.195.202.54:5432/postgres"
    }
  }
});

async function main() {
  const pendingProfiles = await prisma.engineerProfile.findMany({
    where: { verificationStatus: 'PENDING' },
    include: { user: true, portfolio: true }
  });
  console.log("Pending profiles:", JSON.stringify(pendingProfiles, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
