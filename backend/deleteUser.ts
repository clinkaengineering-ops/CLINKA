// @ts-nocheck
import { PrismaClient } from './src/generated/prisma/client';

const prisma = new PrismaClient({});

async function main() {
  try {
    const user = await prisma.user.findUnique({ where: { id: 12 } });
    if (!user) {
        console.log("User ID 12 not found.");
        return;
    }
    console.log("Found user:", user.email, user.role);
    
    // Using prisma to delete, which handles some cascades
    await prisma.user.delete({
      where: { id: 12 }
    });
    
    console.log("User successfully deleted.");
  } catch (e) {
    console.error("Error deleting user:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
