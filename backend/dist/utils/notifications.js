"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeNotificationPrefs = mergeNotificationPrefs;
exports.createNotification = createNotification;
const db_1 = __importDefault(require("../config/db"));
const FORCE_DELIVER_TYPES = new Set(["ACCOUNT_BANNED"]);
const DEFAULT_PREFS = {
    CLIENT: { newBid: true, bidAccepted: false, fundsReleased: true, newMessage: true },
    ENGINEER: { newBid: false, bidAccepted: true, fundsReleased: true, newMessage: true },
    ADMIN: { newBid: false, bidAccepted: false, fundsReleased: false, newMessage: true },
};
const PREF_KEY = {
    NEW_BID: "newBid",
    BID_ACCEPTED: "bidAccepted",
    PAYMENT_RECEIVED: "fundsReleased",
    ESCROW_FUNDED: "fundsReleased",
    ESCROW_REFUNDED: "fundsReleased",
    FUND_REMINDER: "fundsReleased",
    FUNDS_RELEASED: "fundsReleased",
    NEW_MESSAGE: "newMessage",
    WORK_DELIVERED: "newMessage",
    WORK_SUBMITTED: "newMessage",
    REVISION_REQUESTED: "newMessage",
    WORK_APPROVED: "fundsReleased",
    PROJECT_STARTED: "bidAccepted",
    PROJECT_COMPLETED: "newMessage",
    ACCOUNT_BANNED: "newMessage",
};
function mergeNotificationPrefs(role, stored) {
    return { ...DEFAULT_PREFS[role] ?? DEFAULT_PREFS.CLIENT, ...(stored ?? {}) };
}
async function createNotification(userId, type, title, body, link, options) {
    const user = await db_1.default.user.findUnique({
        where: { id: userId },
        select: { role: true, notificationPrefs: true },
    });
    if (!user)
        return;
    const force = options?.force === true || FORCE_DELIVER_TYPES.has(type);
    if (!force) {
        const prefs = mergeNotificationPrefs(user.role, user.notificationPrefs);
        const key = PREF_KEY[type];
        if (prefs[key] === false)
            return;
    }
    await db_1.default.notification.create({
        data: { userId, type, title, body, link },
    });
}
