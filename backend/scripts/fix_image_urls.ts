import prisma from "../src/config/db";

async function fixImageUrls() {
  console.log("Starting image URL fix...");

  // Fix PortfolioProject images
  const portfolios = await prisma.portfolioProject.findMany({
    where: {
      OR: [
        { coverImageUrl: { startsWith: "http://" } },
      ],
    },
  });

  console.log(`Found ${portfolios.length} portfolio items to fix.`);

  for (const item of portfolios) {
    if (item.coverImageUrl && item.coverImageUrl.startsWith("http://")) {
      await prisma.portfolioProject.update({
        where: { id: item.id },
        data: {
          coverImageUrl: item.coverImageUrl.replace("http://", "https://"),
        },
      });
      console.log(`Fixed portfolio item ${item.id}`);
    }
  }

  // Fix EngineerProfile images
  const profiles = await prisma.engineerProfile.findMany({
    where: {
      OR: [
        { coverImageUrl: { startsWith: "http://" } },
      ],
    },
  });

  console.log(`Found ${profiles.length} engineer profiles to fix cover images.`);

  for (const profile of profiles) {
    if (profile.coverImageUrl && profile.coverImageUrl.startsWith("http://")) {
      await prisma.engineerProfile.update({
        where: { id: profile.id },
        data: {
          coverImageUrl: profile.coverImageUrl.replace("http://", "https://"),
        },
      });
      console.log(`Fixed engineer profile ${profile.id} cover image`);
    }
  }

  // Fix User avatars
  const users = await prisma.user.findMany({
    where: {
      avatarUrl: { startsWith: "http://" },
    },
  });

  console.log(`Found ${users.length} users to fix avatars.`);

  for (const user of users) {
    if (user.avatarUrl && user.avatarUrl.startsWith("http://")) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          avatarUrl: user.avatarUrl.replace("http://", "https://"),
        },
      });
      console.log(`Fixed user ${user.id} avatar`);
    }
  }

  console.log("Finished fixing image URLs.");
}

fixImageUrls()
  .catch((e) => {
    console.error("Error fixing image URLs:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
