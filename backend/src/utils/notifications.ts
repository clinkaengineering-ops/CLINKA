import db from "../config/db";

export type NotificationType =
  | "NEW_BID"
  | "BID_ACCEPTED"
  | "FUNDS_RELEASED"
  | "NEW_MESSAGE";

export interface NotificationPrefs {
  newBid?: boolean;
  bidAccepted?: boolean;
  fundsReleased?: boolean;
  newMessage?: boolean;
}

const DEFAULT_PREFS: Record<string, NotificationPrefs> = {
  CLIENT: { newBid: true, bidAccepted: false, fundsReleased: true, newMessage: true },
  ENGINEER: { newBid: false, bidAccepted: true, fundsReleased: true, newMessage: true },
  ADMIN: { newBid: false, bidAccepted: false, fundsReleased: false, newMessage: true },
};

const PREF_KEY: Record<NotificationType, keyof NotificationPrefs> = {
  NEW_BID: "newBid",
  BID_ACCEPTED: "bidAccepted",
  FUNDS_RELEASED: "fundsReleased",
  NEW_MESSAGE: "newMessage",
};

export function mergeNotificationPrefs(
  role: string,
  stored: NotificationPrefs | null,
): NotificationPrefs {
  return { ...DEFAULT_PREFS[role] ?? DEFAULT_PREFS.CLIENT, ...(stored ?? {}) };
}

export async function createNotification(
  userId: number,
  type: NotificationType,
  title: string,
  body?: string,
  link?: string,
) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, notificationPrefs: true },
  });
  if (!user) return;

  const prefs = mergeNotificationPrefs(
    user.role,
    user.notificationPrefs as NotificationPrefs | null,
  );
  const key = PREF_KEY[type];
  if (prefs[key] === false) return;

  await db.notification.create({
    data: { userId, type, title, body, link },
  });
}
