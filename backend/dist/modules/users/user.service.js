"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = getMe;
exports.updateMe = updateMe;
exports.updateAvatar = updateAvatar;
exports.updateCoverImage = updateCoverImage;
exports.getEngineers = getEngineers;
exports.getEngineerById = getEngineerById;
exports.addPortfolioItem = addPortfolioItem;
exports.deletePortfolioItem = deletePortfolioItem;
// backend/features/users/user.service.ts
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const db_1 = __importDefault(require("../../config/db"));
// ── Helper: strip password from any user object ───────────────────────────────
function stripPassword({ password: _, ...safe }) {
    return safe;
}
// ── getMe ─────────────────────────────────────────────────────────────────────
async function getMe(userId) {
    const user = await db_1.default.user.findUnique({
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
    if (!user)
        throw new ApiError_1.default(404, "User not found");
    return stripPassword(user);
}
// ── updateMe ──────────────────────────────────────────────────────────────────
// FIX 1: Always includes profile in the response so the frontend Me type is complete.
// FIX 2: bio can be "" (empty string) — use `bio !== undefined` not `bio &&`.
async function updateMe(userId, data) {
    const { name, bio, coverImageUrl } = data;
    const user = await db_1.default.user.findUnique({
        where: { id: userId },
        include: { profile: true },
    });
    if (!user)
        throw new ApiError_1.default(404, "User not found");
    const updatedUser = await db_1.default.user.update({
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
async function updateAvatar(userId, avatarUrl) {
    const user = await db_1.default.user.update({
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
async function updateCoverImage(userId, coverImageUrl) {
    const profile = await db_1.default.engineerProfile.findUnique({ where: { userId } });
    if (!profile)
        throw new ApiError_1.default(404, "Engineer profile not found");
    await db_1.default.engineerProfile.update({
        where: { userId },
        data: { coverImageUrl },
    });
    return getMe(userId);
}
// ── getEngineers ──────────────────────────────────────────────────────────────
async function getEngineers(query) {
    const q = query?.q?.trim();
    const engineers = await db_1.default.user.findMany({
        where: {
            role: "ENGINEER",
            profile: {
                verificationStatus: "APPROVED",
                ...(query?.specialty ? { specialty: query.specialty } : {}),
            },
            ...(q
                ? {
                    OR: [
                        { name: { contains: q, mode: "insensitive" } },
                        { profile: { bio: { contains: q, mode: "insensitive" } } },
                    ],
                }
                : {}),
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
    return engineers.map(stripPassword);
}
// ── getEngineerById ───────────────────────────────────────────────────────────
// FIX: Added role guard so direct URL access cannot expose non-ENGINEER users.
async function getEngineerById(engineerId) {
    const engineer = await db_1.default.user.findUnique({
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
    if (!engineer)
        throw new ApiError_1.default(404, "Engineer not found");
    const profileId = engineer.profile?.id;
    let completedProjects = 0;
    if (profileId) {
        completedProjects = await db_1.default.project.count({
            where: {
                status: "COMPLETED",
                bids: { some: { engineerId: profileId, status: "ACCEPTED" } },
            },
        });
    }
    return { ...stripPassword(engineer), completedProjects };
}
// ── addPortfolioItem ──────────────────────────────────────────────────────────
async function addPortfolioItem(userId, data) {
    const profile = await db_1.default.engineerProfile.findUnique({ where: { userId } });
    if (!profile)
        throw new ApiError_1.default(404, "Engineer profile not found");
    return db_1.default.portfolioItem.create({
        data: {
            engineerId: profile.id,
            imageUrl: data.imageUrl,
            description: data.description,
        },
    });
}
// ── deletePortfolioItem ───────────────────────────────────────────────────────
async function deletePortfolioItem(userId, itemId) {
    const [item, profile] = await Promise.all([
        db_1.default.portfolioItem.findUnique({ where: { id: itemId } }),
        db_1.default.engineerProfile.findUnique({ where: { userId } }),
    ]);
    if (!item)
        throw new ApiError_1.default(404, "Portfolio item not found");
    if (!profile)
        throw new ApiError_1.default(404, "Engineer profile not found");
    if (item.engineerId !== profile.id)
        throw new ApiError_1.default(403, "Not your portfolio item");
    await db_1.default.portfolioItem.delete({ where: { id: itemId } });
}
