import ApiError from "../../utils/ApiError";
import { searchQuerySchema, type updateProfileInput } from "./user.validation";
import db from "../../config/db";
import { calculateProfessionalScore } from "../../utils/ranking";
import { z } from "zod";

// ── Helper: strip password from any user object ───────────────────────────────
function stripPassword<T extends { password: string }>({
  password: _,
  ...safe
}: T) {
  return safe;
}

// ── getMe ─────────────────────────────────────────────────────────────────────
export async function getMe(userId: number) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: {
          portfolio: true,
          reviews: {
            include: { client: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });
  if (!user) throw new ApiError(404, "User not found");
  return stripPassword(user);
}

// ── updateMe ──────────────────────────────────────────────────────────────────
// FIX 1: Always includes profile in the response so the frontend Me type is complete.
// FIX 2: bio can be "" (empty string) — use `bio !== undefined` not `bio &&`.
export async function updateMe(userId: number, data: updateProfileInput) {
  const { 
    name, 
    specializationIds, 
    skillIds, 
    serviceAreaIds, 
    languages, 
    certifications, 
    ...profileData 
  } = data;

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!user) throw new ApiError(404, "User not found");

  // Prepare relational updates if present
  let nestedWrites = {};
  
  if (specializationIds !== undefined) {
    nestedWrites = {
      ...nestedWrites,
      specializations: {
        deleteMany: {}, // clear old
        create: specializationIds.map(id => ({ specializationId: id }))
      }
    };
  }

  if (skillIds !== undefined) {
    nestedWrites = {
      ...nestedWrites,
      skills: {
        deleteMany: {},
        create: skillIds.map(id => ({ skillId: id }))
      }
    };
  }

  if (serviceAreaIds !== undefined) {
    nestedWrites = {
      ...nestedWrites,
      serviceAreas: {
        deleteMany: {},
        create: serviceAreaIds.map(id => ({ serviceAreaId: id }))
      }
    };
  }

  if (languages !== undefined) {
    nestedWrites = {
      ...nestedWrites,
      languages: {
        deleteMany: {},
        create: languages.map(l => ({ languageId: l.languageId, proficiency: l.proficiency }))
      }
    };
  }

  if (certifications !== undefined) {
    nestedWrites = {
      ...nestedWrites,
      certifications: {
        deleteMany: {},
        create: certifications.map(c => ({ certificationId: c.certificationId, year: c.year }))
      }
    };
  }
  
  // Clean up undefined from profileData to avoid overriding with undefined
  const cleanedProfileData = Object.fromEntries(
    Object.entries(profileData).filter(([_, v]) => v !== undefined)
  );

  const updatedUser = await db.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined && { name }),
      ...(user.profile && (Object.keys(cleanedProfileData).length > 0 || Object.keys(nestedWrites).length > 0)
        ? { profile: { update: { ...cleanedProfileData, ...nestedWrites } } }
        : {}),
    },
    include: {
      profile: {
        include: {
          portfolio: true,
          specializations: { include: { specialization: true } },
          skills: { include: { skill: true } },
          serviceAreas: { include: { serviceArea: true } },
          languages: { include: { language: true } },
          certifications: { include: { certification: true } },
          reviews: {
            include: { client: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  return stripPassword(updatedUser);
}

export async function updateAvatar(userId: number, avatarUrl: string) {
  const user = await db.user.update({
    where: { id: userId },
    data: { avatarUrl },
    include: {
      profile: {
        include: {
          portfolio: true,
          reviews: {
            include: { client: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });
  return stripPassword(user);
}

export async function updateCoverImage(userId: number, coverImageUrl: string) {
  const profile = await db.engineerProfile.findUnique({ where: { userId } });
  if (!profile) throw new ApiError(404, "Engineer profile not found");
  await db.engineerProfile.update({
    where: { userId },
    data: { coverImageUrl },
  });
  return getMe(userId);
}

// ── getEngineers ──────────────────────────────────────────────────────────────
export async function getEngineers(query: z.infer<typeof searchQuerySchema>) {
  const {
    q, specialty, nationality, disciplineId, skillIds, serviceAreaId,
    hourlyRateMax, startingPriceMax, availabilityStatus, sortBy, page, limit
  } = query;

  const skip = (page - 1) * limit;

  // Build the nested profile where clause
  const profileWhere: any = { verificationStatus: "APPROVED" };

  if (specialty) profileWhere.specialty = specialty;
  if (nationality) profileWhere.nationality = nationality;
  if (availabilityStatus) profileWhere.availabilityStatus = availabilityStatus;
  
  if (hourlyRateMax !== undefined) profileWhere.hourlyRateUSD = { lte: hourlyRateMax };
  if (startingPriceMax !== undefined) profileWhere.startingProjectPriceUSD = { lte: startingPriceMax };

  if (disciplineId) {
    profileWhere.specializations = { some: { specialization: { disciplineId } } };
  }

  if (skillIds) {
    const ids = Array.isArray(skillIds) ? skillIds.map(Number) : skillIds.split(',').map(Number);
    if (ids.length > 0) {
      profileWhere.skills = { some: { skillId: { in: ids } } };
    }
  }

  if (serviceAreaId) {
    profileWhere.serviceAreas = { some: { serviceAreaId } };
  }

  // Text search OR conditions
  const textQuery = q?.trim();
  const orConditions: any[] = [];
  
  if (textQuery) {
    orConditions.push(
      { name: { contains: textQuery, mode: "insensitive" } },
      { profile: { bio: { contains: textQuery, mode: "insensitive" } } },
      { profile: { professionalHeadline: { contains: textQuery, mode: "insensitive" } } },
      { profile: { about: { contains: textQuery, mode: "insensitive" } } },
      { profile: { skills: { some: { skill: { name: { contains: textQuery, mode: "insensitive" } } } } } }
    );
  }

  const where: any = {
    role: "ENGINEER",
    profile: profileWhere,
  };

  if (orConditions.length > 0) {
    where.OR = orConditions;
  }

  const engineers = await db.user.findMany({
    where,
    include: {
      profile: {
        include: {
          portfolio: true,
          specializations: { include: { specialization: { include: { discipline: true } } } },
          skills: { include: { skill: true } },
          serviceAreas: { include: { serviceArea: true } },
          reviews: {
            include: { client: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  // Calculate scores and metrics for all returned engineers
  const engineersWithScores = await Promise.all(
    engineers.map(async (eng) => {
      let completedProjects = 0;
      if (eng.profile) {
        completedProjects = await db.project.count({
          where: {
            status: "COMPLETED",
            bids: { some: { engineerId: eng.profile.id, status: "ACCEPTED" } },
          },
        });
      }
      const score = calculateProfessionalScore(eng.profile, completedProjects);
      return { ...eng, completedProjects, professionalScore: score };
    })
  );

  // Sorting
  engineersWithScores.sort((a, b) => {
    switch (sortBy) {
      case "RELEVANCE":
        return b.professionalScore - a.professionalScore;
      case "HIGHEST_RATED":
        return (b.profile?.averageRating || 0) - (a.profile?.averageRating || 0);
      case "MOST_EXPERIENCED":
        return (b.profile?.yearsOfExperience || 0) - (a.profile?.yearsOfExperience || 0);
      case "NEWEST":
        return b.createdAt.getTime() - a.createdAt.getTime();
      case "MOST_REVIEWED":
        return (b.profile?.totalReviews || 0) - (a.profile?.totalReviews || 0);
      case "MOST_COMPLETED_PROJECTS":
        return b.completedProjects - a.completedProjects;
      case "LOWEST_HOURLY_RATE":
        return (Number(a.profile?.hourlyRateUSD) || 999999) - (Number(b.profile?.hourlyRateUSD) || 999999);
      case "LOWEST_STARTING_BUDGET":
        return (Number(a.profile?.startingProjectPriceUSD) || 999999) - (Number(b.profile?.startingProjectPriceUSD) || 999999);
      default:
        return b.professionalScore - a.professionalScore;
    }
  });

  // Pagination
  const paginatedEngineers = engineersWithScores.slice(skip, skip + limit);

  return {
    engineers: paginatedEngineers.map(eng => {
      const { password, ...safe } = eng;
      return safe;
    }),
    totalCount: engineersWithScores.length,
    page,
    limit,
    totalPages: Math.ceil(engineersWithScores.length / limit)
  };
}

// ── getEngineerById ───────────────────────────────────────────────────────────
// FIX: Added role guard so direct URL access cannot expose non-ENGINEER users.
export async function getEngineerById(idOrSlug: string | number) {
  const isNumeric = !isNaN(Number(idOrSlug));
  
  const engineer = await db.user.findFirst({
    where: {
      role: "ENGINEER",
      ...(isNumeric ? { id: Number(idOrSlug) } : { profile: { slug: String(idOrSlug) } }),
    },
    include: {
      profile: {
        include: {
          portfolio: {
            where: { status: "PUBLISHED" },
            include: { files: true, skills: { include: { skill: true } } }
          },
          specializations: { include: { specialization: { include: { discipline: true } } } },
          skills: { include: { skill: true } },
          serviceAreas: { include: { serviceArea: true } },
          languages: { include: { language: true } },
          certifications: { include: { certification: true } },
          reviews: {
            include: { client: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });
  if (!engineer) throw new ApiError(404, "Engineer not found");

  const profileId = engineer.profile?.id;
  let completedProjects = 0;
  if (profileId) {
    completedProjects = await db.project.count({
      where: {
        status: "COMPLETED",
        bids: { some: { engineerId: profileId, status: "ACCEPTED" } },
      },
    });

    // Increment profile views asynchronously (do not block)
    db.profileAnalytics.upsert({
      where: { engineerId: profileId },
      create: { engineerId: profileId, views: 1 },
      update: { views: { increment: 1 } }
    }).catch(console.error);
  }

  const professionalScore = calculateProfessionalScore(engineer.profile, completedProjects);

  return { ...stripPassword(engineer), completedProjects, professionalScore };
}

// ── addPortfolioItem ──────────────────────────────────────────────────────────
export async function addPortfolioItem(
  userId: number,
  data: import("./user.validation").AddPortfolioItemInput,
) {
  const profile = await db.engineerProfile.findUnique({ where: { userId } });
  if (!profile) throw new ApiError(404, "Engineer profile not found");

  const { skillIds, files, ...projectData } = data;

  return db.portfolioProject.create({
    data: {
      engineerId: profile.id,
      ...projectData,
      skills: skillIds ? {
        create: skillIds.map(id => ({ skillId: id }))
      } : undefined,
      files: files ? {
        create: files.map((f, i) => ({
          fileUrl: f.fileUrl,
          fileType: f.fileType,
          title: f.title,
          sortOrder: i
        }))
      } : undefined
    },
    include: {
      skills: { include: { skill: true } },
      files: true,
      discipline: true
    }
  });
}

// ── deletePortfolioItem ───────────────────────────────────────────────────────
export async function deletePortfolioItem(userId: number, itemId: number) {
  const [item, profile] = await Promise.all([
    db.portfolioProject.findUnique({ where: { id: itemId } }),
    db.engineerProfile.findUnique({ where: { userId } }),
  ]);

  if (!item) throw new ApiError(404, "Portfolio item not found");
  if (!profile) throw new ApiError(404, "Engineer profile not found");
  if (item.engineerId !== profile.id)
    throw new ApiError(403, "Not your portfolio item");

  await db.portfolioProject.delete({ where: { id: itemId } });
}
