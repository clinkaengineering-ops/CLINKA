import db from "./config/db";

async function main() {
  console.log("Connecting...");
  try {
    await db.$connect();
    console.log("Connected! Now querying...");
    const users = await db.user.findMany();
    console.log("Users:", users);
  } catch (error) {
    console.error("Error connecting/querying:", error);
  } finally {
    await db.$disconnect();
  }
}

main();
