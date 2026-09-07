import db from "./config/db";

async function run() {
  const keywords = ['alashkam', 'test', 'upload'];
  
  console.log("Finding engineers to delete...");
  const usersToDelete = await db.user.findMany({
    where: {
      role: 'ENGINEER',
      OR: keywords.map(kw => ({ email: { contains: kw, mode: 'insensitive' } }))
    }
  });

  console.log(`Found ${usersToDelete.length} engineers to delete.`);
  for (const user of usersToDelete) {
    console.log(`- ${user.email} (${user.id})`);
  }

  if (usersToDelete.length === 0) {
    console.log("No users found matching the criteria.");
    return;
  }

  // Delete them
  const result = await db.user.deleteMany({
    where: {
      id: { in: usersToDelete.map(u => u.id) }
    }
  });

  console.log(`Successfully deleted ${result.count} engineers.`);
}

run().catch(console.error).finally(() => db.$disconnect());
