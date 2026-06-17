// backend/features/users/user.service.ts
import ApiError from "../../utils/ApiError";
import type { updateProfileInput } from "./user.validation";
import db from "../../config/db";

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
  const { name, bio, coverImageUrl, nationality } = data;

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!user) throw new ApiError(404, "User not found");

  const updatedUser = await db.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined && { name }),
      // bio can be empty string (clearing the bio is valid)
      ...(bio !== undefined && user.profile
        ? { profile: { update: { bio } } }
        : {}),
      ...(coverImageUrl !== undefined && user.profile
        ? { profile: { update: { coverImageUrl } } }
        : {}),
      ...(nationality !== undefined && user.profile
        ? { profile: { update: { nationality } } }
        : {}),
    },
    // Always return the full Me shape including profile
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
export async function getEngineers(query?: {
  q?: string;
  specialty?: string;
  nationality?: string;
}) {
  const q = query?.q?.trim();

  const engineers = await db.user.findMany({
    where: {
      role: "ENGINEER",
      profile: {
        verificationStatus: "APPROVED",
        ...(query?.specialty
          ? {
              specialty: query.specialty as "CIVIL" | "ARCHITECTURAL",
            }
          : {}),
        ...(query?.nationality ? { nationality: query.nationality } : {}),
      },

      ...(q
        ? {
            OR: [
              {
                name: {
                  contains: q,
                  mode: "insensitive",
                },
              },
              {
                profile: {
                  bio: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
              },
            ],
          }
        : {}),
    },

    include: {
      profile: {
        include: {
          portfolio: true,
          reviews: {
            include: {
              client: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
    },
  });

  return engineers.map(stripPassword);
}

// ── getEngineerById ───────────────────────────────────────────────────────────
// FIX: Added role guard so direct URL access cannot expose non-ENGINEER users.
export async function getEngineerById(engineerId: number) {
  const engineer = await db.user.findUnique({
    where: {
      id: engineerId,
      role: "ENGINEER",
    },
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
  }

  return { ...stripPassword(engineer), completedProjects };
}

// ── addPortfolioItem ──────────────────────────────────────────────────────────
export async function addPortfolioItem(
  userId: number,
  data: { imageUrl: string; description: string },
) {
  const profile = await db.engineerProfile.findUnique({ where: { userId } });
  if (!profile) throw new ApiError(404, "Engineer profile not found");

  return db.portfolioItem.create({
    data: {
      engineerId: profile.id,
      imageUrl: data.imageUrl,
      description: data.description,
    },
  });
}

// ── deletePortfolioItem ───────────────────────────────────────────────────────
export async function deletePortfolioItem(userId: number, itemId: number) {
  const [item, profile] = await Promise.all([
    db.portfolioItem.findUnique({ where: { id: itemId } }),
    db.engineerProfile.findUnique({ where: { userId } }),
  ]);

  if (!item) throw new ApiError(404, "Portfolio item not found");
  if (!profile) throw new ApiError(404, "Engineer profile not found");
  if (item.engineerId !== profile.id)
    throw new ApiError(403, "Not your portfolio item");

  await db.portfolioItem.delete({ where: { id: itemId } });
}
