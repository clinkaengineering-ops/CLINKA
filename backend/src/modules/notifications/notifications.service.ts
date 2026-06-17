import db from "../../config/db";
import ApiError from "../../utils/ApiError";
import {
  mergeNotificationPrefs,
  type NotificationPrefs,
} from "../../utils/notifications";
import type { updateNotificationPrefsSchema } from "./notifications.validation";
import type { z } from "zod";

type PrefsInput = z.infer<typeof updateNotificationPrefsSchema>;

export async function getNotifications(userId: number, limit = 30) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUnreadCount(userId: number) {
  return db.notification.count({ where: { userId, read: false } });
}

export async function markNotificationRead(userId: number, id: number) {
  const n = await db.notification.findFirst({ where: { id, userId } });
  if (!n) throw new ApiError(404, "Notification not found");
  return db.notification.update({ where: { id }, data: { read: true } });
}

export async function markAllNotificationsRead(userId: number) {
  await db.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

export async function getNotificationPrefs(userId: number) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, notificationPrefs: true },
  });
  if (!user) throw new ApiError(404, "User not found");
  return mergeNotificationPrefs(
    user.role,
    user.notificationPrefs as NotificationPrefs | null,
  );
}

export async function updateNotificationPrefs(userId: number, data: PrefsInput) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, notificationPrefs: true },
  });
  if (!user) throw new ApiError(404, "User not found");

  const current = mergeNotificationPrefs(
    user.role,
    user.notificationPrefs as NotificationPrefs | null,
  );
  const merged = { ...current, ...data };

  if (user.role === "CLIENT") merged.bidAccepted = false;
  if (user.role === "ENGINEER") merged.newBid = false;

  await db.user.update({
    where: { id: userId },
    data: { notificationPrefs: merged },
  });
  return merged;
}
