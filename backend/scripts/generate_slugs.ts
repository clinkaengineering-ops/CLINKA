import db from '../src/config/db';
import { generateProfileSlug } from '../src/utils/slug';

async function main() {
  console.log("Generating slugs for existing profiles...");

  const profiles = await db.engineerProfile.findMany({
    where: { slug: null },
    include: { user: true }
  });

  for (const profile of profiles) {
    const newSlug = await generateProfileSlug(profile.user.name, profile.user.id);
    await db.engineerProfile.update({
      where: { id: profile.id },
      data: { slug: newSlug }
    });
    console.log(`Generated slug for ${profile.user.name}: ${newSlug}`);
  }

  console.log(`Finished generating slugs for ${profiles.length} profiles.`);
}

main().catch(console.error).finally(() => db.$disconnect());
