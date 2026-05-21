"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeNotificationPrefs = mergeNotificationPrefs;
exports.createNotification = createNotification;
const db_1 = __importDefault(require("../config/db"));
const DEFAULT_PREFS = {
    CLIENT: { newBid: true, bidAccepted: false, fundsReleased: true, newMessage: true },
    ENGINEER: { newBid: false, bidAccepted: true, fundsReleased: true, newMessage: true },
    ADMIN: { newBid: false, bidAccepted: false, fundsReleased: false, newMessage: true },
};
const PREF_KEY = {
    NEW_BID: "newBid",
    BID_ACCEPTED: "bidAccepted",
    FUNDS_RELEASED: "fundsReleased",
    NEW_MESSAGE: "newMessage",
};
function mergeNotificationPrefs(role, stored) {
    return { ...DEFAULT_PREFS[role] ?? DEFAULT_PREFS.CLIENT, ...(stored ?? {}) };
}
async function createNotification(userId, type, title, body, link) {
    const user = await db_1.default.user.findUnique({
        where: { id: userId },
        select: { role: true, notificationPrefs: true },
    });
    if (!user)
        return;
    const prefs = mergeNotificationPrefs(user.role, user.notificationPrefs);
    const key = PREF_KEY[type];
    if (prefs[key] === false)
        return;
    await db_1.default.notification.create({
        data: { userId, type, title, body, link },
    });
}
