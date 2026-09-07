import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../../middlewares/auth.middleware";
import ApiResponse from "../../utils/ApiResponse";
import { updateNotificationPrefsSchema } from "./notifications.validation";
import {
  getNotificationPrefs,
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPrefs,
} from "./notifications.service";

export async function listNotificationsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const items = await getNotifications(req.user!.userId);
    res.status(200).json(ApiResponse(200, "OK", items));
  } catch (e) {
    next(e);
  }
}

export async function unreadCountController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const count = await getUnreadCount(req.user!.userId);
    res.status(200).json(ApiResponse(200, "OK", { count }));
  } catch (e) {
    next(e);
  }
}

export async function markReadController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const item = await markNotificationRead(
      req.user!.userId,
      Number(req.params.id),
    );
    res.status(200).json(ApiResponse(200, "OK", item));
  } catch (e) {
    next(e);
  }
}

export async function markAllReadController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    await markAllNotificationsRead(req.user!.userId);
    res.status(200).json(ApiResponse(200, "OK", null));
  } catch (e) {
    next(e);
  }
}

export async function getPrefsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const prefs = await getNotificationPrefs(req.user!.userId);
    res.status(200).json(ApiResponse(200, "OK", prefs));
  } catch (e) {
    next(e);
  }
}

export async function updatePrefsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = updateNotificationPrefsSchema.parse(req.body);
    const prefs = await updateNotificationPrefs(req.user!.userId, data);
    res.status(200).json(ApiResponse(200, "OK", prefs));
  } catch (e) {
    next(e);
  }
}
