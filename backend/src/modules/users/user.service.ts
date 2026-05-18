import ApiError from "../../utils/ApiError";
import { AddPortfolioItemInput, updateProfileInput } from "./user.validation";
import db from "../../config/db";


export async function getMe(userId: number) {
    const user = await db.user.findUnique({
        where: { id: userId },
        include: { profile: true },
    });
    if (!user) throw new ApiError(404, "User not found");

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
}
export async function updateMe(userId: number, data: updateProfileInput) {
  const { name, bio } = data;
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  const updatedUser = await db.user.update({
    where: { id: userId },
    data: {
      ...(name && { name }), // only update if provided
      ...(bio && {
        profile: {
          update: { bio }, // update nested EngineerProfile
        },
      }),
    },
  });

  const { password: _, ...safe } = updatedUser;
  return safe;
}

export async function getEngineers() {
  const engineers = await db.user.findMany({
    where: {
      role: "ENGINEER",
      profile: {
        verificationStatus: "APPROVED",
      },
    },
    include: {
      profile: {
        include: {
          portfolio: true,
          reviews: true,
        },
      },
    },
  });

  return engineers.map(({ password: _, ...safe }) => safe);
}

export async function getEngineerById(engineerId: number) {
  const engineer = await db.user.findUnique({
    where: { id: engineerId },
    include: { profile: {
        include:
        {
            portfolio: true,
            reviews: true
        }
    } },
  });
  if (!engineer) throw new ApiError(404, "Engineer not found");
  const { password: _, ...safe } = engineer;
  return safe;
}

export async function addPortfolioItem(
  userId: number,
  data: AddPortfolioItemInput,
) {
  const profile = await db.engineerProfile.findUnique({ where: { userId } });
  if (!profile) throw new ApiError(404, "Engineer profile not found");

  const item = await db.portfolioItem.create({
    data: {
      engineerId: profile.id, // ← profile.id not userId
      imageUrl: data.imageUrl,
      description: data.description,
    },
  });
  return item;
}

export async function deletePortfolioItem(userId :number, itemId:number ) {
  const item = await db.portfolioItem.findUnique({ where: { id: itemId } });
  if (!item) throw new ApiError(404, "Portfolio item not found");

  // find this user's profile
  const profile = await db.engineerProfile.findUnique({ where: { userId } });
  if (!profile) throw new ApiError(404, "Profile not found");

  // check ownership — does this item belong to THIS engineer?
  if (item.engineerId !== profile.id) {
    throw new ApiError(403, "Not your portfolio item");
  }

  await db.portfolioItem.delete({ where: { id: itemId } });
}
