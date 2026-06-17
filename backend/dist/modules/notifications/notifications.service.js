"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotifications = getNotifications;
exports.getUnreadCount = getUnreadCount;
exports.markNotificationRead = markNotificationRead;
exports.markAllNotificationsRead = markAllNotificationsRead;
exports.getNotificationPrefs = getNotificationPrefs;
exports.updateNotificationPrefs = updateNotificationPrefs;
const db_1 = __importDefault(require("../../config/db"));
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const notifications_1 = require("../../utils/notifications");
async function getNotifications(userId, limit = 30) {
    return db_1.default.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
    });
}
async function getUnreadCount(userId) {
    return db_1.default.notification.count({ where: { userId, read: false } });
}
async function markNotificationRead(userId, id) {
    const n = await db_1.default.notification.findFirst({ where: { id, userId } });
    if (!n)
        throw new ApiError_1.default(404, "Notification not found");
    return db_1.default.notification.update({ where: { id }, data: { read: true } });
}
async function markAllNotificationsRead(userId) {
    await db_1.default.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
    });
}
async function getNotificationPrefs(userId) {
    const user = await db_1.default.user.findUnique({
        where: { id: userId },
        select: { role: true, notificationPrefs: true },
    });
    if (!user)
        throw new ApiError_1.default(404, "User not found");
    return (0, notifications_1.mergeNotificationPrefs)(user.role, user.notificationPrefs);
}
async function updateNotificationPrefs(userId, data) {
    const user = await db_1.default.user.findUnique({
        where: { id: userId },
        select: { role: true, notificationPrefs: true },
    });
    if (!user)
        throw new ApiError_1.default(404, "User not found");
    const current = (0, notifications_1.mergeNotificationPrefs)(user.role, user.notificationPrefs);
    const merged = { ...current, ...data };
    if (user.role === "CLIENT")
        merged.bidAccepted = false;
    if (user.role === "ENGINEER")
        merged.newBid = false;
    await db_1.default.user.update({
        where: { id: userId },
        data: { notificationPrefs: merged },
    });
    return merged;
}
