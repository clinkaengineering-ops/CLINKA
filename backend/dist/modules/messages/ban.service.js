"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.banUserFor30Days = banUserFor30Days;
exports.isUserBanned = isUserBanned;
exports.formatBanExpiry = formatBanExpiry;
exports.bannedUserMessage = bannedUserMessage;
exports.assertUserNotBanned = assertUserNotBanned;
const db_1 = __importDefault(require("../../config/db"));
const enums_1 = require("../../generated/prisma/enums");
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const notifications_1 = require("../../utils/notifications");
const BAN_DAYS = 30;
function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}
async function banUserFor30Days(userId, reason, bannedById, note, triggerMessage) {
    const now = new Date();
    const expiresAt = addDays(now, BAN_DAYS);
    await db_1.default.ban.upsert({
        where: { userId },
        create: {
            userId,
            reason,
            bannedAt: now,
            expiresAt,
            bannedById: bannedById ?? null,
            note: note ?? null,
            triggerMessage: triggerMessage ?? null,
            active: true,
        },
        update: {
            reason,
            bannedAt: now,
            expiresAt,
            bannedById: bannedById ?? null,
            note: note ?? null,
            triggerMessage: triggerMessage ?? null,
            active: true,
        },
    });
    const body = reason === enums_1.BanReason.CONTACT_INFO_SHARING
        ? "You have been suspended for 30 days for sharing contact information outside the platform."
        : note?.trim() ||
            "Your account has been suspended for 30 days by an administrator.";
    await (0, notifications_1.createNotification)(userId, "ACCOUNT_BANNED", "Account suspended", body, undefined, { force: true });
}
async function isUserBanned(userId) {
    const ban = await db_1.default.ban.findUnique({ where: { userId } });
    if (!ban) {
        return { banned: false, expiresAt: null };
    }
    const now = new Date();
    if (!ban.active || ban.expiresAt <= now) {
        if (ban.active && ban.expiresAt <= now) {
            await db_1.default.ban.update({
                where: { userId },
                data: { active: false },
            });
        }
        return { banned: false, expiresAt: null };
    }
    const reason = ban.reason === "CONTACT_INFO_SHARING"
        ? "Sharing contact information outside the platform"
        : ban.note || "Administrator action";
    return { banned: true, expiresAt: ban.expiresAt, reason };
}
function formatBanExpiry(expiresAt) {
    return expiresAt?.toLocaleDateString("en-EG") ?? "the expiry date";
}
function bannedUserMessage(expiresAt, action, reason) {
    const reasonText = reason ? ` Cause: ${reason}.` : "";
    return `Your account is suspended until ${formatBanExpiry(expiresAt)}.${reasonText} You cannot ${action}.`;
}
async function assertUserNotBanned(userId, action) {
    const banStatus = await isUserBanned(userId);
    if (banStatus.banned) {
        throw new ApiError_1.default(403, bannedUserMessage(banStatus.expiresAt, action, banStatus.reason));
    }
}
