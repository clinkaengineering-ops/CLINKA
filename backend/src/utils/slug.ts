import db from '../config/db';

export async function generateProfileSlug(name: string, userId: number): Promise<string> {
  // Base slug from name
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Swap spaces for hyphens
    .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens

  if (!baseSlug) {
    return `engineer-${userId}`;
  }

  // 1. Try base slug
  const existing1 = await db.engineerProfile.findUnique({ where: { slug: baseSlug } });
  if (!existing1) return baseSlug;

  // 2. Try baseSlug-userId
  const slugWithId = `${baseSlug}-${userId}`;
  const existing2 = await db.engineerProfile.findUnique({ where: { slug: slugWithId } });
  if (!existing2) return slugWithId;

  // 3. Keep incrementing
  let counter = 1;
  while (true) {
    const slugWithCounter = `${baseSlug}-${userId}-${counter}`;
    const existing = await db.engineerProfile.findUnique({ where: { slug: slugWithCounter } });
    if (!existing) return slugWithCounter;
    counter++;
  }
}
