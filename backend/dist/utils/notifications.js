"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeNotificationPrefs = mergeNotificationPrefs;
exports.createNotification = createNotification;
const db_1 = __importDefault(require("../config/db"));
const clientUrl_1 = require("../config/clientUrl");
const sendEmail_1 = require("./sendEmail");
const emailTemplate_1 = require("./emailTemplate");
const FORCE_DELIVER_TYPES = new Set(["ACCOUNT_BANNED"]);
const FORCE_EMAIL_TYPES = new Set(["ACCOUNT_BANNED"]);
const EMAIL_NOTIFICATION_TYPES = new Set([
    "NEW_MESSAGE",
    "NEW_BID",
    "BID_ACCEPTED",
    "PAYMENT_RECEIVED",
    "ESCROW_FUNDED",
    "ESCROW_REFUNDED",
    "FUND_REMINDER",
    "FUNDS_RELEASED",
    "WORK_SUBMITTED",
    "REVISION_REQUESTED",
    "WORK_APPROVED",
    "PROJECT_STARTED",
    "PROJECT_COMPLETED",
    "ACCOUNT_BANNED",
    "ENGINEER_APPLICATION_RECEIVED",
    "ENGINEER_APPLICATION_APPROVED",
    "ENGINEER_APPLICATION_REJECTED",
]);
const EMAIL_ACTION_LABELS = {
    NEW_MESSAGE: "View Message",
    NEW_BID: "View Bids",
    BID_ACCEPTED: "Open Project",
    PAYMENT_RECEIVED: "View Escrow",
    ESCROW_FUNDED: "Open Project",
    ESCROW_REFUNDED: "View Balance",
    FUND_REMINDER: "Fund Escrow",
    FUNDS_RELEASED: "View Balance",
    WORK_SUBMITTED: "Review Work",
    REVISION_REQUESTED: "View Project",
    WORK_APPROVED: "View Balance",
    PROJECT_STARTED: "Open Project",
    PROJECT_COMPLETED: "View Project",
    ACCOUNT_BANNED: "Open CLINKA",
    ENGINEER_APPLICATION_RECEIVED: "View Application",
    ENGINEER_APPLICATION_APPROVED: "Open Dashboard",
    ENGINEER_APPLICATION_REJECTED: "Open Dashboard",
};
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
    ENGINEER_APPLICATION_RECEIVED: "newMessage",
    ENGINEER_APPLICATION_APPROVED: "newMessage",
    ENGINEER_APPLICATION_REJECTED: "newMessage",
};
function mergeNotificationPrefs(role, stored) {
    return { ...DEFAULT_PREFS[role] ?? DEFAULT_PREFS.CLIENT, ...(stored ?? {}) };
}
function clientBaseUrl() {
    return (0, clientUrl_1.getPublicClientUrl)();
}
function buildActionUrl(link) {
    if (!link)
        return clientBaseUrl();
    if (link.startsWith("http"))
        return link;
    return `${clientBaseUrl()}${link.startsWith("/") ? link : `/${link}`}`;
}
function shouldSendEmail(type, force, prefs) {
    if (!EMAIL_NOTIFICATION_TYPES.has(type))
        return false;
    if (!process.env.EMAIL_USER?.trim())
        return false;
    if (optionsForceEmail(type, force))
        return true;
    const key = PREF_KEY[type];
    return prefs[key] !== false;
}
function optionsForceEmail(type, force) {
    return force || FORCE_EMAIL_TYPES.has(type);
}
async function dispatchNotificationEmail(email, type, title, body, link, emailExtras) {
    const actionUrl = buildActionUrl(link);
    const actionLabel = EMAIL_ACTION_LABELS[type];
    if (type === "NEW_MESSAGE" && emailExtras?.senderName) {
        const projectTitle = emailExtras.projectTitle ?? "a project";
        await (0, sendEmail_1.sendBrandedEmail)({
            to: email,
            subject: `New message from ${emailExtras.senderName}`,
            html: (0, emailTemplate_1.newMessageEmailHtml)({
                senderName: emailExtras.senderName,
                projectTitle,
                messageUrl: actionUrl,
            }),
            text: `You have received a new message from ${emailExtras.senderName} regarding the project ${projectTitle}. View it here: ${actionUrl}`,
        });
        return;
    }
    await (0, sendEmail_1.sendBrandedEmail)({
        to: email,
        subject: `CLINKA: ${title}`,
        html: (0, emailTemplate_1.notificationEmailHtml)({
            title,
            body,
            actionUrl: link ? actionUrl : undefined,
            actionLabel,
        }),
        text: [title, body, link ? `Open: ${actionUrl}` : ""].filter(Boolean).join("\n\n"),
    });
}
async function createNotification(userId, type, title, body, link, options) {
    const user = await db_1.default.user.findUnique({
        where: { id: userId },
        select: { role: true, notificationPrefs: true, email: true },
    });
    if (!user)
        return;
    const force = options?.force === true || FORCE_DELIVER_TYPES.has(type);
    const prefs = mergeNotificationPrefs(user.role, user.notificationPrefs);
    if (!force) {
        const key = PREF_KEY[type];
        if (prefs[key] === false)
            return;
    }
    await db_1.default.notification.create({
        data: { userId, type, title, body, link },
    });
    if (options?.skipEmail || !user.email)
        return;
    if (!shouldSendEmail(type, force, prefs))
        return;
    dispatchNotificationEmail(user.email, type, title, body, link, options?.email).catch((error) => {
        console.error(`Failed to send notification email (${type}) to user ${userId}:`, error instanceof Error ? error.message : error);
    });
}
