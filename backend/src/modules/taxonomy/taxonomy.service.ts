import db from "../../config/db";

export async function getDisciplines() {
  return db.discipline.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      specializations: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

export async function getSkills(q?: string) {
  const whereClause = q ? { name: { contains: q, mode: "insensitive" as const } } : {};
  return db.skill.findMany({
    where: whereClause,
    orderBy: [{ popularity: "desc" }, { name: "asc" }],
    include: {
      category: true,
    },
    take: 50,
  });
}

export async function getServiceAreas(q?: string, type?: string) {
  const whereClause: any = {};
  if (q) {
    whereClause.name = { contains: q, mode: "insensitive" as const };
  }
  if (type) {
    whereClause.type = type;
  }
  return db.serviceArea.findMany({
    where: whereClause,
    orderBy: { name: "asc" },
    take: 50,
  });
}

export async function getLanguages() {
  return db.language.findMany({
    orderBy: { name: "asc" },
  });
}
