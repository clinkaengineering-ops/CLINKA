import db from "../config/db";
import { getPublicClientUrl } from "../config/clientUrl";
import { sendBrandedEmail } from "./sendEmail";
import { newMessageEmailHtml, notificationEmailHtml } from "./emailTemplate";

export type NotificationType =
  | "NEW_BID"
  | "BID_ACCEPTED"
  | "PAYMENT_RECEIVED"
  | "ESCROW_FUNDED"
  | "ESCROW_REFUNDED"
  | "FUND_REMINDER"
  | "FUNDS_RELEASED"
  | "FUNDS_HELD"
  | "NEW_MESSAGE"
  | "WORK_DELIVERED"
  | "WORK_SUBMITTED"
  | "REVISION_REQUESTED"
  | "WORK_APPROVED"
  | "PROJECT_STARTED"
  | "PROJECT_COMPLETED"
  | "ACCOUNT_BANNED"
  | "ENGINEER_APPLICATION_RECEIVED"
  | "ENGINEER_APPLICATION_APPROVED"
  | "ENGINEER_APPLICATION_REJECTED"
  | "PROJECT_INVITATION"
  | "INVITATION_ACCEPTED"
  | "INVITATION_DECLINED"
  | "INVITATION_CANCELLED";

const FORCE_DELIVER_TYPES = new Set<NotificationType>(["ACCOUNT_BANNED"]);
const FORCE_EMAIL_TYPES = new Set<NotificationType>(["ACCOUNT_BANNED"]);

const EMAIL_NOTIFICATION_TYPES = new Set<NotificationType>([
  "NEW_MESSAGE",
  "NEW_BID",
  "BID_ACCEPTED",
  "PAYMENT_RECEIVED",
  "ESCROW_FUNDED",
  "ESCROW_REFUNDED",
  "FUND_REMINDER",
  "FUNDS_RELEASED",
  "FUNDS_HELD",
  "WORK_SUBMITTED",
  "REVISION_REQUESTED",
  "WORK_APPROVED",
  "PROJECT_STARTED",
  "PROJECT_COMPLETED",
  "ACCOUNT_BANNED",
  "ENGINEER_APPLICATION_RECEIVED",
  "ENGINEER_APPLICATION_APPROVED",
  "ENGINEER_APPLICATION_REJECTED",
  "PROJECT_INVITATION",
  "INVITATION_ACCEPTED",
  "INVITATION_DECLINED",
  "INVITATION_CANCELLED",
]);

const EMAIL_ACTION_LABELS: Partial<Record<NotificationType, string>> = {
  NEW_MESSAGE: "View Message",
  NEW_BID: "View Bids",
  BID_ACCEPTED: "Open Project",
  PAYMENT_RECEIVED: "View Escrow",
  ESCROW_FUNDED: "Open Project",
  ESCROW_REFUNDED: "View Balance",
  FUND_REMINDER: "Fund Escrow",
  FUNDS_RELEASED: "View Balance",
  FUNDS_HELD: "View Balance",
  WORK_SUBMITTED: "Review Work",
  REVISION_REQUESTED: "View Project",
  WORK_APPROVED: "View Balance",
  PROJECT_STARTED: "Open Project",
  PROJECT_COMPLETED: "View Project",
  ACCOUNT_BANNED: "Open CLINKA",
  ENGINEER_APPLICATION_RECEIVED: "View Application",
  ENGINEER_APPLICATION_APPROVED: "Open Dashboard",
  ENGINEER_APPLICATION_REJECTED: "Open Dashboard",
  PROJECT_INVITATION: "View Invitations",
  INVITATION_ACCEPTED: "Open Project",
  INVITATION_DECLINED: "Open Project",
  INVITATION_CANCELLED: "View Invitations",
};

export interface NotificationPrefs {
  newBid?: boolean;
  bidAccepted?: boolean;
  fundsReleased?: boolean;
  newMessage?: boolean;
}

export interface CreateNotificationOptions {
  force?: boolean;
  skipEmail?: boolean;
  email?: {
    senderName?: string;
    projectTitle?: string;
  };
}

const DEFAULT_PREFS: Record<string, NotificationPrefs> = {
  CLIENT: { newBid: true, bidAccepted: false, fundsReleased: true, newMessage: true },
  ENGINEER: { newBid: false, bidAccepted: true, fundsReleased: true, newMessage: true },
  ADMIN: { newBid: false, bidAccepted: false, fundsReleased: false, newMessage: true },
};

const PREF_KEY: Record<NotificationType, keyof NotificationPrefs> = {
  NEW_BID: "newBid",
  BID_ACCEPTED: "bidAccepted",
  PAYMENT_RECEIVED: "fundsReleased",
  ESCROW_FUNDED: "fundsReleased",
  ESCROW_REFUNDED: "fundsReleased",
  FUND_REMINDER: "fundsReleased",
  FUNDS_RELEASED: "fundsReleased",
  FUNDS_HELD: "fundsReleased",
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
  PROJECT_INVITATION: "newMessage",
  INVITATION_ACCEPTED: "newMessage",
  INVITATION_DECLINED: "newMessage",
  INVITATION_CANCELLED: "newMessage",
};

export function mergeNotificationPrefs(
  role: string,
  stored: NotificationPrefs | null,
): NotificationPrefs {
  return { ...DEFAULT_PREFS[role] ?? DEFAULT_PREFS.CLIENT, ...(stored ?? {}) };
}

function clientBaseUrl() {
  return getPublicClientUrl();
}

function buildActionUrl(link?: string) {
  if (!link) return clientBaseUrl();
  if (link.startsWith("http")) return link;
  return `${clientBaseUrl()}${link.startsWith("/") ? link : `/${link}`}`;
}

function shouldSendEmail(
  type: NotificationType,
  force: boolean,
  prefs: NotificationPrefs,
) {
  if (!EMAIL_NOTIFICATION_TYPES.has(type)) return false;
  if (!process.env.EMAIL_USER?.trim()) return false;
  if (optionsForceEmail(type, force)) return true;
  const key = PREF_KEY[type];
  return prefs[key] !== false;
}

function optionsForceEmail(type: NotificationType, force: boolean) {
  return force || FORCE_EMAIL_TYPES.has(type);
}

async function dispatchNotificationEmail(
  email: string,
  type: NotificationType,
  title: string,
  body?: string,
  link?: string,
  emailExtras?: CreateNotificationOptions["email"],
) {
  const actionUrl = buildActionUrl(link);
  const actionLabel = EMAIL_ACTION_LABELS[type];

  if (type === "NEW_MESSAGE" && emailExtras?.senderName) {
    const projectTitle = emailExtras.projectTitle ?? "a project";
    await sendBrandedEmail({
      to: email,
      subject: `New message from ${emailExtras.senderName}`,
      html: newMessageEmailHtml({
        senderName: emailExtras.senderName,
        projectTitle,
        messageUrl: actionUrl,
      }),
      text: `You have received a new message from ${emailExtras.senderName} regarding the project ${projectTitle}. View it here: ${actionUrl}`,
    });
    return;
  }

  await sendBrandedEmail({
    to: email,
    subject: `CLINKA: ${title}`,
    html: notificationEmailHtml({
      title,
      body,
      actionUrl: link ? actionUrl : undefined,
      actionLabel,
    }),
    text: [title, body, link ? `Open: ${actionUrl}` : ""].filter(Boolean).join("\n\n"),
  });
}

export async function createNotification(
  userId: number,
  type: NotificationType,
  title: string,
  body?: string,
  link?: string,
  options?: CreateNotificationOptions,
) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, notificationPrefs: true, email: true },
  });
  if (!user) return;

  const force = options?.force === true || FORCE_DELIVER_TYPES.has(type);
  const prefs = mergeNotificationPrefs(
    user.role,
    user.notificationPrefs as NotificationPrefs | null,
  );

  if (!force) {
    const key = PREF_KEY[type];
    if (prefs[key] === false) return;
  }

  await db.notification.create({
    data: { userId, type, title, body, link },
  });

  if (options?.skipEmail || !user.email) return;

  if (!shouldSendEmail(type, force, prefs)) return;

  dispatchNotificationEmail(
    user.email,
    type,
    title,
    body,
    link,
    options?.email,
  ).catch((error) => {
    console.error(
      `Failed to send notification email (${type}) to user ${userId}:`,
      error instanceof Error ? error.message : error,
    );
  });
}
