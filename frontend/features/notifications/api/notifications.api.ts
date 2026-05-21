import api from "@/lib/axios";
import type { ApiResponse } from "@/features/engineers/api/engineer.api";
import type { AppNotification, NotificationPrefs } from "@/types";

const unwrap = <T>(promise: Promise<{ data: ApiResponse<T> }>) =>
  promise.then((r) => r.data.data);

export const fetchNotifications = () =>
  unwrap(api.get<ApiResponse<AppNotification[]>>("/notifications"));

export const fetchUnreadNotificationCount = () =>
  unwrap(api.get<ApiResponse<{ count: number }>>("/notifications/unread-count")).then(
    (d) => d.count,
  );

export const markNotificationRead = (id: number) =>
  unwrap(api.patch<ApiResponse<AppNotification>>(`/notifications/${id}/read`));

export const markAllNotificationsRead = () =>
  unwrap(api.patch<ApiResponse<null>>("/notifications/read-all"));

export const fetchNotificationPrefs = () =>
  unwrap(api.get<ApiResponse<NotificationPrefs>>("/notifications/prefs"));

export const updateNotificationPrefs = (prefs: NotificationPrefs) =>
  unwrap(api.put<ApiResponse<NotificationPrefs>>("/notifications/prefs", prefs));
