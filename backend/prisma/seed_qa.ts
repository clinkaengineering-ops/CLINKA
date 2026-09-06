import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  // Client
  await prisma.user.upsert({
    where: { email: "client@clinka.com" },
    update: { password: passwordHash },
    create: {
      email: "client@clinka.com",
      name: "Client Test",
      password: passwordHash,
      role: "CLIENT",
      status: "ACTIVE",
    },
  });

  // Engineer
  await prisma.user.upsert({
    where: { email: "engineer@clinka.com" },
    update: { password: passwordHash },
    create: {
      email: "engineer@clinka.com",
      name: "Engineer Test",
      password: passwordHash,
      role: "ENGINEER",
      status: "VERIFIED",
    },
  });

  // Admin
  await prisma.user.upsert({
    where: { email: "admin@clinka.com" },
    update: { password: passwordHash },
    create: {
      email: "admin@clinka.com",
      name: "Admin Test",
      password: passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  console.log("Seeded all 3 QA users successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
