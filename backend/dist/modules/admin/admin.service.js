"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminStats = getAdminStats;
exports.getPendingVerifications = getPendingVerifications;
exports.updateEngineerVerification = updateEngineerVerification;
exports.getAllBans = getAllBans;
exports.banUserManually = banUserManually;
exports.unbanUser = unbanUser;
exports.lookupUser = lookupUser;
exports.impersonateUser = impersonateUser;
exports.updateEngineerProfileByAdmin = updateEngineerProfileByAdmin;
exports.getAllConversations = getAllConversations;
exports.getConversationMessages = getConversationMessages;
exports.getAllProjects = getAllProjects;
exports.updateProjectByAdmin = updateProjectByAdmin;
exports.getAllReviews = getAllReviews;
exports.deleteReviewByAdmin = deleteReviewByAdmin;
exports.getPlatformSettings = getPlatformSettings;
exports.updatePlatformSettings = updatePlatformSettings;
exports.getAllPayments = getAllPayments;
exports.overridePaymentStatus = overridePaymentStatus;
exports.getAnalyticsData = getAnalyticsData;
exports.getSystemLogs = getSystemLogs;
const db_1 = __importDefault(require("../../config/db"));
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const ban_service_1 = require("../messages/ban.service");
const enums_1 = require("../../generated/prisma/enums");
const notifications_1 = require("../../utils/notifications");
const generateToken_1 = __importDefault(require("../../utils/generateToken"));
function stripPassword({ password: _, ...safe }) {
    return safe;
}
async function getAdminStats() {
    const [totalUsers, totalEngineers, totalClients, totalProjects, pendingVerifications, payments,] = await Promise.all([
        db_1.default.user.count(),
        db_1.default.user.count({ where: { role: "ENGINEER" } }),
        db_1.default.user.count({ where: { role: "CLIENT" } }),
        db_1.default.project.count(),
        db_1.default.engineerProfile.count({ where: { verificationStatus: "PENDING" } }),
        db_1.default.payment.findMany({
            where: { status: { in: ["FUNDED", "RELEASED"] } },
            select: { amount: true, status: true },
        }),
    ]);
    const gmv = payments.reduce((sum, p) => sum + p.amount, 0);
    const inEscrow = payments
        .filter((p) => p.status === "FUNDED")
        .reduce((sum, p) => sum + p.amount, 0);
    return {
        totalUsers,
        totalEngineers,
        totalClients,
        totalProjects,
        pendingVerifications,
        gmv,
        inEscrow,
        openDisputes: 0,
    };
}
async function getPendingVerifications() {
    const engineers = await db_1.default.user.findMany({
        where: {
            role: "ENGINEER",
            profile: { verificationStatus: "PENDING" },
        },
        include: { profile: true },
        orderBy: { createdAt: "desc" },
    });
    return engineers.map((e) => {
        const p = e.profile;
        const docType = p.syndicateCardUrl
            ? "Syndicate Card"
            : p.collegeIdUrl
                ? "College ID"
                : p.certificateUrl
                    ? "Certificate"
                    : "Document";
        return {
            profileId: p.id,
            userId: e.id,
            name: e.name,
            email: e.email,
            specialty: p.specialty,
            documentType: docType,
            collegeIdUrl: p.collegeIdUrl,
            certificateUrl: p.certificateUrl,
            syndicateCardUrl: p.syndicateCardUrl,
            submittedAt: p.createdAt,
        };
    });
}
async function updateEngineerVerification(profileId, data) {
    const profile = await db_1.default.engineerProfile.findUnique({
        where: { id: profileId },
        include: { user: true },
    });
    if (!profile)
        throw new ApiError_1.default(404, "Engineer profile not found");
    const updated = await db_1.default.engineerProfile.update({
        where: { id: profileId },
        data: { verificationStatus: data.status },
        include: { user: true },
    });
    return stripPassword(updated.user);
}
function formatLastMessagePreview(message) {
    const text = message.content.trim();
    if (text)
        return text;
    if (message.attachmentUrl) {
        return message.attachmentName
            ? `📎 ${message.attachmentName}`
            : "📎 Attachment";
    }
    return null;
}
async function getAllBans() {
    const bans = await db_1.default.ban.findMany({
        include: {
            user: { select: { id: true, name: true, email: true, role: true } },
            bannedBy: { select: { id: true, name: true } },
        },
        orderBy: { bannedAt: "desc" },
    });
    const now = new Date();
    return bans.map((ban) => ({
        id: ban.id,
        userId: ban.userId,
        userName: ban.user.name,
        userEmail: ban.user.email,
        userRole: ban.user.role,
        reason: ban.reason,
        bannedAt: ban.bannedAt,
        expiresAt: ban.expiresAt,
        active: ban.active && ban.expiresAt > now,
        note: ban.note,
        triggerMessage: ban.triggerMessage,
        bannedById: ban.bannedById,
        bannedByName: ban.bannedBy?.name ?? null,
    }));
}
async function banUserManually(adminId, targetUserId, note) {
    const target = await db_1.default.user.findUnique({ where: { id: targetUserId } });
    if (!target)
        throw new ApiError_1.default(404, "User not found");
    if (target.role === "ADMIN") {
        throw new ApiError_1.default(400, "Cannot ban an administrator");
    }
    await (0, ban_service_1.banUserFor30Days)(targetUserId, enums_1.BanReason.MANUAL_BAN, adminId, note);
    return { userId: targetUserId };
}
async function unbanUser(adminId, targetUserId) {
    const ban = await db_1.default.ban.findUnique({ where: { userId: targetUserId } });
    if (!ban)
        throw new ApiError_1.default(404, "No ban record for this user");
    await db_1.default.ban.update({
        where: { userId: targetUserId },
        data: { active: false },
    });
    await (0, notifications_1.createNotification)(targetUserId, "ACCOUNT_BANNED", "Account restored", "Your account suspension has been lifted.", undefined, { force: true });
    return { userId: targetUserId, unbannedBy: adminId };
}
async function lookupUser(identifier) {
    const trimmed = identifier.trim();
    const asId = Number(trimmed);
    if (!Number.isNaN(asId) && asId > 0) {
        const byId = await db_1.default.user.findUnique({
            where: { id: asId },
            select: { id: true, name: true, email: true, role: true },
        });
        if (byId)
            return byId;
    }
    const byEmail = await db_1.default.user.findUnique({
        where: { email: trimmed.toLowerCase() },
        select: { id: true, name: true, email: true, role: true },
    });
    if (!byEmail)
        throw new ApiError_1.default(404, "User not found");
    return byEmail;
}
async function impersonateUser(targetUserId) {
    const target = await db_1.default.user.findUnique({ where: { id: targetUserId } });
    if (!target)
        throw new ApiError_1.default(404, "User not found");
    if (target.role === "ADMIN") {
        throw new ApiError_1.default(400, "Cannot impersonate an administrator");
    }
    const token = (0, generateToken_1.default)(target.id, target.role);
    return { user: stripPassword(target), token };
}
async function updateEngineerProfileByAdmin(userId, data) {
    const profile = await db_1.default.engineerProfile.findUnique({ where: { userId } });
    if (!profile)
        throw new ApiError_1.default(404, "Engineer profile not found");
    const updated = await db_1.default.engineerProfile.update({
        where: { userId },
        data: {
            ...(data.specialty && { specialty: data.specialty }),
            ...(data.bio !== undefined && { bio: data.bio }),
        },
        include: { user: true }
    });
    return stripPassword(updated.user);
}
async function getAllConversations(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [conversations, total] = await Promise.all([
        db_1.default.conversation.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                project: { select: { id: true, title: true } },
                client: { select: { id: true, name: true } },
                engineer: { select: { id: true, name: true } },
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
                _count: { select: { messages: true } },
            },
        }),
        db_1.default.conversation.count(),
    ]);
    return {
        conversations: conversations.map((conv) => {
            const last = conv.messages[0] ?? null;
            return {
                id: conv.id,
                projectId: conv.projectId,
                projectTitle: conv.project.title,
                clientId: conv.clientId,
                clientName: conv.client.name,
                engineerId: conv.engineerId,
                engineerName: conv.engineer.name,
                lastMessage: last ? formatLastMessagePreview(last) : null,
                lastMessageAt: last?.createdAt ?? conv.createdAt,
                messageCount: conv._count.messages,
            };
        }),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}
async function getConversationMessages(conversationId, page = 1, limit = 50) {
    const conv = await db_1.default.conversation.findUnique({
        where: { id: conversationId },
    });
    if (!conv)
        throw new ApiError_1.default(404, "Conversation not found");
    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([
        db_1.default.message.findMany({
            where: { conversationId },
            include: {
                sender: { select: { id: true, name: true, role: true } },
            },
            orderBy: { createdAt: "asc" },
            skip,
            take: limit,
        }),
        db_1.default.message.count({ where: { conversationId } }),
    ]);
    return {
        messages,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        conversation: {
            id: conv.id,
            projectId: conv.projectId,
            clientId: conv.clientId,
            engineerId: conv.engineerId,
        },
    };
}
async function getAllProjects(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [projects, total] = await Promise.all([
        db_1.default.project.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                client: { select: { name: true, email: true } },
            },
        }),
        db_1.default.project.count(),
    ]);
    return {
        projects,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}
async function updateProjectByAdmin(projectId, data) {
    return await db_1.default.project.update({
        where: { id: projectId },
        data,
    });
}
async function getAllReviews(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
        db_1.default.review.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                client: { select: { name: true } },
                engineer: { include: { user: { select: { name: true } } } },
                project: { select: { title: true } },
            },
        }),
        db_1.default.review.count(),
    ]);
    return {
        reviews,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}
async function deleteReviewByAdmin(reviewId) {
    await db_1.default.review.delete({ where: { id: reviewId } });
}
async function getPlatformSettings() {
    let settings = await db_1.default.platformSettings.findFirst();
    if (!settings) {
        settings = await db_1.default.platformSettings.create({
            data: { platformFeePercent: 10.0 },
        });
    }
    return settings;
}
async function updatePlatformSettings(data) {
    let settings = await db_1.default.platformSettings.findFirst();
    if (!settings) {
        return await db_1.default.platformSettings.create({ data });
    }
    return await db_1.default.platformSettings.update({
        where: { id: settings.id },
        data,
    });
}
async function getAllPayments(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
        db_1.default.payment.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                client: { select: { name: true, email: true } },
                engineer: { include: { user: { select: { name: true, email: true } } } },
                project: { select: { title: true } },
            },
        }),
        db_1.default.payment.count(),
    ]);
    return {
        payments,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}
async function overridePaymentStatus(paymentId, status) {
    return await db_1.default.payment.update({
        where: { id: paymentId },
        data: { status },
    });
}
async function getAnalyticsData() {
    const users = await db_1.default.user.findMany({ select: { createdAt: true } });
    const payments = await db_1.default.payment.findMany({
        where: { status: { in: ["FUNDED", "RELEASED"] } },
        select: { amount: true, createdAt: true },
    });
    const dailySignups = {};
    users.forEach((u) => {
        const d = u.createdAt.toISOString().split("T")[0];
        dailySignups[d] = (dailySignups[d] || 0) + 1;
    });
    const dailyGmv = {};
    payments.forEach((p) => {
        const d = p.createdAt.toISOString().split("T")[0];
        dailyGmv[d] = (dailyGmv[d] || 0) + p.amount;
    });
    return {
        dailySignups: Object.entries(dailySignups).map(([date, count]) => ({ date, count })),
        dailyGmv: Object.entries(dailyGmv).map(([date, amount]) => ({ date, amount })),
    };
}
async function getSystemLogs() {
    // In a real app, read from a log file like Winston or Pino.
    // For MVP demonstration, return mock recent events.
    return [
        { timestamp: new Date().toISOString(), level: "INFO", message: "Admin dashboard accessed." },
        { timestamp: new Date(Date.now() - 3600000).toISOString(), level: "WARN", message: "Stripe webhook failed - Retrying." },
        { timestamp: new Date(Date.now() - 7200000).toISOString(), level: "ERROR", message: "Database connection timeout in GET /projects." },
        { timestamp: new Date(Date.now() - 86400000).toISOString(), level: "INFO", message: "Server restarted successfully." },
    ];
}
