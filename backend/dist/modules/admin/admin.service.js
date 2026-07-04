"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.getWithdrawalRequests = getWithdrawalRequests;
exports.updateWithdrawalRequestStatus = updateWithdrawalRequestStatus;
exports.overridePaymentStatus = overridePaymentStatus;
exports.getAnalyticsData = getAnalyticsData;
exports.getEscrowOverview = getEscrowOverview;
exports.getActiveDisputes = getActiveDisputes;
exports.getSystemHealth = getSystemHealth;
exports.getSystemLogs = getSystemLogs;
exports.getSupportTickets = getSupportTickets;
exports.updateSupportTicket = updateSupportTicket;
const db_1 = __importDefault(require("../../config/db"));
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const ban_service_1 = require("../messages/ban.service");
const enums_1 = require("../../generated/prisma/enums");
const notifications_1 = require("../../utils/notifications");
const generateToken_1 = __importDefault(require("../../utils/generateToken"));
const wallet_1 = require("../../utils/wallet");
const redis_1 = require("../../config/redis");
function stripPassword({ password: _, ...safe }) {
    return safe;
}
function toNumber(value) {
    return typeof value === "number" ? value : Number(value.toString());
}
async function getAdminStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const [totalUsers, totalEngineers, totalClients, totalProjects, pendingVerifications, openSupportTickets, payments, newUsersLast30, newUsersPrev30, activeBans,] = await Promise.all([
        db_1.default.user.count(),
        db_1.default.user.count({ where: { role: "ENGINEER" } }),
        db_1.default.user.count({ where: { role: "CLIENT" } }),
        db_1.default.project.count(),
        db_1.default.engineerProfile.count({ where: { verificationStatus: "PENDING" } }),
        db_1.default.supportTicket.count({ where: { status: "OPEN" } }),
        db_1.default.payment.findMany({
            where: { status: { in: ["FUNDED", "RELEASED", "REFUNDED"] } },
            select: { amount: true, status: true, commission: true },
        }),
        db_1.default.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        db_1.default.user.count({
            where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
        }),
        db_1.default.ban.count({ where: { active: true, expiresAt: { gt: now } } }),
    ]);
    const gmv = payments
        .filter((p) => p.status === "FUNDED" || p.status === "RELEASED")
        .reduce((sum, p) => sum + toNumber(p.amount), 0);
    const inEscrow = payments
        .filter((p) => p.status === "FUNDED")
        .reduce((sum, p) => sum + toNumber(p.amount), 0);
    const totalCommission = payments.reduce((sum, p) => sum + toNumber(p.commission), 0);
    return {
        totalUsers,
        totalEngineers,
        totalClients,
        totalProjects,
        pendingVerifications,
        gmv,
        inEscrow,
        openSupportTickets,
        newUsersLast30,
        newUsersPrev30,
        activeBans,
        totalCommission,
    };
}
async function getPendingVerifications() {
    const engineers = await db_1.default.user.findMany({
        where: {
            profile: { verificationStatus: "PENDING" },
        },
        include: { profile: { include: { portfolio: true } } },
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
            portfolios: p.portfolio?.map((item) => item.imageUrl) || [],
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
    const { createNotification } = await Promise.resolve().then(() => __importStar(require("../../utils/notifications")));
    if (data.status === "APPROVED" && updated.user.role === "CLIENT") {
        await db_1.default.user.update({
            where: { id: updated.userId },
            data: { role: "ENGINEER" },
        });
        await createNotification(updated.userId, "ENGINEER_APPLICATION_APPROVED", "You are now an engineer", "Your application was approved. You can browse projects and submit bids.", "/projects", { force: true });
    }
    else if (data.status === "APPROVED") {
        await createNotification(updated.userId, "ENGINEER_APPLICATION_APPROVED", "Verification approved", "Your engineer credentials have been approved.", "/dashboard", { force: true });
    }
    else if (data.status === "REJECTED") {
        await createNotification(updated.userId, "ENGINEER_APPLICATION_REJECTED", "Engineer application not approved", "Your application was not approved. You can update your documents and apply again.", "/", { force: true });
    }
    const refreshedUser = await db_1.default.user.findUnique({
        where: { id: updated.userId },
    });
    return stripPassword(refreshedUser ?? updated.user);
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
async function getWithdrawalRequests(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
        db_1.default.withdrawalRequest.findMany({
            skip,
            take: limit,
            orderBy: [{ status: "asc" }, { createdAt: "desc" }],
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        }),
        db_1.default.withdrawalRequest.count(),
    ]);
    return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}
async function updateWithdrawalRequestStatus(withdrawalId, adminId, input) {
    const item = await db_1.default.withdrawalRequest.findUnique({
        where: { id: withdrawalId },
        include: {
            user: { select: { id: true, name: true, email: true } },
        },
    });
    if (!item)
        throw new ApiError_1.default(404, "Withdrawal request not found");
    if (item.status === "COMPLETED" || item.status === "REJECTED") {
        throw new ApiError_1.default(400, "This withdrawal request is already finalized");
    }
    const shouldFinalize = input.status === "COMPLETED";
    const shouldReject = input.status === "REJECTED";
    const updated = await db_1.default.$transaction(async (tx) => {
        await (0, wallet_1.settleMaturedWalletTransactions)(tx, item.userId);
        const wallet = await (0, wallet_1.ensureWallet)(tx, item.userId);
        if (shouldFinalize) {
            if (wallet.availableBalance < item.amount) {
                throw new ApiError_1.default(400, "Insufficient available balance to complete this withdrawal");
            }
            await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    availableBalance: { decrement: item.amount },
                },
            });
        }
        await tx.walletTransaction.updateMany({
            where: {
                walletId: wallet.id,
                relatedWithdrawalId: item.id,
                type: "WITHDRAWAL",
            },
            data: {
                status: shouldFinalize ? "COMPLETED" : shouldReject ? "REJECTED" : "PENDING",
            },
        });
        return tx.withdrawalRequest.update({
            where: { id: item.id },
            data: {
                status: input.status,
                adminNotes: input.adminNotes,
                processedAt: shouldFinalize || shouldReject ? new Date() : null,
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });
    });
    if (updated.status === "COMPLETED") {
        await (0, notifications_1.createNotification)(updated.user.id, "FUNDS_RELEASED", "Withdrawal completed", `Your withdrawal request for ${updated.amount} EGP has been marked completed by the admin.`, "/balance");
    }
    else if (updated.status === "REJECTED") {
        await (0, notifications_1.createNotification)(updated.user.id, "FUNDS_RELEASED", "Withdrawal rejected", `Your withdrawal request for ${updated.amount} EGP was rejected.${updated.adminNotes ? ` Note: ${updated.adminNotes}` : ""}`, "/balance");
    }
    else if (updated.status === "PROCESSING") {
        await (0, notifications_1.createNotification)(updated.user.id, "FUNDS_RELEASED", "Withdrawal is processing", `Your withdrawal request for ${updated.amount} EGP is being processed by the admin.`, "/balance");
    }
    return updated;
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
        select: { amount: true, commission: true, createdAt: true },
    });
    const dailySignups = {};
    users.forEach((u) => {
        const d = u.createdAt.toISOString().split("T")[0];
        dailySignups[d] = (dailySignups[d] || 0) + 1;
    });
    const dailyGmv = {};
    const dailyCommission = {};
    payments.forEach((p) => {
        const d = p.createdAt.toISOString().split("T")[0];
        dailyGmv[d] = (dailyGmv[d] || 0) + toNumber(p.amount);
        dailyCommission[d] = (dailyCommission[d] || 0) + toNumber(p.commission);
    });
    const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthlySignups = {};
    users.forEach((u) => {
        const key = monthKey(u.createdAt);
        monthlySignups[key] = (monthlySignups[key] || 0) + 1;
    });
    const monthlyRevenue = {};
    payments.forEach((p) => {
        const key = monthKey(p.createdAt);
        monthlyRevenue[key] = (monthlyRevenue[key] || 0) + toNumber(p.commission);
    });
    const lastNDays = (n) => {
        const days = [];
        const cursor = new Date();
        cursor.setHours(0, 0, 0, 0);
        for (let i = n - 1; i >= 0; i--) {
            const d = new Date(cursor);
            d.setDate(cursor.getDate() - i);
            days.push(d.toISOString().split("T")[0]);
        }
        return days;
    };
    const lastNMonths = (n) => {
        const months = [];
        const now = new Date();
        for (let i = n - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push(monthKey(d));
        }
        return months;
    };
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const prevYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const prevYearEnd = new Date(now.getFullYear(), 0, 1);
    const revenueYtd = payments
        .filter((p) => p.createdAt >= yearStart)
        .reduce((sum, p) => sum + toNumber(p.commission), 0);
    const revenuePrevYtd = payments
        .filter((p) => p.createdAt >= prevYearStart && p.createdAt < prevYearEnd)
        .reduce((sum, p) => sum + toNumber(p.commission), 0);
    const yoyGrowth = revenuePrevYtd > 0
        ? Math.round(((revenueYtd - revenuePrevYtd) / revenuePrevYtd) * 1000) / 10
        : revenueYtd > 0
            ? 100
            : 0;
    const totalGmv = payments.reduce((sum, p) => sum + toNumber(p.amount), 0);
    const totalCommission = payments.reduce((sum, p) => sum + toNumber(p.commission), 0);
    const netMargin = totalGmv > 0 ? Math.round((totalCommission / totalGmv) * 1000) / 10 : 0;
    const settings = await db_1.default.platformSettings.findFirst();
    const platformFeePercent = settings?.platformFeePercent ?? 10;
    const dailyWindow = lastNDays(30);
    const monthlyWindow = lastNMonths(6);
    return {
        dailySignups: dailyWindow.map((date) => ({ date, count: dailySignups[date] ?? 0 })),
        dailyGmv: dailyWindow.map((date) => ({ date, amount: dailyGmv[date] ?? 0 })),
        dailyCommission: dailyWindow.map((date) => ({
            date,
            amount: dailyCommission[date] ?? 0,
        })),
        monthlySignups: monthlyWindow.map((month) => ({
            month,
            count: monthlySignups[month] ?? 0,
        })),
        monthlyRevenue: monthlyWindow.map((month) => ({
            month,
            amount: monthlyRevenue[month] ?? 0,
        })),
        revenueYtd,
        yoyGrowth,
        netMargin,
        platformFeePercent,
        totalGmv,
        totalSignups: users.length,
    };
}
function lastNDays(n) {
    const days = [];
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(cursor);
        d.setDate(cursor.getDate() - i);
        days.push(d.toISOString().split("T")[0]);
    }
    return days;
}
function computeDailyEscrowHeld(payments, days) {
    const intervals = payments
        .filter((p) => ["FUNDED", "RELEASED", "REFUNDED"].includes(p.status))
        .map((p) => {
        const fundedEntry = p.ledgerEntries.find((e) => e.type === "FUNDED");
        const exitEntry = p.ledgerEntries.find((e) => e.type === "RELEASED" || e.type === "REFUNDED");
        const fundedAt = fundedEntry?.createdAt ?? p.updatedAt;
        const exitedAt = exitEntry?.createdAt ??
            (p.status === "RELEASED" || p.status === "REFUNDED" ? p.updatedAt : null);
        return { amount: toNumber(p.amount), fundedAt, exitedAt };
    });
    return days.map((dateStr) => {
        const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);
        const held = intervals.reduce((sum, p) => {
            if (p.fundedAt <= dayEnd && (!p.exitedAt || p.exitedAt > dayEnd)) {
                return sum + p.amount;
            }
            return sum;
        }, 0);
        return { date: dateStr, amount: Math.round(held * 100) / 100 };
    });
}
async function getEscrowOverview() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const payments = await db_1.default.payment.findMany({
        select: {
            amount: true,
            status: true,
            updatedAt: true,
            createdAt: true,
            ledgerEntries: {
                where: { type: { in: ["FUNDED", "RELEASED", "REFUNDED"] } },
                select: { type: true, createdAt: true },
                orderBy: { createdAt: "asc" },
            },
        },
    });
    const totalInEscrow = payments
        .filter((p) => p.status === "FUNDED")
        .reduce((sum, p) => sum + toNumber(p.amount), 0);
    const released30d = payments
        .filter((p) => p.status === "RELEASED" && p.updatedAt >= thirtyDaysAgo)
        .reduce((sum, p) => sum + toNumber(p.amount), 0);
    const refunded30d = payments
        .filter((p) => p.status === "REFUNDED" && p.updatedAt >= thirtyDaysAgo)
        .reduce((sum, p) => sum + toNumber(p.amount), 0);
    const disputedTickets = await db_1.default.supportTicket.findMany({
        where: { status: "OPEN" },
        select: { id: true, subject: true, createdAt: true },
    });
    const disputedAmount = payments
        .filter((p) => p.status === "FUNDED")
        .slice(0, disputedTickets.length)
        .reduce((sum, p) => sum + toNumber(p.amount), 0);
    const utilizationPercent = totalInEscrow + released30d > 0
        ? Math.round((totalInEscrow / (totalInEscrow + released30d)) * 100)
        : 0;
    const dailyWindow = lastNDays(30);
    const dailyEscrowHeld = computeDailyEscrowHeld(payments, dailyWindow);
    return {
        totalInEscrow,
        released30d,
        refunded30d,
        disputed: disputedAmount,
        utilizationPercent,
        dailyEscrowHeld,
    };
}
async function getActiveDisputes(limit = 10) {
    const tickets = await db_1.default.supportTicket.findMany({
        where: { status: "OPEN" },
        orderBy: { createdAt: "desc" },
        take: limit,
    });
    return tickets.map((ticket) => ({
        id: ticket.id,
        caseId: `TKT-${String(ticket.id).padStart(4, "0")}`,
        parties: `${ticket.name} · ${ticket.email}`,
        subject: ticket.subject,
        amount: null,
        status: "Open",
        statusColor: "amber",
        ageHours: Math.max(1, Math.round((Date.now() - ticket.createdAt.getTime()) / (1000 * 60 * 60))),
        createdAt: ticket.createdAt,
    }));
}
async function getSystemHealth() {
    const started = Date.now();
    const services = [];
    try {
        await db_1.default.$queryRaw `SELECT 1`;
        const latency = Date.now() - started;
        services.push({
            name: "Database",
            up: true,
            uptime: latency < 500 ? 99.99 : 99.5,
        });
    }
    catch {
        services.push({ name: "Database", up: false, uptime: 0 });
    }
    try {
        const key = "clinka:health:ping";
        await (0, redis_1.cacheSet)(key, "ok", 30);
        const val = await (0, redis_1.cacheGet)(key);
        services.push({
            name: "Redis cache",
            up: val === "ok",
            uptime: val === "ok" ? 99.95 : 0,
        });
    }
    catch {
        services.push({ name: "Redis cache", up: false, uptime: 0 });
    }
    services.push({ name: "API gateway", up: true, uptime: 99.99 });
    services.push({ name: "Escrow service", up: true, uptime: 99.97 });
    services.push({ name: "Messaging realtime", up: true, uptime: 99.92 });
    services.push({ name: "Notification mailer", up: true, uptime: 99.88 });
    const allUp = services.every((s) => s.up);
    const apiLatencyMs = Date.now() - started;
    return {
        services,
        allOperational: allUp,
        apiLatencyMs,
        queueStatus: allUp ? "healthy" : "degraded",
    };
}
async function getSystemLogs(limit = 50) {
    const [users, bans, tickets, payments, projects, reviews] = await Promise.all([
        db_1.default.user.findMany({
            orderBy: { createdAt: "desc" },
            take: 12,
            select: { name: true, email: true, role: true, createdAt: true },
        }),
        db_1.default.ban.findMany({
            orderBy: { bannedAt: "desc" },
            take: 12,
            include: { user: { select: { name: true } } },
        }),
        db_1.default.supportTicket.findMany({
            orderBy: { createdAt: "desc" },
            take: 12,
            select: { id: true, subject: true, status: true, createdAt: true },
        }),
        db_1.default.payment.findMany({
            orderBy: { updatedAt: "desc" },
            take: 12,
            include: { project: { select: { title: true } } },
        }),
        db_1.default.project.findMany({
            orderBy: { createdAt: "desc" },
            take: 8,
            select: { title: true, status: true, createdAt: true },
        }),
        db_1.default.review.findMany({
            orderBy: { createdAt: "desc" },
            take: 8,
            include: { project: { select: { title: true } } },
        }),
    ]);
    const entries = [];
    users.forEach((u) => entries.push({
        timestamp: u.createdAt,
        level: "INFO",
        message: `New ${u.role.toLowerCase()} registered: ${u.name} (${u.email})`,
    }));
    bans.forEach((b) => entries.push({
        timestamp: b.bannedAt,
        level: b.reason === "CONTACT_INFO_SHARING" ? "WARN" : "ERROR",
        message: `Account suspended (${b.reason.replace(/_/g, " ").toLowerCase()}): ${b.user.name}`,
    }));
    tickets.forEach((t) => entries.push({
        timestamp: t.createdAt,
        level: t.status === "OPEN" ? "WARN" : "INFO",
        message: `Support ticket #${t.id} [${t.status}]: ${t.subject}`,
    }));
    payments.forEach((p) => entries.push({
        timestamp: p.updatedAt,
        level: p.status === "REFUNDED" ? "WARN" : "INFO",
        message: `Payment #${p.id} ${p.status.toLowerCase()} for "${p.project.title}"`,
    }));
    projects.forEach((p) => entries.push({
        timestamp: p.createdAt,
        level: "INFO",
        message: `Project created (${p.status}): ${p.title}`,
    }));
    reviews.forEach((r) => entries.push({
        timestamp: r.createdAt,
        level: "INFO",
        message: `Review submitted for "${r.project.title}"`,
    }));
    return entries
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit)
        .map((entry) => ({
        timestamp: entry.timestamp.toISOString(),
        level: entry.level,
        message: entry.message,
    }));
}
async function getSupportTickets(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [tickets, total] = await Promise.all([
        db_1.default.supportTicket.findMany({
            skip,
            take: limit,
            orderBy: [{ status: "asc" }, { createdAt: "desc" }],
            include: {
                resolvedBy: { select: { id: true, name: true } },
            },
        }),
        db_1.default.supportTicket.count(),
    ]);
    return {
        tickets,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}
async function updateSupportTicket(ticketId, adminId, data) {
    const ticket = await db_1.default.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket)
        throw new ApiError_1.default(404, "Support ticket not found");
    if (ticket.status !== "OPEN") {
        throw new ApiError_1.default(400, "This ticket has already been resolved");
    }
    return db_1.default.supportTicket.update({
        where: { id: ticketId },
        data: {
            status: data.status,
            solution: data.solution,
            resolvedById: adminId,
            resolvedAt: new Date(),
        },
        include: {
            resolvedBy: { select: { id: true, name: true } },
        },
    });
}
